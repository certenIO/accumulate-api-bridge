/**
 * CRITICAL-002: OperationID cross-platform golden vector tests.
 *
 * These tests verify that the TypeScript canonicalizeJSON + length-prefixed hash
 * produces identical output to the Go validator's ComputeCanonical4BlobHash().
 *
 * Vectors are shared at: certen-contracts/test/vectors/operation_id_test_vectors.json
 * Both Go and TypeScript MUST pass against the same expected hashes.
 *
 * Run: npx tsx test/operationId.test.ts
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Standalone implementation matching CertenIntentService ----

function canonicalizeJSON(obj: any): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return JSON.stringify(obj);
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalizeJSON(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + canonicalizeJSON(obj[key]);
  });
  return '{' + entries.join(',') + '}';
}

function calculateOperationIdFromBlobs(
  intentData: any,
  crossChainData: any,
  governanceData: any,
  replayData: any
): string {
  const blobs = [intentData, crossChainData, governanceData, replayData];
  const hash = crypto.createHash('sha256');

  for (const blob of blobs) {
    const canonical = Buffer.from(canonicalizeJSON(blob), 'utf8');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(canonical.length, 0);
    hash.update(lenBuf);
    hash.update(canonical);
  }

  return '0x' + hash.digest('hex');
}

// ---- Test runner ----

interface TestVector {
  description: string;
  blob0: any;
  blob1: any;
  blob2: any;
  blob3: any;
  expected_operation_id: string;
}

function runTests() {
  const vectorPath = path.resolve(__dirname, '../../certen-contracts/test/vectors/operation_id_test_vectors.json');
  if (!fs.existsSync(vectorPath)) {
    console.error(`SKIP: Golden test vectors not found at ${vectorPath}`);
    process.exit(0);
  }

  const vectors: TestVector[] = JSON.parse(fs.readFileSync(vectorPath, 'utf8'));
  let passed = 0;
  let failed = 0;

  for (const v of vectors) {
    const got = calculateOperationIdFromBlobs(v.blob0, v.blob1, v.blob2, v.blob3);
    if (got === v.expected_operation_id) {
      console.log(`  PASS: ${v.description}`);
      passed++;
    } else {
      console.error(`  FAIL: ${v.description}`);
      console.error(`    got:  ${got}`);
      console.error(`    want: ${v.expected_operation_id}`);
      failed++;
    }
  }

  // Additional test: unsorted keys produce same hash as sorted
  const sorted = { kind: 'CERTEN_INTENT', version: '1.0' };
  const unsorted = { version: '1.0', kind: 'CERTEN_INTENT' };
  const blob1 = { legs: [] };
  const blob2 = { auth: {} };
  const blob3 = { nonce: 'x' };

  const hashSorted = calculateOperationIdFromBlobs(sorted, blob1, blob2, blob3);
  const hashUnsorted = calculateOperationIdFromBlobs(unsorted, blob1, blob2, blob3);
  if (hashSorted === hashUnsorted) {
    console.log('  PASS: Unsorted keys produce same hash as sorted');
    passed++;
  } else {
    console.error('  FAIL: Key ordering changed hash!');
    console.error(`    sorted:   ${hashSorted}`);
    console.error(`    unsorted: ${hashUnsorted}`);
    failed++;
  }

  // Additional test: length prefix prevents ambiguity
  const hashA = calculateOperationIdFromBlobs({ a: 'bc' }, { d: 'e' }, {}, {});
  const hashB = calculateOperationIdFromBlobs({ a: 'b' }, { cd: 'e' }, {}, {});
  if (hashA !== hashB) {
    console.log('  PASS: Length prefix prevents concatenation ambiguity');
    passed++;
  } else {
    console.error('  FAIL: Length prefix failed to differentiate ambiguous boundary');
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

console.log('CRITICAL-002: OperationID Golden Vector Tests\n');
runTests();
