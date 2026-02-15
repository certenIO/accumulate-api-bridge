/**
 * TRON Shasta Testnet Chain Handler
 *
 * Uses the same Solidity ABI as EVM chains since TRON is EVM-compatible.
 * Key difference: addresses are Base58Check encoded (T...) instead of hex.
 *
 * Uses triggerConstantContract/triggerSmartContract directly instead of
 * the tronWeb.contract() wrapper, which has address encoding issues in newer versions.
 */

import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult, AddressBalanceResult } from './types.js';
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

  /** Convert EVM 0x address to TRON 41-prefixed hex */
  private evmToTronHex(evmAddress: string): string {
    return '41' + evmAddress.slice(2).toLowerCase();
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const tronWeb = await this.createTronWeb();
    const evmOwner = deriveEvmOwner(adiUrl);
    const ownerTronHex = this.evmToTronHex(evmOwner);
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

    // Derive parameters
    const evmOwner = deriveEvmOwner(adiUrl);
    const ownerTronHex = this.evmToTronHex(evmOwner);
    const ownerBase58 = tronWeb.address.fromHex(ownerTronHex);
    const salt = deriveSaltU256(adiUrl);

    console.log(`  Deploying on TRON Shasta...`);
    console.log(`  Owner (EVM): ${evmOwner}`);
    console.log(`  Owner (TRON hex): ${ownerTronHex}`);
    console.log(`  Owner (TRON base58): ${ownerBase58}`);
    console.log(`  ADI URL: ${adiUrl}`);
    console.log(`  Salt: ${salt.toString()}`);

    // Pre-flight diagnostics: query factory state before deploying
    const pausedResult = await this.callView(tronWeb, 'isDeploymentPaused()', []);
    const isPaused = this.parseBoolResult(pausedResult);
    console.log(`  Factory paused: ${isPaused}`);
    if (isPaused) {
      throw new Error('TRON factory deployment is paused');
    }

    const adiRegisteredResult = await this.callView(tronWeb, 'isADIRegistered(string)', [
      { type: 'string', value: adiUrl },
    ]);
    const isAdiRegistered = this.parseBoolResult(adiRegisteredResult);
    console.log(`  ADI already registered: ${isAdiRegistered}`);
    if (isAdiRegistered) {
      const existingResult = await this.callView(tronWeb, 'getAccountForADI(string)', [
        { type: 'string', value: adiUrl },
      ]);
      const existingAddr = this.parseAddressResult(tronWeb, existingResult);
      throw new Error(`ADI URL "${adiUrl}" is already registered to account ${existingAddr}`);
    }

    // Get factory config: entryPoint, anchorContractV2, deploymentFee, owner
    const configResult = await this.callView(tronWeb, 'getFactoryConfig()', []);
    // ABI decode: 4 x 32-byte words (address, address, uint256, address)
    const entryPointHex = configResult.slice(24, 64);
    const anchorHex = configResult.slice(88, 128);
    const feeHex = configResult.slice(128, 192);
    const ownerHex = configResult.slice(216, 256);
    console.log(`  Factory entryPoint: 41${entryPointHex}`);
    console.log(`  Factory anchorContract: 41${anchorHex}`);
    console.log(`  Factory owner: 41${ownerHex}`);

    const feeValue = parseInt(feeHex, 16);
    console.log(`  Deployment fee: ${feeValue} sun (${feeValue / 1e6} TRX)`);

    // Simulate the call first via triggerConstantContract to catch reverts early
    console.log(`  Simulating createAccountIfNotExists...`);
    const simResult = await tronWeb.transactionBuilder.triggerConstantContract(
      this.factoryAddress,
      'createAccountIfNotExists(address,string,uint256)',
      { callValue: feeValue },
      [
        { type: 'address', value: ownerTronHex },
        { type: 'string', value: adiUrl },
        { type: 'uint256', value: salt.toString() },
      ]
    );
    if (simResult?.result?.result === false || simResult?.result?.code) {
      const errMsg = simResult?.result?.message
        ? Buffer.from(simResult.result.message, 'hex').toString('utf8')
        : `code=${simResult?.result?.code}, raw=${JSON.stringify(simResult?.result)}`;
      console.error(`  Simulation FAILED: ${errMsg}`);
      console.error(`  Full simulation result: ${JSON.stringify(simResult, null, 2)}`);
      throw new Error(`TRON deployment simulation failed: ${errMsg}`);
    }
    console.log(`  Simulation passed — proceeding with real transaction`);
    console.log(`  Fee limit: 5000 TRX`);

    const txResult = await tronWeb.transactionBuilder.triggerSmartContract(
      this.factoryAddress,
      'createAccountIfNotExists(address,string,uint256)',
      { callValue: feeValue, feeLimit: 5000000000 },
      [
        { type: 'address', value: ownerTronHex },
        { type: 'string', value: adiUrl },
        { type: 'uint256', value: salt.toString() },
      ]
    );

    const signedTx = await tronWeb.trx.sign(txResult.transaction);
    const broadcast = await tronWeb.trx.sendRawTransaction(signedTx);
    const txHash = broadcast.txid || broadcast.transaction?.txID || '';

    if (!txHash) {
      throw new Error('TRON broadcast returned no transaction hash');
    }

    console.log(`  Transaction broadcast: ${txHash}`);

    // Wait for on-chain confirmation — poll getTransactionInfoById
    const confirmed = await this.waitForConfirmation(tronWeb, txHash, 120_000);
    if (!confirmed.success) {
      throw new Error(`TRON deployment transaction failed on-chain: ${confirmed.error}`);
    }

    // Verify the contract actually exists at the predicted address
    const postDeploy = await this.getAccountAddress(adiUrl);
    if (!postDeploy.isDeployed) {
      throw new Error(`TRON deployment tx ${txHash} succeeded but contract not found at ${addressResult.accountAddress}`);
    }

    console.log(`  ✅ TRON account deployed and verified: ${addressResult.accountAddress}`);

    return {
      accountAddress: addressResult.accountAddress,
      alreadyExisted: false,
      transactionHash: txHash,
      explorerUrl: `${EXPLORER_URL}/#/transaction/${txHash}`,
      message: 'Certen Abstract Account deployed successfully on TRON Shasta Testnet'
    };
  }

  /** Poll getTransactionInfoById until the tx is confirmed or timeout */
  private async waitForConfirmation(
    tronWeb: any,
    txHash: string,
    timeoutMs: number
  ): Promise<{ success: boolean; error?: string }> {
    const deadline = Date.now() + timeoutMs;
    const pollInterval = 3000;

    while (Date.now() < deadline) {
      try {
        const info = await tronWeb.trx.getTransactionInfo(txHash);

        // If blockNumber is present, tx is confirmed
        if (info && info.blockNumber) {
          // Check receipt result
          if (info.receipt?.result === 'OUT_OF_ENERGY') {
            return { success: false, error: 'OUT_OF_ENERGY' };
          }
          if (info.receipt?.result === 'FAILED') {
            const reason = info.resMessage
              ? Buffer.from(info.resMessage, 'hex').toString('utf8')
              : info.contractResult?.[0]
                ? `revert data: ${info.contractResult[0]}`
                : 'Transaction reverted on-chain (no reason)';
            console.error(`  Full tx info: ${JSON.stringify(info, null, 2)}`);
            return { success: false, error: `FAILED: ${reason}` };
          }
          if (info.result === 'FAILED') {
            const reason = info.resMessage
              ? Buffer.from(info.resMessage, 'hex').toString('utf8')
              : 'Unknown revert reason';
            console.error(`  Full tx info: ${JSON.stringify(info, null, 2)}`);
            return { success: false, error: reason };
          }
          // SUCCESS or no explicit failure = confirmed
          console.log(`  Confirmed in block ${info.blockNumber}`);
          return { success: true };
        }
      } catch {
        // Not yet available, keep polling
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return { success: false, error: `Transaction ${txHash} not confirmed after ${timeoutMs}ms` };
  }

  async getAddressBalance(address: string): Promise<AddressBalanceResult> {
    try {
      const TronWeb = await getTronWeb();
      const tronWeb = new TronWeb({ fullHost: this.rpcUrl });
      const balanceSun = await tronWeb.trx.getBalance(address);
      return { address, balance: (balanceSun / 1e6).toFixed(6), symbol: 'TRX' };
    } catch (e: any) {
      return { address, balance: '0', symbol: 'TRX', error: e.message };
    }
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
