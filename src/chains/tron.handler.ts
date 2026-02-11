/**
 * TRON Shasta Testnet Chain Handler
 *
 * Uses the same Solidity ABI as EVM chains since TRON is EVM-compatible.
 * Key difference: addresses are Base58Check encoded (T...) instead of hex.
 */

import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult } from './types.js';
import { deriveEvmOwner, deriveSaltU256 } from './utils.js';

// TronWeb is a CommonJS module; handle ESM import
let TronWebModule: any = null;
async function getTronWeb(): Promise<any> {
  if (!TronWebModule) {
    try {
      // Try ESM import first
      const mod = await import('tronweb');
      TronWebModule = mod.default || mod;
    } catch {
      // Fallback to createRequire for CommonJS
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      TronWebModule = require('tronweb');
    }
  }
  return TronWebModule;
}

const CHAIN_IDS = ['tron-testnet', 'tron-shasta'];
const CHAIN_NAME = 'TRON Shasta Testnet';
const EXPLORER_URL = 'https://shasta.tronscan.org';

// Same ABI as EVM factory (TRON uses Solidity)
const ACCOUNT_FACTORY_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'adiURL', type: 'string' },
      { name: 'salt', type: 'uint256' }
    ],
    name: 'createAccountIfNotExists',
    outputs: [{ name: 'account', type: 'address' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'adiURL', type: 'string' },
      { name: 'salt', type: 'uint256' }
    ],
    name: 'getAddress',
    outputs: [{ name: 'accountAddress', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'isDeployedAccount',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'deploymentFee',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

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
    return new TronWeb(config);
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const tronWeb = await this.createTronWeb();
    const ownerAddress = deriveEvmOwner(adiUrl);
    const salt = deriveSaltU256(adiUrl);

    // Get factory contract instance
    const factory = await tronWeb.contract(ACCOUNT_FACTORY_ABI, this.factoryAddress);

    // Call getAddress view function
    const resultHex: string = await factory.getAddress(ownerAddress, adiUrl, salt.toString()).call();

    // Convert hex address (41...) to Base58Check (T...)
    const predictedAddress = tronWeb.address.fromHex(resultHex);

    // Check if deployed
    const isDeployed: boolean = await factory.isDeployedAccount(resultHex).call();

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

    const ownerAddress = deriveEvmOwner(adiUrl);
    const salt = deriveSaltU256(adiUrl);

    const factory = await tronWeb.contract(ACCOUNT_FACTORY_ABI, this.factoryAddress);

    // Check if already deployed
    const resultHex: string = await factory.getAddress(ownerAddress, adiUrl, salt.toString()).call();
    const predictedAddress = tronWeb.address.fromHex(resultHex);
    const isDeployed: boolean = await factory.isDeployedAccount(resultHex).call();

    if (isDeployed) {
      return {
        accountAddress: predictedAddress,
        alreadyExisted: true,
        transactionHash: null,
        explorerUrl: `${EXPLORER_URL}/#/address/${predictedAddress}`,
        message: 'Certen Abstract Account already exists at this address'
      };
    }

    // Get deployment fee
    const deploymentFee = await factory.deploymentFee().call();
    const feeValue = Number(deploymentFee);

    // Deploy the account
    console.log(`  Deploying on TRON Shasta...`);
    const tx = await factory.createAccountIfNotExists(ownerAddress, adiUrl, salt.toString()).send({
      callValue: feeValue,
      feeLimit: 100000000, // 100 TRX max fee
    });

    const deployedAddress = tronWeb.address.fromHex(resultHex);
    console.log(`  ✅ TRON account deployed: ${deployedAddress}`);

    return {
      accountAddress: deployedAddress,
      alreadyExisted: false,
      transactionHash: tx,
      explorerUrl: `${EXPLORER_URL}/#/transaction/${tx}`,
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
      const tronWeb = await this.createTronWeb(sponsorPrivateKey);
      const address = tronWeb.defaultAddress.base58;
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
