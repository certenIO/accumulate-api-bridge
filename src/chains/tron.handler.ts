/**
 * TRON Shasta Testnet Chain Handler
 *
 * Uses the same Solidity ABI as EVM chains since TRON is EVM-compatible.
 * Key difference: addresses are Base58Check encoded (T...) instead of hex.
 *
 * Uses triggerConstantContract/triggerSmartContract directly instead of
 * the tronWeb.contract() wrapper, which has address encoding issues in newer versions.
 */

import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult } from './types.js';
import { deriveEvmOwner, deriveSaltU256 } from './utils.js';

// TronWeb is a CommonJS module; resolve the actual constructor from ESM import
let TronWebConstructor: any = null;
async function getTronWeb(): Promise<any> {
  if (!TronWebConstructor) {
    const mod = await import('tronweb');
    // The constructor lives at mod.TronWeb (named export), not mod.default
    TronWebConstructor = mod.TronWeb || mod.default?.TronWeb || mod.default;
  }
  return TronWebConstructor;
}

const CHAIN_IDS = ['tron-testnet', 'tron-shasta'];
const CHAIN_NAME = 'TRON Shasta Testnet';
const EXPLORER_URL = 'https://shasta.tronscan.org';

export class TronChainHandler implements ChainHandler {
  readonly chainIds = CHAIN_IDS;
  readonly chainName = CHAIN_NAME;
  private factoryAddress: string;
  private rpcUrl: string;

  constructor() {
    this.factoryAddress = process.env.TRON_FACTORY_ADDRESS || 'TWBh1qjpABrxVSnUDnp4zcsSnpfAeRhJwy';
    this.rpcUrl = process.env.TRON_SHASTA_RPC_URL || 'https://api.shasta.trongrid.io';
  }

  isSponsorConfigured(): boolean {
    return process.env.TRON_SPONSORED_DEPLOYMENT_ENABLED === 'true' &&
      !!process.env.TRON_SPONSOR_PRIVATE_KEY;
  }

  private async createTronWeb(privateKey?: string): Promise<any> {
    const TronWeb = await getTronWeb();
    const config: any = {
      fullHost: this.rpcUrl,
    };
    if (privateKey) {
      config.privateKey = privateKey;
    }
    const tronWeb = new TronWeb(config);
    // Only override address for view-only instances (no private key).
    // When a private key is set, TronWeb derives the correct address from it.
    // Overriding would cause "Private key does not match address" on sign().
    if (!privateKey) {
      tronWeb.setAddress(this.factoryAddress);
    }
    return tronWeb;
  }

  /** Call a view function on the factory using triggerConstantContract */
  private async callView(tronWeb: any, functionSelector: string, params: any[]): Promise<string> {
    const result = await tronWeb.transactionBuilder.triggerConstantContract(
      this.factoryAddress,
      functionSelector,
      {},
      params
    );
    if (!result?.constant_result?.[0]) {
      throw new Error(`View call ${functionSelector} returned no result`);
    }
    return result.constant_result[0];
  }

  /** Parse a TRON address (20 bytes, right-aligned) from ABI-encoded hex output */
  private parseAddressResult(tronWeb: any, hexResult: string): string {
    // ABI-encoded address is 32 bytes, address in last 20 bytes
    const rawHex = hexResult.slice(-40);
    const tronHex = '41' + rawHex;
    return tronWeb.address.fromHex(tronHex);
  }

