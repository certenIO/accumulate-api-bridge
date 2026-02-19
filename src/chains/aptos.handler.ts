/**
 * Aptos Testnet Chain Handler
 *
 * Uses Move view functions for address prediction and transaction submission.
 * Factory package: CertenAccountFactory on Aptos Testnet.
 */

import { createHash } from 'crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey, MoveVector, MoveString } from '@aptos-labs/ts-sdk';
import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult, AddressBalanceResult } from './types.js';
import { deriveOwnerBytes32, deriveSaltU64 } from './utils.js';

const CHAIN_IDS = ['aptos-testnet'];
const CHAIN_NAME = 'Aptos Testnet';
const EXPLORER_URL = 'https://explorer.aptoslabs.com';

export class AptosChainHandler implements ChainHandler {
  readonly chainIds = CHAIN_IDS;
  readonly chainName = CHAIN_NAME;
  private factoryPackage: string;
  private rpcUrl: string;

  constructor() {
    this.factoryPackage = process.env.APTOS_FACTORY_PACKAGE || '0xe4ea6152bffec3ece1bf885f5ba571649436bf33816e2d210b0f5d91669da05a';
    this.rpcUrl = process.env.APTOS_TESTNET_RPC_URL || 'https://fullnode.testnet.aptoslabs.com/v1';
  }

  isSponsorConfigured(): boolean {
    return process.env.APTOS_SPONSORED_DEPLOYMENT_ENABLED === 'true' &&
      !!process.env.APTOS_SPONSOR_PRIVATE_KEY;
  }

  private getClient(): Aptos {
    const config = new AptosConfig({
      network: Network.TESTNET,
      fullnode: this.rpcUrl,
    });
    return new Aptos(config);
  }

