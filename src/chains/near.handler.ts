/**
 * NEAR Testnet Chain Handler
 *
 * Uses NEAR's subaccount model for deterministic account creation.
 * Factory contract: certen-factory.testnet
 *
 * The contract's create_account(owner, owner_eth, adi_url, salt) expects:
 *   - owner: AccountId (64-char hex implicit account = deriveOwnerBytes32)
 *   - owner_eth: String (EVM address = deriveEvmOwner)
 *   - adi_url: String
 *   - salt: u64 (JSON number — must fit in JS Number.MAX_SAFE_INTEGER)
 *
 * Uses near-api-js v7 (JsonRpcProvider + Account class).
 */

import { JsonRpcProvider, Account, KeyPair, KeyPairSigner } from 'near-api-js';
import { createHash } from 'crypto';
import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult, AddressBalanceResult } from './types.js';
import { deriveOwnerBytes32, deriveEvmOwner, adiUrlHash } from './utils.js';

const CHAIN_IDS = ['near-testnet'];
const CHAIN_NAME = 'NEAR Testnet';
const EXPLORER_URL = 'https://testnet.nearblocks.io';

/**
 * Derive a u64 salt that fits within JS Number.MAX_SAFE_INTEGER.
 * Truncates keccak256 to 53 bits so it can be serialized as a JSON number.
 * The NEAR contract expects salt: u64 via serde JSON (not U64 string wrapper).
 */
function deriveSafeSalt(adiUrl: string): number {
  const hash = adiUrlHash(adiUrl);
  const full = BigInt(hash);
  // Truncate to 53 bits (Number.MAX_SAFE_INTEGER = 2^53 - 1)
  const safe = full % (2n ** 53n);
  return Number(safe);
}

/**
 * Compute keccak256 locally to match the contract's derive_account_id.
 * The contract does: keccak256(owner.as_bytes() + adi_url.as_bytes() + salt.to_le_bytes())
 */
function keccak256Bytes(data: Buffer): Buffer {
  return createHash('sha3-256').update(data).digest();
}

export class NearChainHandler implements ChainHandler {
  readonly chainIds = CHAIN_IDS;
  readonly chainName = CHAIN_NAME;
  private factoryAccount: string;
  private rpcUrl: string;

  constructor() {
    this.factoryAccount = process.env.NEAR_FACTORY_ACCOUNT || 'certen-factory.testnet';
    this.rpcUrl = process.env.NEAR_TESTNET_RPC_URL || 'https://rpc.testnet.fastnear.com';
  }

  isSponsorConfigured(): boolean {
    return process.env.NEAR_SPONSORED_DEPLOYMENT_ENABLED === 'true' &&
      !!process.env.NEAR_SPONSOR_PRIVATE_KEY &&
      !!process.env.NEAR_SPONSOR_ACCOUNT_ID;
  }

  private getProvider(): JsonRpcProvider {
    return new JsonRpcProvider({ url: this.rpcUrl });
  }

  /**
   * Derive the owner AccountId (64-char hex = NEAR implicit account).
   */
  private deriveOwner(adiUrl: string): string {
    return deriveOwnerBytes32(adiUrl);
  }

  /**
   * Derive the owner's EVM address (for owner_eth parameter).
   */
  private deriveOwnerEth(adiUrl: string): string {
    return deriveEvmOwner(adiUrl);
  }