  /** Parse a bool from ABI-encoded hex output */
  private parseBoolResult(hexResult: string): boolean {
    return hexResult.replace(/^0+/, '') === '1';
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const tronWeb = await this.createTronWeb();
    const evmOwner = deriveEvmOwner(adiUrl);
    const ownerTronHex = tronWeb.address.toHex(evmOwner);
    const salt = deriveSaltU256(adiUrl);

    // Call getAddress(address,string,uint256)
    const addressResult = await this.callView(tronWeb, 'getAddress(address,string,uint256)', [
      { type: 'address', value: ownerTronHex },
      { type: 'string', value: adiUrl },
      { type: 'uint256', value: salt.toString() },
    ]);
    const predictedAddress = this.parseAddressResult(tronWeb, addressResult);

    // Call isDeployedAccount(address)
    const rawAddrHex = addressResult.slice(-40);
    const deployResult = await this.callView(tronWeb, 'isDeployedAccount(address)', [
      { type: 'address', value: '41' + rawAddrHex },
    ]);
    const isDeployed = this.parseBoolResult(deployResult);

    return {
      accountAddress: predictedAddress,
      isDeployed,
      explorerUrl: `${EXPLORER_URL}/#/address/${predictedAddress}`
    };
  }

  async deployAccount(adiUrl: string): Promise<DeployAccountResult> {
    if (!this.isSponsorConfigured()) {
      throw new Error('Sponsored deployment is not configured for TRON');
    }

    const sponsorPrivateKey = process.env.TRON_SPONSOR_PRIVATE_KEY!;
    const tronWeb = await this.createTronWeb(sponsorPrivateKey);

    // Check current state
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

    // Get deployment fee
    const feeResult = await this.callView(tronWeb, 'deploymentFee()', []);
    const feeValue = parseInt(feeResult, 16);

    // Deploy via triggerSmartContract
    const evmOwner = deriveEvmOwner(adiUrl);
    const ownerTronHex = tronWeb.address.toHex(evmOwner);
    const salt = deriveSaltU256(adiUrl);

    console.log(`  Deploying on TRON Shasta...`);
    const txResult = await tronWeb.transactionBuilder.triggerSmartContract(
      this.factoryAddress,
      'createAccountIfNotExists(address,string,uint256)',
      { callValue: feeValue, feeLimit: 100000000 },
      [
        { type: 'address', value: ownerTronHex },
        { type: 'string', value: adiUrl },
        { type: 'uint256', value: salt.toString() },
      ]
    );

    const signedTx = await tronWeb.trx.sign(txResult.transaction);
    const broadcast = await tronWeb.trx.sendRawTransaction(signedTx);
    const txHash = broadcast.txid || broadcast.transaction?.txID || '';

    console.log(`  ✅ TRON account deployed: ${addressResult.accountAddress}`);

    return {
      accountAddress: addressResult.accountAddress,
      alreadyExisted: false,
      transactionHash: txHash,
      explorerUrl: `${EXPLORER_URL}/#/transaction/${txHash}`,
      message: 'Certen Abstract Account deployed successfully on TRON Shasta Testnet'
    };
  }

  async getSponsorStatus(): Promise<SponsorStatusResult> {
    if (!this.isSponsorConfigured()) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryAddress,
        error: 'Sponsor not configured'
      };
    }

    try {
      const sponsorPrivateKey = process.env.TRON_SPONSOR_PRIVATE_KEY!;
      // Don't use createTronWeb() here since it overrides defaultAddress to factory
      const TronWeb = await getTronWeb();
      const tronWeb = new TronWeb({ fullHost: this.rpcUrl, privateKey: sponsorPrivateKey });
      const address = process.env.TRON_SPONSOR_ADDRESS || tronWeb.defaultAddress.base58;
      const balanceSun = await tronWeb.trx.getBalance(address);
      const balanceTrx = balanceSun / 1e6;
      const minBalance = 10; // 10 TRX minimum

      return {
        name: this.chainName,
        available: balanceTrx >= minBalance,
        factoryAddress: this.factoryAddress,
        balance: `${balanceTrx.toFixed(4)} TRX`,
        minBalance: `${minBalance} TRX`
      };
    } catch (err) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryAddress,
        error: 'Failed to connect to TRON Shasta'
      };
    }
  }
}

export function createTronHandler(): TronChainHandler {
  return new TronChainHandler();
}