  /**
   * Compute the factory-derived resource account address locally.
   * Replicates the Move logic: seed = BCS(owner) + adi_url + BCS(salt) + BCS(anchor_contract)
   * address = SHA3-256(deployer + seed + 0xFF)
   */
  private async computeAddressLocally(adiUrl: string, ownerHex: string, salt: bigint): Promise<string> {
    // Fetch FactoryState resource to get deployer_address and anchor_contract
    const resourceType = `${this.factoryPackage}::certen_account_factory::FactoryState`;
    const url = `${this.rpcUrl.replace(/\/v1\/?$/, '')}/v1/accounts/${this.factoryPackage}/resource/${resourceType}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch FactoryState: ${resp.status} ${await resp.text()}`);
    }
    const resource = await resp.json() as { data: { deployer_address: string; anchor_contract: string } };
    const deployerAddr = resource.data.deployer_address;
    const anchorContract = resource.data.anchor_contract;

    // Decode hex addresses to bytes (pad to 32 bytes)
    const hexToBytes32 = (hex: string): Uint8Array => {
      const clean = hex.replace(/^0x/, '').padStart(64, '0');
      return Buffer.from(clean, 'hex');
    };

    const deployerBytes = hexToBytes32(deployerAddr);
    const ownerBytes = hexToBytes32(ownerHex);
    const anchorBytes = hexToBytes32(anchorContract);
    const adiUrlBytes = Buffer.from(adiUrl, 'utf-8');

    // BCS encode salt as u64 little-endian
    const saltBytes = Buffer.alloc(8);
    saltBytes.writeBigUInt64LE(salt);

    // Build seed: BCS(owner) + adi_url + BCS(salt) + BCS(anchor_contract)
    const seed = Buffer.concat([ownerBytes, adiUrlBytes, saltBytes, anchorBytes]);

    // create_resource_address: SHA3-256(deployer + seed + 0xFF)
    const data = Buffer.concat([deployerBytes, seed, Buffer.from([0xFF])]);
    const hash = createHash('sha3-256').update(data).digest();
    return '0x' + hash.toString('hex');
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const aptos = this.getClient();
    const ownerHex = '0x' + deriveOwnerBytes32(adiUrl);
    const salt = deriveSaltU64(adiUrl);

    try {
      // Call the view function to get the predicted address
      // Signature: get_address(factory_addr: address, owner: address, adi_url: vector<u8>, salt: u64)
      const adiUrlBytes = Array.from(Buffer.from(adiUrl, 'utf-8'));
      const result = await aptos.view({
        payload: {
          function: `${this.factoryPackage}::certen_account_factory::get_address`,
          typeArguments: [],
          functionArguments: [this.factoryPackage, ownerHex, MoveVector.U8(adiUrlBytes), salt.toString()],
        }
      });

      const predictedAddress = result[0] as string;

      // Check if the abstract account is initialized (has AccountState resource)
      let isDeployed = false;
      try {
        const resourceType = `${this.factoryPackage}::certen_account_v2::AccountState` as `${string}::${string}::${string}`;
        await aptos.getAccountResource({ accountAddress: predictedAddress, resourceType });
        isDeployed = true;
      } catch {
        // AccountState resource doesn't exist yet
      }

      return {
        accountAddress: predictedAddress,
        isDeployed,
        explorerUrl: `${EXPLORER_URL}/account/${predictedAddress}?network=testnet`
      };
    } catch (err) {
      // If the view function fails, compute address locally using the same
      // derivation as the Move contract: seed = BCS(owner) + adi_url + BCS(salt) + BCS(anchor_contract)
      // address = SHA3-256(deployer + seed + 0xFF)
      console.warn(`  ⚠️ Aptos view function failed, computing address locally: ${err}`);
      const localAddress = await this.computeAddressLocally(adiUrl, ownerHex, salt);
      return {
        accountAddress: localAddress,
        isDeployed: false,
        explorerUrl: `${EXPLORER_URL}/account/${localAddress}?network=testnet`
      };
    }
  }

  async deployAccount(adiUrl: string): Promise<DeployAccountResult> {
    if (!this.isSponsorConfigured()) {
      throw new Error('Sponsored deployment is not configured for Aptos');
    }

    const aptos = this.getClient();
    const ownerHex = '0x' + deriveOwnerBytes32(adiUrl);
    const salt = deriveSaltU64(adiUrl);

    // First check if already deployed
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

    // Build and submit transaction
    // APTOS_SPONSOR_PRIVATE_KEY may have "ed25519-priv-" prefix — strip it
    const rawKey = process.env.APTOS_SPONSOR_PRIVATE_KEY!.replace(/^ed25519-priv-/, '');
    const privateKey = new Ed25519PrivateKey(rawKey);
    const sponsorAccount = Account.fromPrivateKey({ privateKey });

    // Signature: create_account(caller: &signer, factory_addr: address, owner: address, adi_url: vector<u8>, salt: u64)
    // Note: &signer is implicit (the sender), not passed as an argument
    const adiUrlBytes = Array.from(Buffer.from(adiUrl, 'utf-8'));
    const txn = await aptos.transaction.build.simple({
      sender: sponsorAccount.accountAddress,
      data: {
        function: `${this.factoryPackage}::certen_account_factory::create_account`,
        typeArguments: [],
        functionArguments: [this.factoryPackage, ownerHex, MoveVector.U8(adiUrlBytes), salt.toString()],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: sponsorAccount,
      transaction: txn,
    });

    const committedTxn = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    // Get the actual deployed address
    const finalAddress = addressResult.accountAddress;
    console.log(`  ✅ Aptos account deployed: ${finalAddress}`);

    return {
      accountAddress: finalAddress,
      alreadyExisted: false,
      transactionHash: pendingTxn.hash,
      explorerUrl: `${EXPLORER_URL}/txn/${pendingTxn.hash}?network=testnet`,
      message: 'Certen Abstract Account deployed successfully on Aptos Testnet'
    };
  }

  async getAddressBalance(address: string): Promise<AddressBalanceResult> {
    try {
      const aptos = this.getClient();
      const result = await aptos.view({
        payload: {
          function: '0x1::coin::balance',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [address],
        }
      });
      const balance = Number(result[0]) / 1e8;
      return { address, balance: balance.toFixed(6), symbol: 'APT' };
    } catch (e: any) {
      return { address, balance: '0', symbol: 'APT', error: e.message };
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
      const aptos = this.getClient();
      const rawKey = process.env.APTOS_SPONSOR_PRIVATE_KEY!.replace(/^ed25519-priv-/, '');
      const privateKey = new Ed25519PrivateKey(rawKey);
      const sponsorAccount = Account.fromPrivateKey({ privateKey });

      const balanceOctas = await aptos.getAccountAPTAmount({
        accountAddress: sponsorAccount.accountAddress,
      });
      const balance = balanceOctas / 1e8;
      const minBalance = 0.1; // 0.1 APT minimum

      return {
        name: this.chainName,
        available: balance >= minBalance,
        factoryAddress: this.factoryPackage,
        balance: `${balance.toFixed(4)} APT`,
        minBalance: `${minBalance} APT`
      };
    } catch (err) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryPackage,
        error: 'Failed to connect to Aptos Testnet'
      };
    }
  }
}

export function createAptosHandler(): AptosChainHandler {
  return new AptosChainHandler();
}
