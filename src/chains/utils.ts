/**
 * Shared Chain Handler Utilities
 *
 * Common derivation functions used across multiple chain handlers.
 */

import { ethers } from 'ethers';

/**
 * Validate an ADI URL format.
 * @throws Error if the URL is invalid
 */
export function validateAdiUrl(adiUrl: string): void {
  if (!adiUrl || typeof adiUrl !== 'string') {
    throw new Error('ADI URL is required');
  }
  if (!adiUrl.startsWith('acc://')) {
    throw new Error('Invalid ADI URL format. Must start with acc://');
  }
}

/**
 * Compute keccak256 hash of an ADI URL as a hex string (with 0x prefix).
 */
export function adiUrlHash(adiUrl: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(adiUrl));
}

/**
 * Derive a deterministic EVM "owner" address from an ADI URL.
 * Takes the last 20 bytes of keccak256(adiUrl).
 */
export function deriveEvmOwner(adiUrl: string): string {
  const hash = adiUrlHash(adiUrl);
  return ethers.getAddress('0x' + hash.slice(-40));
}

/**
 * Derive a full 32-byte owner hash from an ADI URL.
 * Used by non-EVM chains that accept 32-byte identifiers.
 * Returns the raw hex string without 0x prefix.
 */
export function deriveOwnerBytes32(adiUrl: string): string {
  const hash = adiUrlHash(adiUrl);
  return hash.slice(2); // remove 0x prefix, full 32 bytes
}

/**
 * Derive a u256 salt from an ADI URL (full keccak256 as BigInt).
 * Used by EVM and TRON chains.
 */
export function deriveSaltU256(adiUrl: string): bigint {
  return BigInt(adiUrlHash(adiUrl));
}

/**
 * Derive a u64 salt from an ADI URL.
 * Used by Aptos, Sui, and NEAR which use u64 salt fields.
 * Truncates keccak256 hash to fit u64.
 */
export function deriveSaltU64(adiUrl: string): bigint {
  return BigInt(adiUrlHash(adiUrl)) % (2n ** 64n);
}
