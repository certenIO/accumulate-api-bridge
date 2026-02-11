/**
 * Sui Testnet Chain Handler
 *
 * Uses Sui JSON-RPC for account factory operations.
 * Factory package: CertenAccountFactory on Sui Testnet.
 *
 * Uses @mysten/sui v2 SDK (SuiJsonRpcClient + Transaction).
 */

import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult } from './types.js';
import { deriveOwnerBytes32, deriveSaltU64 } from './utils.js';

const CHAIN_IDS = ['sui-testnet'];
const CHAIN_NAME = 'Sui Testnet';
const EXPLORER_URL = 'https://testnet.suiscan.xyz';

export class SuiChainHandler implements ChainHandler {
  readonly chainIds = CHAIN_IDS;
  readonly chainName = CHAIN_NAME;
  private factoryPackage: string;
  private factoryObjectId: string;
  private rpcUrl: string;

  constructor() {
    this.factoryPackage = process.env.SUI_FACTORY_PACKAGE || '0xf9f8f5c8349e04404631531f2420cd45805934839867daa1f4c043ec06b6ade2';
    this.factoryObjectId = process.env.SUI_FACTORY_OBJECT || this.factoryPackage;
    this.rpcUrl = process.env.SUI_TESTNET_RPC_URL || getJsonRpcFullnodeUrl('testnet');
  }

  isSponsorConfigured(): boolean {
    return process.env.SUI_SPONSORED_DEPLOYMENT_ENABLED === 'true' &&
      !!process.env.SUI_SPONSOR_PRIVATE_KEY;
  }

  private getClient(): SuiJsonRpcClient {
    return new SuiJsonRpcClient({ url: this.rpcUrl, network: 'testnet' });
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const client = this.getClient();
    const ownerHex = '0x' + deriveOwnerBytes32(adiUrl);
    const salt = deriveSaltU64(adiUrl);

    try {
      // Use devInspectTransactionBlock to call get_address read-only
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.factoryPackage}::certen_account_factory::get_address`,
        arguments: [
          tx.object(this.factoryObjectId),
          tx.pure.vector('u8', Array.from(Buffer.from(deriveOwnerBytes32(adiUrl), 'hex'))),
          tx.pure.string(adiUrl),
          tx.pure.u64(salt),
        ],
      });

      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx as any,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });

      let predictedAddress = ownerHex; // fallback
      if ((result as any)?.results?.[0]?.returnValues?.[0]) {
        const [bytesArr] = (result as any).results[0].returnValues[0];
        if (Array.isArray(bytesArr)) {
          predictedAddress = '0x' + Buffer.from(bytesArr).toString('hex');
        }
      }

      // Check if object exists
      let isDeployed = false;
      try {
        const obj = await client.getObject({ id: predictedAddress } as any);
        isDeployed = (obj as any)?.data != null;
      } catch {
        // Object doesn't exist
      }

      return {
        accountAddress: predictedAddress,
        isDeployed,
        explorerUrl: `${EXPLORER_URL}/object/${predictedAddress}`
      };
    } catch (err) {
      // Fallback: return derived address
      return {
        accountAddress: ownerHex,
        isDeployed: false,
        explorerUrl: `${EXPLORER_URL}/object/${ownerHex}`
      };
    }
  }

  async deployAccount(adiUrl: string): Promise<DeployAccountResult> {
    if (!this.isSponsorConfigured()) {
      throw new Error('Sponsored deployment is not configured for Sui');
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

    const client = this.getClient();
    const salt = deriveSaltU64(adiUrl);

    // Build deployment transaction
    const sponsorKeyStr = process.env.SUI_SPONSOR_PRIVATE_KEY!;
    const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(sponsorKeyStr, 'base64'));

    const tx = new Transaction();
    tx.moveCall({
      target: `${this.factoryPackage}::certen_account_factory::create_account`,
      arguments: [
        tx.object(this.factoryObjectId),
        tx.pure.vector('u8', Array.from(Buffer.from(deriveOwnerBytes32(adiUrl), 'hex'))),
        tx.pure.string(adiUrl),
        tx.pure.u64(salt),
      ],
    });

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
    });

    const digest = (result as any).digest || (result as any).Transaction?.digest || '';
    if (digest) {
      await client.waitForTransaction({ digest });
    }

    const finalAddress = addressResult.accountAddress;
    console.log(`  ✅ Sui account deployed: ${finalAddress}`);

    return {
      accountAddress: finalAddress,
      alreadyExisted: false,
      transactionHash: digest,
      explorerUrl: `${EXPLORER_URL}/tx/${digest}`,
      message: 'Certen Abstract Account deployed successfully on Sui Testnet'
    };
  }

  async getSponsorStatus(): Promise<SponsorStatusResult> {
    if (!this.isSponsorConfigured()) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryPackage,
        error: 'Sponsor not configured'
      };
    }

    try {
      const client = this.getClient();
      const sponsorKeyStr = process.env.SUI_SPONSOR_PRIVATE_KEY!;
      const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(sponsorKeyStr, 'base64'));
      const address = keypair.getPublicKey().toSuiAddress();

      const balance = await client.getBalance({ owner: address });
      const balanceSui = Number((balance as any).totalBalance || 0) / 1e9;
      const minBalance = 0.1; // 0.1 SUI minimum

      return {
        name: this.chainName,
        available: balanceSui >= minBalance,
        factoryAddress: this.factoryPackage,
        balance: `${balanceSui.toFixed(4)} SUI`,
        minBalance: `${minBalance} SUI`
      };
    } catch (err) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryPackage,
        error: 'Failed to connect to Sui Testnet'
      };
    }
  }
}

export function createSuiHandler(): SuiChainHandler {
  return new SuiChainHandler();
}
