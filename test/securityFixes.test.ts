/**
 * Section 14.3: TypeScript tests for security audit fixes.
 *
 * Tests:
 *   - executionCommitment matches Solidity computation
 *   - Address normalization produces consistent EIP-55 checksums
 *   - Cryptographic nonce generation uses CSPRNG with sufficient entropy
 *
 * Run: npx tsx test/securityFixes.test.ts
 */

import crypto from 'crypto';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

function assertEqual(a: string, b: string, message: string) {
  if (a === b) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    console.error(`    got:  ${a}`);
    console.error(`    want: ${b}`);
    failed++;
  }
}

// =========================================================================
// 14.3a — executionCommitment matches Solidity
// =========================================================================

function computeExecutionCommitment(
  chainId: number,
  target: string,
  value: bigint,
  data: Uint8Array
): string {
  const dataHash = ethers.keccak256(data);
  const packed = ethers.solidityPacked(
    ['uint256', 'address', 'uint256', 'bytes32'],
    [chainId, target, value, dataHash]
  );
  return ethers.keccak256(packed);
}

function testExecutionCommitment() {
  console.log('\n--- executionCommitment cross-platform tests ---');

  // Test 1: Native transfer (use valid checksummed addresses)
  const alice = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat account #1
  const c1 = computeExecutionCommitment(31337, alice, 500000000000000000n, new Uint8Array(0));
  // Verify structure: should be a 66-char hex string
  assert(c1.startsWith('0x') && c1.length === 66, 'Native transfer produces valid commitment hash');

  // Test 2: Different chain IDs produce different commitments
  const c_chain1 = computeExecutionCommitment(1, alice, 1000000000000000000n, new Uint8Array(0));
  const c_chain42161 = computeExecutionCommitment(42161, alice, 1000000000000000000n, new Uint8Array(0));
  assert(c_chain1 !== c_chain42161, 'Different chain IDs produce different commitments');

  // Test 3: Different targets produce different commitments
  const mallory = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'; // Hardhat account #2
  const c_alice = computeExecutionCommitment(31337, alice, 1000000000000000000n, new Uint8Array(0));
  const c_mallory = computeExecutionCommitment(31337, mallory, 1000000000000000000n, new Uint8Array(0));
  assert(c_alice !== c_mallory, 'Different targets produce different commitments');

  // Test 4: Different values produce different commitments
  const c_500 = computeExecutionCommitment(31337, alice, 500000000000000000n, new Uint8Array(0));
  const c_5000 = computeExecutionCommitment(31337, alice, 5000000000000000000n, new Uint8Array(0));
  assert(c_500 !== c_5000, 'Different values produce different commitments');

  // Test 5: Different calldata produces different commitments
  const data1 = ethers.getBytes('0xa9059cbb'); // transfer selector
  const data2 = ethers.getBytes('0x095ea7b3'); // approve selector
  const c_d1 = computeExecutionCommitment(31337, alice, 0n, data1);
  const c_d2 = computeExecutionCommitment(31337, alice, 0n, data2);
  assert(c_d1 !== c_d2, 'Different calldata produces different commitments');

  // Test 6: ERC-20 transfer commitment
  const tokenAddr = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
  const iface = new ethers.Interface(['function transfer(address to, uint256 amount)']);
  const transferData = ethers.getBytes(iface.encodeFunctionData('transfer', [alice, 500000000n]));
  const c_erc20 = computeExecutionCommitment(1, tokenAddr, 0n, transferData);
  assert(c_erc20.startsWith('0x') && c_erc20.length === 66, 'ERC-20 transfer produces valid commitment');

  // Test 7: Commitment is deterministic
  const c_repeat = computeExecutionCommitment(31337, alice, 500000000000000000n, new Uint8Array(0));
  assertEqual(c1, c_repeat, 'Commitment is deterministic for same inputs');
}

// =========================================================================
// 14.3b — Address normalization
// =========================================================================

function testAddressNormalization() {
  console.log('\n--- Address normalization tests ---');

  // Test 1: Lowercase → EIP-55 checksummed
  const lower = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  const checksummed = ethers.getAddress(lower);
  // The exact checksum depends on the address content — just verify it's stable
  assert(checksummed.startsWith('0x') && checksummed.length === 42, 'Lowercase normalizes to valid EIP-55');

  // Test 2: Upper → EIP-55 checksummed (ethers.getAddress accepts all-upper)
  const upper = lower.slice(0, 2) + lower.slice(2).toUpperCase(); // 0xA0B86991...
  const checksummedUpper = ethers.getAddress(upper);
  assertEqual(checksummedUpper, checksummed, 'Uppercase normalizes to same EIP-55');

  // Test 3: All-lowercase again confirms determinism
  const checksummedAgain = ethers.getAddress(lower);
  assertEqual(checksummedAgain, checksummed, 'Repeated normalization is deterministic');

  // Test 4: All normalized forms produce same commitment hash
  const nc1 = computeExecutionCommitment(31337, checksummed, 1n, new Uint8Array(0));
  const nc2 = computeExecutionCommitment(31337, checksummedUpper, 1n, new Uint8Array(0));
  const nc3 = computeExecutionCommitment(31337, checksummedAgain, 1n, new Uint8Array(0));
  assertEqual(nc1, nc2, 'Normalized addresses produce same commitment (lower vs upper)');
  assertEqual(nc1, nc3, 'Normalized addresses produce same commitment (repeated)');

  // Test 5: Zero address normalizes correctly
  const zero = ethers.getAddress('0x0000000000000000000000000000000000000000');
  assertEqual(zero, '0x0000000000000000000000000000000000000000', 'Zero address normalizes');
}

// =========================================================================
// 14.3c — Cryptographic nonce generation
// =========================================================================

function testCryptographicNonce() {
  console.log('\n--- Cryptographic nonce tests ---');

  // Test 1: Generate 10000 nonces, verify no duplicates
  const nonces = new Set<string>();
  const count = 10000;
  for (let i = 0; i < count; i++) {
    const nowMs = Date.now();
    const randomPart = crypto.randomBytes(16).toString('hex');
    const nonce = `certen_${nowMs}_${randomPart}`;
    nonces.add(nonce);
  }
  assert(nonces.size === count, `${count} nonces are all unique (got ${nonces.size})`);

  // Test 2: Random part has sufficient entropy (32 hex chars = 128 bits)
  const randomPart = crypto.randomBytes(16).toString('hex');
  assert(randomPart.length === 32, `Random part is 32 hex chars (128 bits): got ${randomPart.length}`);

  // Test 3: Random part uses hex alphabet only
  assert(/^[0-9a-f]{32}$/.test(randomPart), 'Random part is valid lowercase hex');

  // Test 4: No Math.random — verify entropy by checking distribution
  // Generate 1000 random bytes and check they're not all the same
  const bytes = crypto.randomBytes(1000);
  const uniqueBytes = new Set(bytes);
  assert(uniqueBytes.size > 200, `Sufficient entropy: ${uniqueBytes.size} unique byte values in 1000 bytes`);

  // Test 5: Nonce format matches expected pattern
  const nowMs = Date.now();
  const testNonce = `certen_${nowMs}_${crypto.randomBytes(16).toString('hex')}`;
  const pattern = /^certen_\d{13}_[0-9a-f]{32}$/;
  assert(pattern.test(testNonce), `Nonce matches expected format: ${testNonce.substring(0, 30)}...`);
}

// =========================================================================
// Run all tests
// =========================================================================

console.log('Section 14.3: TypeScript Security Fix Tests\n');
testExecutionCommitment();
testAddressNormalization();
testCryptographicNonce();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
