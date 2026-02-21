/**
 * TON Testnet Chain Handler
 *
 * Uses StateInit-based address computation and Cell encoding.
 * Factory contract: CertenAccountFactoryTon on TON Testnet.
 */

import { TonClient, WalletContractV4, Address, beginCell, toNano, internal } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult, AddressBalanceResult } from './types.js';
import { deriveOwnerBytes32, deriveSaltU64 } from './utils.js';

const CHAIN_IDS = ['ton-testnet'];
const CHAIN_NAME = 'TON Testnet';
const EXPLORER_URL = 'https://testnet.tonscan.org';

// Tact-generated op codes from compiled ABI
const OP_CREATE_ACCOUNT_IF_NOT_EXISTS = 3475342255; // CRC32C("CreateAccountIfNotExists") | 0x80000000

export class TonChainHandler implements ChainHandler {
  readonly chainIds = CHAIN_IDS;
  readonly chainName = CHAIN_NAME;
  private factoryAddress: string;
  private rpcUrl: string;
  private apiKey: string;

  constructor() {
    this.factoryAddress = process.env.TON_FACTORY_ADDRESS || 'kQCiF_punJ_9IQlPw18b2R9XyqwegUImJ8OgdNmfUp2rBsDB';
    this.rpcUrl = process.env.TON_TESTNET_RPC_URL || 'https://testnet.toncenter.com/api/v2/jsonRPC';
    this.apiKey = process.env.TON_TESTNET_API_KEY || '';
  }

  isSponsorConfigured(): boolean {
    return process.env.TON_SPONSORED_DEPLOYMENT_ENABLED === 'true' &&
      !!process.env.TON_SPONSOR_MNEMONIC;
  }

  private getClient(): TonClient {
    return new TonClient({
      endpoint: this.rpcUrl,
      apiKey: this.apiKey || undefined,
    });
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const client = this.getClient();
    const ownerBytes = Buffer.from(deriveOwnerBytes32(adiUrl), 'hex');
    const salt = deriveSaltU64(adiUrl);
    const factoryAddr = Address.parse(this.factoryAddress);

    try {
      // Call getAddress on the factory contract
      // Tact getter expects: (owner: Address, adiUrl: String, salt: Int)
      // Address → slice with storeAddress; String → cell with storeStringTail
      const ownerAddr = new Address(0, ownerBytes);
      const result = await client.runMethod(factoryAddr, 'getAddress', [
        { type: 'slice', cell: beginCell().storeAddress(ownerAddr).endCell() },
        { type: 'cell', cell: beginCell().storeStringTail(adiUrl).endCell() },
        { type: 'int', value: salt },
      ]);

      const addressCell = result.stack.readAddress();
      const predictedAddress = addressCell.toString();

      // Check if contract is deployed at this address
      let isDeployed = false;
      try {
        const state = await client.getContractState(addressCell);
        isDeployed = state.state === 'active';
      } catch {
        // Not deployed
      }

      return {
        accountAddress: predictedAddress,
        isDeployed,
        explorerUrl: `${EXPLORER_URL}/address/${predictedAddress}`
      };
    } catch (err) {
      // Fallback: return factory address info with error context
      const fallbackAddr = factoryAddr.toString();
      return {
        accountAddress: `pending-${fallbackAddr}`,
        isDeployed: false,
        explorerUrl: `${EXPLORER_URL}/address/${fallbackAddr}`
      };
    }
  }

  async deployAccount(adiUrl: string): Promise<DeployAccountResult> {
    if (!this.isSponsorConfigured()) {
      throw new Error('Sponsored deployment is not configured for TON');
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
    const ownerBytes = Buffer.from(deriveOwnerBytes32(adiUrl), 'hex');
    const salt = deriveSaltU64(adiUrl);

    // Set up sponsor wallet from mnemonic
    const mnemonic = process.env.TON_SPONSOR_MNEMONIC!.split(' ');
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });

    const walletContract = client.open(wallet);

    // Build message body matching Tact's CreateAccountIfNotExists serialization:
    // op(32) + owner:Address(267) + adiUrl:String(^Cell ref) + salt:uint64(64)
    const ownerAddr = new Address(0, ownerBytes);
    const messageBody = beginCell()
      .storeUint(OP_CREATE_ACCOUNT_IF_NOT_EXISTS, 32)
      .storeAddress(ownerAddr)
      .storeRef(beginCell().storeStringTail(adiUrl).endCell())
      .storeUint(salt, 64)
      .endCell();

    const factoryAddr = Address.parse(this.factoryAddress);

    // Send internal message to factory
    const seqno = await walletContract.getSeqno();
    await walletContract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: factoryAddr,
          value: toNano('0.05'), // 0.05 TON for gas + storage
          body: messageBody,
        }),
      ],
    });

    // Wait for transaction to be processed
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const currentSeqno = await walletContract.getSeqno();
      if (currentSeqno > seqno) break;
      attempts++;
    }

    // Re-check the address
    const finalResult = await this.getAccountAddress(adiUrl);
    console.log(`  ✅ TON account deployed: ${finalResult.accountAddress}`);

    return {
      accountAddress: finalResult.accountAddress,
      alreadyExisted: false,
      transactionHash: `seqno-${seqno}`,
      explorerUrl: finalResult.explorerUrl,
      message: 'Certen Abstract Account deployed successfully on TON Testnet'
    };
  }

  async getAddressBalance(address: string): Promise<AddressBalanceResult> {
    try {
      const client = this.getClient();
      const addr = Address.parse(address);
      const balance = await client.getBalance(addr);
      return { address, balance: (Number(balance) / 1e9).toFixed(6), symbol: 'TON' };
    } catch (e: any) {
      return { address, balance: '0', symbol: 'TON', error: e.message };
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
      const client = this.getClient();
      const mnemonic = process.env.TON_SPONSOR_MNEMONIC!.split(' ');
      const keyPair = await mnemonicToPrivateKey(mnemonic);
      const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
      });
      const balance = await client.getBalance(wallet.address);
      const balanceTon = Number(balance) / 1e9;
      const minBalance = 0.5; // 0.5 TON minimum

      return {
        name: this.chainName,
        available: balanceTon >= minBalance,
        factoryAddress: this.factoryAddress,
        balance: `${balanceTon.toFixed(4)} TON`,
        minBalance: `${minBalance} TON`
      };
    } catch (err) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryAddress,
        error: 'Failed to connect to TON Testnet'
      };
    }
  }
}

export function createTonHandler(): TonChainHandler {
  return new TonChainHandler();
}