  /**
   * Compute the deterministic sub-account ID locally.
   * Matches the contract's derive_account_id:
   *   keccak256(owner_bytes + adi_url_bytes + salt_le_bytes) -> first 16 bytes hex
   *   -> "{hex}.certen-factory.testnet"
   */
  private computeAccountId(adiUrl: string): string {
    const owner = this.deriveOwner(adiUrl);
    const salt = deriveSafeSalt(adiUrl);

    // Match contract: hasher.update(owner.as_bytes()) — owner is a string, use its UTF-8 bytes
    const ownerBytes = Buffer.from(owner, 'utf-8');
    const adiBytes = Buffer.from(adiUrl, 'utf-8');
    // salt.to_le_bytes() — u64 as 8 little-endian bytes
    const saltBytes = Buffer.alloc(8);
    saltBytes.writeBigUInt64LE(BigInt(salt));

    const data = Buffer.concat([ownerBytes, adiBytes, saltBytes]);
    const hash = keccak256Bytes(data);
    // First 16 bytes as hex
    const prefix = hash.subarray(0, 16).toString('hex');
    return `${prefix}.${this.factoryAccount}`;
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const provider = this.getProvider();

    // Try to query the factory's view function via RPC (no signer needed)
    try {
      const args = {
        owner: this.deriveOwner(adiUrl),
        adi_url: adiUrl,
        salt: deriveSafeSalt(adiUrl),
      };
      const argsBase64 = Buffer.from(JSON.stringify(args)).toString('base64');
      const response = await (provider as any).query({
        request_type: 'call_function',
        account_id: this.factoryAccount,
        method_name: 'get_account_id',
        args_base64: argsBase64,
        finality: 'optimistic',
      });
      // Result is an array of bytes (UTF-8 JSON string)
      if (response?.result) {
        const resultStr = Buffer.from(response.result).toString('utf-8');
        // Parse JSON string (NEAR view functions return JSON-encoded values)
        const accountId = JSON.parse(resultStr);
        if (accountId && typeof accountId === 'string') {
          let isDeployed = false;
          try {
            const acct = new Account(accountId, provider);
            await acct.getState();
            isDeployed = true;
          } catch {
            // Account doesn't exist
          }
          return {
            accountAddress: accountId,
            isDeployed,
            explorerUrl: `${EXPLORER_URL}/address/${accountId}`
          };
        }
      }
    } catch (err: any) {
      console.error('NEAR get_account_id view call failed:', err?.message || err);
      // Fall through to local computation
    }

    // Fallback: compute locally and check if account exists
    const accountId = this.computeAccountId(adiUrl);
    let isDeployed = false;
    try {
      const acct = new Account(accountId, provider);
      await acct.getState();
      isDeployed = true;
    } catch {
      // Account doesn't exist yet
    }

    return {
      accountAddress: accountId,
      isDeployed,
      explorerUrl: `${EXPLORER_URL}/address/${accountId}`
    };
  }

  async deployAccount(adiUrl: string): Promise<DeployAccountResult> {
    if (!this.isSponsorConfigured()) {
      throw new Error('Sponsored deployment is not configured for NEAR');
    }

    // Check if already deployed
    const addressResult = await this.getAccountAddress(adiUrl);
    if (addressResult.isDeployed) {
      return {
        accountAddress: addressResult.accountAddress,
        alreadyExisted: true,
        transactionHash: null,
        explorerUrl: addressResult.explorerUrl,
        message: 'Certen Abstract Account already exists at this address'
      };
    }

    // Set up sponsor account
    const sponsorAccountId = process.env.NEAR_SPONSOR_ACCOUNT_ID!;
    const sponsorPrivateKey = process.env.NEAR_SPONSOR_PRIVATE_KEY!;
    const provider = this.getProvider();

    const keyPair = KeyPair.fromString(sponsorPrivateKey as any);
    const signer = new KeyPairSigner(keyPair);
    const sponsorAccount = new Account(sponsorAccountId, provider, signer);

    // Derive all parameters
    const owner = this.deriveOwner(adiUrl);
    const ownerEth = this.deriveOwnerEth(adiUrl);
    const salt = deriveSafeSalt(adiUrl);

    console.log(`  Deploying on NEAR Testnet...`);
    console.log(`  Owner (bytes32): ${owner}`);
    console.log(`  Owner (ETH): ${ownerEth}`);
    console.log(`  ADI URL: ${adiUrl}`);
    console.log(`  Salt: ${salt}`);
    console.log(`  Predicted address: ${addressResult.accountAddress}`);

    // Use callFunctionRaw to get the full transaction outcome (callFunction only returns the contract's return value)
    // broadcast_tx_commit waits for the tx to be included in a block
    const outcome = await sponsorAccount.callFunctionRaw({
      contractId: this.factoryAccount,
      methodName: 'create_account',
      args: {
        owner,
        owner_eth: ownerEth,
        adi_url: adiUrl,
        salt,
      },
      gas: BigInt('300000000000000'), // 300 TGas (max — create_account does CPI)
      deposit: BigInt('10000000000000000000000000'), // 10 NEAR (8 NEAR storage + 0.5 fee + headroom)
    } as any);

    const txHash = (outcome as any)?.transaction_outcome?.id
      || (outcome as any)?.transaction?.hash
      || 'unknown';

    console.log(`  Transaction broadcast: ${txHash}`);

    // Check transaction outcome for execution failures
    const txFailure = this.extractOutcomeFailure(outcome);
    if (txFailure) {
      throw new Error(`NEAR deployment transaction failed on-chain: ${txFailure}`);
    }

    // Verify the account actually exists at the predicted address (matches TRON pattern)
    const postDeploy = await this.getAccountAddress(adiUrl);
    if (!postDeploy.isDeployed) {
      throw new Error(
        `NEAR deployment tx ${txHash} succeeded but account not found at ${addressResult.accountAddress}`
      );
    }

    console.log(`  ✅ NEAR account deployed and verified: ${addressResult.accountAddress}`);

    return {
      accountAddress: addressResult.accountAddress,
      alreadyExisted: false,
      transactionHash: txHash,
      explorerUrl: `${EXPLORER_URL}/txns/${txHash}`,
      message: 'Certen Abstract Account deployed and verified on NEAR Testnet'
    };
  }

