/**
 * Chain Handler Registry
 *
 * Central registry for chain handlers. Supports lookup by chain name
 * or numeric chain ID. Used by server.ts endpoints to route requests
 * to the correct chain handler.
 */

import type { ChainHandler } from './types.js';

const handlers = new Map<string, ChainHandler>();

/**
 * Register a chain handler for all its chain IDs.
 * Overwrites any existing handler for the same chain ID.
 */
export function registerChainHandler(handler: ChainHandler): void {
  for (const id of handler.chainIds) {
    handlers.set(id.toLowerCase(), handler);
  }
}

/**
 * Look up a chain handler by chain ID (name or numeric).
 * Returns undefined if no handler is registered for the given ID.
 */
export function getChainHandler(chainId: string): ChainHandler | undefined {
  return handlers.get(chainId.toLowerCase()) || handlers.get(chainId);
}

/**
 * Get all registered chain handlers (deduplicated).
 * Since a handler registers under multiple IDs, this returns unique handlers.
 */
export function getAllChainHandlers(): ChainHandler[] {
  const seen = new Set<ChainHandler>();
  const result: ChainHandler[] = [];
  for (const handler of handlers.values()) {
    if (!seen.has(handler)) {
      seen.add(handler);
      result.push(handler);
    }
  }
  return result;
}

/**
 * Get all registered chain IDs.
 */
export function getRegisteredChainIds(): string[] {
  return Array.from(handlers.keys());
}
