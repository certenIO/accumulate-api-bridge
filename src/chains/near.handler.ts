/**
 * NEAR Testnet Chain Handler
 *
 * Uses NEAR's subaccount model for deterministic account creation.
 * Factory contract: certen-factory.testnet
 *
 * Uses near-api-js v7 (JsonRpcProvider + Account class).
 */

import { JsonRpcProvider, Account, KeyPair, KeyPairSigner } from 'near-api-js';
import { ethers } from 'ethers';
import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult } from './types.js';
import { deriveOwnerBytes32, deriveSaltU64 } from './utils.js';

const CHAIN_IDS = ['near-testnet'];
const CHAIN_NAME = 'NEAR Testnet';
const EXPLORER_URL = 'https://testnet.nearblocks.io';

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
   * Compute the deterministic sub-account ID.
   * Format: {hex-prefix}.certen-factory.testnet
   * where hex-prefix is first 16 bytes of keccak256(owner + adiUrl + salt)
   */
  private computeAccountId(adiUrl: string): string {
    const owner = deriveOwnerBytes32(adiUrl);
    const salt = deriveSaltU64(adiUrl).toString();
    const combined = owner + adiUrl + salt;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(combined));
    // NEAR account IDs must be lowercase alphanumeric; use first 16 bytes hex
    const prefix = hash.slice(2, 34); // 16 bytes = 32 hex chars
    return `${prefix}.${this.factoryAccount}`;
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const provider = this.getProvider();
    const accountId = this.computeAccountId(adiUrl);

    // Try to query the factory's view function first
    try {
      const factoryAccount = new Account(this.factoryAccount, provider);
      const result = await factoryAccount.callFunction({
        contractId: this.factoryAccount,
        methodName: 'get_account_id',
        args: {
          owner: deriveOwnerBytes32(adiUrl),
          adi_url: adiUrl,
          salt: deriveSaltU64(adiUrl).toString(),
        },
      });
      // callFunction returns the result; check if it's a string account ID
      if (result && typeof result === 'string') {
        let isDeployed = false;
        try {
          const acct = new Account(result, provider);
          await acct.getState();
          isDeployed = true;
        } catch {
          // Account doesn't exist
        }
        return {
          accountAddress: result,
          isDeployed,
          explorerUrl: `${EXPLORER_URL}/address/${result}`
        };
      }
    } catch {
      // View function not available, use local computation
    }

    // Fallback: check if locally computed account exists
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

    // Call create_account on the factory
    const owner = deriveOwnerBytes32(adiUrl);
    const salt = deriveSaltU64(adiUrl).toString();

    const result = await sponsorAccount.callFunction({
      contractId: this.factoryAccount,
      methodName: 'create_account',
      args: {
        owner,
        adi_url: adiUrl,
        salt,
      },
      gas: BigInt('100000000000000'), // 100 TGas
      deposit: BigInt('100000000000000000000000'), // 0.1 NEAR for storage
    } as any);

    const txHash = (result as any)?.transaction?.hash || 'unknown';
    const finalAddress = addressResult.accountAddress;
    console.log(`  ✅ NEAR account deployed: ${finalAddress}`);

    return {
      accountAddress: finalAddress,
      alreadyExisted: false,
      transactionHash: txHash,
      explorerUrl: `${EXPLORER_URL}/txns/${txHash}`,
      message: 'Certen Abstract Account deployed successfully on NEAR Testnet'
    };
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
      const balanceNear = Number(state.balance || state.amount || 0) / 1e24;
      const minBalance = 1.0; // 1 NEAR minimum

      return {
        name: this.chainName,
        available: balanceNear >= minBalance,
        factoryAddress: this.factoryAccount,
        balance: `${balanceNear.toFixed(4)} NEAR`,
        minBalance: `${minBalance} NEAR`
      };
    } catch (err) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryAccount,
        error: 'Failed to connect to NEAR Testnet'
      };
    }
  }
}

export function createNearHandler(): NearChainHandler {
  return new NearChainHandler();
}