  /**
   * Extract a failure message from a NEAR transaction outcome, if any.
   * Checks both the transaction_outcome and all receipts_outcome for failures.
   * Returns null if the transaction succeeded.
   */
  private extractOutcomeFailure(outcome: any): string | null {
    // Check top-level status (present on broadcast_tx_commit responses)
    const topStatus = outcome?.status;
    if (topStatus?.Failure) {
      return JSON.stringify(topStatus.Failure);
    }

    // Check transaction_outcome
    const txOutcome = outcome?.transaction_outcome?.outcome;
    if (txOutcome?.status?.Failure) {
      return JSON.stringify(txOutcome.status.Failure);
    }

    // Check all receipts_outcome for failures (cross-contract calls)
    const receipts = outcome?.receipts_outcome;
    if (Array.isArray(receipts)) {
      for (const receipt of receipts) {
        const receiptStatus = receipt?.outcome?.status;
        if (receiptStatus?.Failure) {
          return JSON.stringify(receiptStatus.Failure);
        }
      }
    }

    return null;
  }

  async getAddressBalance(address: string): Promise<AddressBalanceResult> {
    try {
      const provider = this.getProvider();
      const account = new Account(address, provider);
      const state = await account.getState() as any;
      let balanceYocto: bigint;
      if (state?.balance?.total !== undefined) {
        balanceYocto = BigInt(state.balance.total);
      } else if (typeof state?.balance === 'bigint') {
        balanceYocto = state.balance;
      } else {
        balanceYocto = BigInt(String(state?.amount || state?.balance || '0'));
      }
      const balanceNear = Number(balanceYocto / BigInt(1e12)) / 1e12;
      return { address, balance: balanceNear.toFixed(6), symbol: 'NEAR' };
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        return { address, balance: '0', symbol: 'NEAR', error: 'Account not created' };
      }
      return { address, balance: '0', symbol: 'NEAR', error: e.message };
    }
  }

  async getSponsorStatus(): Promise<SponsorStatusResult> {
    if (!this.isSponsorConfigured()) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryAccount,
        error: 'Sponsor not configured'
      };
    }

    try {
      const provider = this.getProvider();
      const sponsorAccountId = process.env.NEAR_SPONSOR_ACCOUNT_ID!;
      const account = new Account(sponsorAccountId, provider);
      const state = await account.getState() as any;
      // near-api-js v7: state.balance = { total: BigInt, available: BigInt, locked: BigInt, usedOnStorage: BigInt }
      let balanceYocto: bigint;
      if (state?.balance?.total !== undefined) {
        balanceYocto = BigInt(state.balance.total);
      } else if (typeof state?.balance === 'bigint') {
        balanceYocto = state.balance;
      } else {
        balanceYocto = BigInt(String(state?.amount || state?.balance || '0'));
      }
      const balanceNear = Number(balanceYocto / BigInt(1e12)) / 1e12;
      const minBalance = 1.0; // 1 NEAR minimum

      return {
        name: this.chainName,
        available: !isNaN(balanceNear) && balanceNear >= minBalance,
        factoryAddress: this.factoryAccount,
        balance: `${isNaN(balanceNear) ? 0 : balanceNear.toFixed(4)} NEAR`,
        minBalance: `${minBalance} NEAR`
      };
    } catch (err: any) {
      console.error('NEAR sponsor status error:', err?.message || err);
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryAccount,
        error: `Failed to connect to NEAR Testnet: ${err?.message || 'unknown'}`
      };
    }
  }
}

export function createNearHandler(): NearChainHandler {
  return new NearChainHandler();
}
