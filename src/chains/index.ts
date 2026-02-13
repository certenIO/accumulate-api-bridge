/**
 * Chain Handler Registration & Barrel Export
 *
 * Imports all chain handlers, registers them with the registry,
 * and re-exports registry functions for use by server.ts.
 */

import { registerChainHandler, getChainHandler, getAllChainHandlers, getRegisteredChainIds } from './registry.js';
import { createEvmHandlers } from './evm.handler.js';
import { createSolanaHandler } from './solana.handler.js';
import { createAptosHandler } from './aptos.handler.js';
import { createSuiHandler } from './sui.handler.js';
import { createNearHandler } from './near.handler.js';
import { createTonHandler } from './ton.handler.js';
import { createTronHandler } from './tron.handler.js';

// Register all EVM handlers
for (const handler of createEvmHandlers()) {
  registerChainHandler(handler);
}

// Register non-EVM handlers
registerChainHandler(createSolanaHandler());
registerChainHandler(createAptosHandler());
registerChainHandler(createSuiHandler());
registerChainHandler(createNearHandler());
registerChainHandler(createTonHandler());
registerChainHandler(createTronHandler());

// Log registered chains at import time
const allIds = getRegisteredChainIds();
console.log(`🔗 Registered ${getAllChainHandlers().length} chain handlers (${allIds.length} chain IDs): ${allIds.join(', ')}`);

// Re-export registry functions
export { getChainHandler, getAllChainHandlers, getRegisteredChainIds };
export type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult, AddressBalanceResult } from './types.js';
