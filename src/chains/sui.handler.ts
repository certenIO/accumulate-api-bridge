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
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult, AddressBalanceResult } from './types.js';
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
    this.factoryObjectId = process.env.SUI_FACTORY_OBJECT || '0x136a403bca2bedeaa7dc8c5b95e48a25071f4945cee7765ac1cf4971683266e2';
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

    try {
      // Look up the real object ID from the factory's adi_to_account registry.
      // SUI object IDs are runtime-assigned, so get_account_for_adi reads the
      // registry rather than predicting an address.
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.factoryPackage}::certen_account_factory::get_account_for_adi`,
        arguments: [
          tx.object(this.factoryObjectId),
          tx.pure.string(adiUrl),
        ],
      });

      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx as any,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });

      // Parse Option<address> return value
      // BCS Option: [0] = None, [1, ...bytes] = Some(address)
      if ((result as any)?.results?.[0]?.returnValues?.[0]) {
        const [bytesArr] = (result as any).results[0].returnValues[0];
        if (Array.isArray(bytesArr) && bytesArr.length === 33 && bytesArr[0] === 1) {
          // Some(address) — first byte is 1 (Some), followed by 32-byte address
          const realAddress = '0x' + Buffer.from(bytesArr.slice(1)).toString('hex');

          // Verify object exists on-chain
          let isDeployed = false;
          try {
            const obj = await client.getObject({ id: realAddress } as any);
            isDeployed = (obj as any)?.data != null;
          } catch {
            // Object doesn't exist
          }

          return {
            accountAddress: realAddress,
            isDeployed,
            explorerUrl: `${EXPLORER_URL}/object/${realAddress}`
          };
        }
      }

      // Not registered yet — return derived owner hash as placeholder
      return {
        accountAddress: ownerHex,
        isDeployed: false,
        explorerUrl: `${EXPLORER_URL}/object/${ownerHex}`
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
    const ownerHex = '0x' + deriveOwnerBytes32(adiUrl);
    const salt = deriveSaltU64(adiUrl);

    // Build deployment transaction
    const sponsorKeyStr = process.env.SUI_SPONSOR_PRIVATE_KEY!;
    const { secretKey } = decodeSuiPrivateKey(sponsorKeyStr);
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const senderAddress = keypair.getPublicKey().toSuiAddress();

    // Query deployment fee from factory
    let deploymentFee = BigInt(100000000); // default 0.1 SUI
    try {
      const feeResult = await client.devInspectTransactionBlock({
        transactionBlock: (() => {
          const t = new Transaction();
          t.moveCall({
            target: `${this.factoryPackage}::certen_account_factory::get_deployment_fee`,
            arguments: [t.object(this.factoryObjectId)],
          });
          return t as any;
        })(),
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      if ((feeResult as any)?.results?.[0]?.returnValues?.[0]) {
        const [feeBytes] = (feeResult as any).results[0].returnValues[0];
        if (Array.isArray(feeBytes) && feeBytes.length === 8) {
          deploymentFee = Buffer.from(feeBytes).readBigUInt64LE();
        }
      }
    } catch {
      // Use default fee
    }

    // create_account(factory, clock, owner, adi_url, salt, payment, ctx)
    const tx = new Transaction();
    const [paymentCoin] = tx.splitCoins(tx.gas, [deploymentFee]);
    tx.moveCall({
      target: `${this.factoryPackage}::certen_account_factory::create_account`,
      arguments: [
        tx.object(this.factoryObjectId),       // factory: &mut Factory
        tx.object('0x6'),                       // clock: &Clock
        tx.pure.address(ownerHex),              // owner: address
        tx.pure.string(adiUrl),                 // adi_url: String
        tx.pure.u64(salt),                      // salt: u64
        paymentCoin,                            // payment: Coin<SUI>
      ],
    });

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: { showEvents: true },
    });

    const digest = (result as any).digest || (result as any).Transaction?.digest || '';
    if (digest) {
      await client.waitForTransaction({ digest });
    }

    // Extract the real account object ID from the AccountDeployedEvent.
    // On SUI, object IDs are assigned by the runtime (not deterministic like CREATE2),
    // so we must read the actual ID from the event or re-query the factory registry.
    let finalAddress = '';
    const events = (result as any).events || [];
    for (const evt of events) {
      if (evt.type?.includes('AccountDeployedEvent') && evt.parsedJson?.account_id) {
        finalAddress = evt.parsedJson.account_id;
        break;
      }
    }

    // Fallback: re-query get_address now that the factory registry is populated
    if (!finalAddress) {
      const postDeployResult = await this.getAccountAddress(adiUrl);
      finalAddress = postDeployResult.accountAddress;
    }

    console.log(`  ✅ Sui account deployed: ${finalAddress}`);

    return {
      accountAddress: finalAddress,
      alreadyExisted: false,
      transactionHash: digest,
      explorerUrl: `${EXPLORER_URL}/tx/${digest}`,
      message: 'Certen Abstract Account deployed successfully on Sui Testnet'
    };
  }

  async getAddressBalance(address: string): Promise<AddressBalanceResult> {
    try {
      const client = this.getClient();

      // CertenAccountV2 stores SUI internally in its sui_balance field.
      // Query it via the contract's get_balance view function.
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${this.factoryPackage}::certen_account_v2::get_balance`,
          arguments: [tx.object(address)],
        });
        const inspectResult = await client.devInspectTransactionBlock({
          transactionBlock: tx as any,
          sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
        });
        if ((inspectResult as any)?.results?.[0]?.returnValues?.[0]) {
          const [balBytes] = (inspectResult as any).results[0].returnValues[0];
          if (Array.isArray(balBytes) && balBytes.length === 8) {
            const balanceMist = Buffer.from(balBytes).readBigUInt64LE();
            const balanceSui = Number(balanceMist) / 1e9;
            return { address, balance: balanceSui.toFixed(6), symbol: 'SUI' };
          }
        }
      } catch {
        // Not a CertenAccountV2 or devInspect failed — fall through to native balance
      }

      // Fallback: check native coin balance (for regular addresses)
      const balance = await client.getBalance({ owner: address });
      const balanceSui = Number((balance as any).totalBalance || 0) / 1e9;
      return { address, balance: balanceSui.toFixed(6), symbol: 'SUI' };
    } catch (e: any) {
      return { address, balance: '0', symbol: 'SUI', error: e.message };
    }
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
      const { secretKey } = decodeSuiPrivateKey(sponsorKeyStr);
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
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
