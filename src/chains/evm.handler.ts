/**
 * EVM Chain Handler
 *
 * Handles account-address, deploy-account, and sponsor-status for all EVM chains.
 * Refactored from inline logic in server.ts.
 */

import { ethers } from 'ethers';
import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult, AddressBalanceResult, ChainConfig } from './types.js';
import { deriveEvmOwner, deriveSaltU256 } from './utils.js';

// Infura API key from environment — never hardcode secrets in source
const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
function infuraUrl(network: string): string {
  return `https://${network}.infura.io/v3/${INFURA_API_KEY}`;
}

// CertenAccountFactory ABI (minimal - only what we need)
const ACCOUNT_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'string', name: 'adiURL', type: 'string' },
      { internalType: 'uint256', name: 'salt', type: 'uint256' }
    ],
    name: 'createAccountIfNotExists',
    outputs: [
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'string', name: 'adiURL', type: 'string' },
      { internalType: 'uint256', name: 'salt', type: 'uint256' }
    ],
    name: 'getAddress',
    outputs: [
      { internalType: 'address', name: 'accountAddress', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' }
    ],
    name: 'isDeployedAccount',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'deploymentFee',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

export class EvmChainHandler implements ChainHandler {
  readonly chainIds: string[];
  readonly chainName: string;
  private config: ChainConfig;
  private _provider: ethers.JsonRpcProvider | null = null;

  constructor(config: ChainConfig, extraIds: string[] = []) {
    this.config = config;
    this.chainName = config.name;
    this.chainIds = [config.chainId, ...extraIds];
  }

  private getProvider(): ethers.JsonRpcProvider {
    if (!this._provider) {
      this._provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    }
    return this._provider;
  }

  isSponsorConfigured(): boolean {
    return process.env.EVM_SPONSORED_DEPLOYMENT_ENABLED === 'true' &&
      !!process.env.EVM_SPONSOR_PRIVATE_KEY;
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const ownerAddress = deriveEvmOwner(adiUrl);
    const salt = deriveSaltU256(adiUrl);

    const factory = new ethers.Contract(
      this.config.factoryAddress,
      ACCOUNT_FACTORY_ABI,
      this.getProvider()
    ) as any;

    const predictedAddress: string = await factory.getAddress(ownerAddress, adiUrl, salt);

    // Moonbeam fix: validate that factory didn't return zero/empty address
    if (!predictedAddress || predictedAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Factory on ${this.chainName} returned invalid address. The contract may not be properly deployed or may be incompatible.`);
    }

    const isDeployed: boolean = await factory.isDeployedAccount(predictedAddress);

    return {
      accountAddress: predictedAddress,
      isDeployed,
      explorerUrl: `${this.config.explorerUrl}/address/${predictedAddress}`
    };
  }

  async deployAccount(adiUrl: string): Promise<DeployAccountResult> {
    if (!this.isSponsorConfigured()) {
      throw new Error('Sponsored deployment is not configured for EVM chains');
    }

    const ownerAddress = deriveEvmOwner(adiUrl);
    const salt = deriveSaltU256(adiUrl);

    const sponsorPrivateKey = process.env.EVM_SPONSOR_PRIVATE_KEY!;
    const provider = this.getProvider();
    const sponsorWallet = new ethers.Wallet(sponsorPrivateKey, provider);

    const factory = new ethers.Contract(
      this.config.factoryAddress,
      ACCOUNT_FACTORY_ABI,
      sponsorWallet
    ) as any;

    // Parallel: check balance, predict address, and get fee in one round trip
    const minBalance = ethers.parseEther(process.env.EVM_SPONSOR_MIN_BALANCE || '0.01');
    const [sponsorBalance, predictedAddress, deploymentFee] = await Promise.all([
      provider.getBalance(sponsorWallet.address),
      factory.getAddress(ownerAddress, adiUrl, salt) as Promise<string>,
      factory.deploymentFee() as Promise<bigint>,
    ]);

    console.log(`  Sponsor balance: ${ethers.formatEther(sponsorBalance)} ETH`);

    if (sponsorBalance < minBalance) {
      throw new Error('Sponsor wallet balance too low. Please contact support.');
    }

    // Moonbeam fix: validate address
    if (!predictedAddress || predictedAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Factory on ${this.chainName} returned invalid address. The contract may not be properly deployed or may be incompatible.`);
    }

    // Check if already deployed (needs predicted address from above)
    const alreadyDeployed: boolean = await factory.isDeployedAccount(predictedAddress);

    if (alreadyDeployed) {
      return {
        accountAddress: predictedAddress,
        alreadyExisted: true,
        transactionHash: null,
        explorerUrl: `${this.config.explorerUrl}/address/${predictedAddress}`,
        message: 'Certen Abstract Account already exists at this address'
      };
    }

    // Deploy the account
    console.log(`  Deploying on ${this.chainName}...`);
    console.log(`  Deployment fee: ${ethers.formatEther(deploymentFee)} ETH`);

    const tx = await factory.createAccountIfNotExists(ownerAddress, adiUrl, salt, { value: deploymentFee });
    console.log(`  Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      throw new Error(`Transaction failed on ${this.chainName}`);
    }

    // Parse the AccountDeployed event
    let deployedAddress = predictedAddress;
    const accountDeployedTopic = '0xf92d8f64e097b6044b318e7dc56258b83e25d40b31866b4af076cf98ae167dee';
    for (const log of receipt.logs) {
      if (log.topics && log.topics[0] === accountDeployedTopic && log.topics[1]) {
        deployedAddress = '0x' + log.topics[1].slice(-40);
        break;
      }
    }

    return {
      accountAddress: deployedAddress,
      alreadyExisted: false,
      transactionHash: tx.hash,
      explorerUrl: `${this.config.explorerUrl}/tx/${tx.hash}`,
      gasUsed: receipt.gasUsed.toString(),
      message: 'Certen Abstract Account deployed successfully'
    };
  }

  async getAddressBalance(address: string): Promise<AddressBalanceResult> {
    try {
      const balance = await this.getProvider().getBalance(address);
      return { address, balance: ethers.formatEther(balance), symbol: 'ETH' };
    } catch (e: any) {
      return { address, balance: '0', symbol: 'ETH', error: e.message };
    }
  }

  async getSponsorStatus(): Promise<SponsorStatusResult> {
    const sponsorAddress = process.env.EVM_SPONSOR_ADDRESS;
    if (!this.isSponsorConfigured() || !sponsorAddress) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.config.factoryAddress,
        error: 'Sponsor not configured'
      };
    }

    try {
      const balance = await this.getProvider().getBalance(sponsorAddress);
      const minBalance = ethers.parseEther(process.env.EVM_SPONSOR_MIN_BALANCE || '0.01');

      return {
        name: this.chainName,
        available: balance >= minBalance,
        factoryAddress: this.config.factoryAddress,
        balance: ethers.formatEther(balance),
        minBalance: ethers.formatEther(minBalance)
      };
    } catch (err) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.config.factoryAddress,
        error: 'Failed to connect to chain'
      };
    }
  }
}

// ---- EVM chain configurations ----
// V5 Factory: deterministic cross-chain address (same on all EVM chains)
const V5_FACTORY = '0x2e6037afFA783d487664b2440c691fc86Bc18A17';

const SEPOLIA_CONFIG: ChainConfig = {
  chainId: 'sepolia',
  name: 'Ethereum Sepolia',
  rpcUrl: process.env.EVM_SEPOLIA_RPC_URL || infuraUrl('sepolia'),
  factoryAddress: process.env.EVM_SEPOLIA_ACCOUNT_FACTORY || V5_FACTORY,
  explorerUrl: 'https://sepolia.etherscan.io'
};

const ARBITRUM_SEPOLIA_CONFIG: ChainConfig = {
  chainId: 'arbitrum-sepolia',
  name: 'Arbitrum Sepolia',
  rpcUrl: process.env.EVM_ARBITRUM_SEPOLIA_RPC_URL || infuraUrl('arbitrum-sepolia'),
  factoryAddress: process.env.EVM_ARBITRUM_SEPOLIA_ACCOUNT_FACTORY || V5_FACTORY,
  explorerUrl: 'https://sepolia.arbiscan.io'
};

const BASE_SEPOLIA_CONFIG: ChainConfig = {
  chainId: 'base-sepolia',
  name: 'Base Sepolia',
  rpcUrl: process.env.EVM_BASE_SEPOLIA_RPC_URL || infuraUrl('base-sepolia'),
  factoryAddress: process.env.EVM_BASE_SEPOLIA_ACCOUNT_FACTORY || V5_FACTORY,
  explorerUrl: 'https://sepolia-explorer.base.org'
};

const BSC_TESTNET_CONFIG: ChainConfig = {
  chainId: 'bsc-testnet',
  name: 'BSC Testnet',
  rpcUrl: process.env.EVM_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
  factoryAddress: process.env.EVM_BSC_TESTNET_ACCOUNT_FACTORY || V5_FACTORY,
  explorerUrl: 'https://testnet.bscscan.com'
};

const OPTIMISM_SEPOLIA_CONFIG: ChainConfig = {
  chainId: 'optimism-sepolia',
  name: 'Optimism Sepolia',
  rpcUrl: process.env.EVM_OPTIMISM_SEPOLIA_RPC_URL || infuraUrl('optimism-sepolia'),
  factoryAddress: process.env.EVM_OPTIMISM_SEPOLIA_ACCOUNT_FACTORY || V5_FACTORY,
  explorerUrl: 'https://sepolia-optimistic.etherscan.io'
};

const POLYGON_AMOY_CONFIG: ChainConfig = {
  chainId: 'polygon-amoy',
  name: 'Polygon Amoy',
  rpcUrl: process.env.EVM_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
  factoryAddress: process.env.EVM_POLYGON_AMOY_ACCOUNT_FACTORY || V5_FACTORY,
  explorerUrl: 'https://amoy.polygonscan.com'
};

const MOONBASE_ALPHA_CONFIG: ChainConfig = {
  chainId: 'moonbase-alpha',
  name: 'Moonbeam Moonbase Alpha',
  rpcUrl: process.env.EVM_MOONBASE_ALPHA_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network',
  factoryAddress: process.env.EVM_MOONBASE_ALPHA_ACCOUNT_FACTORY || V5_FACTORY,
  explorerUrl: 'https://moonbase.moonscan.io'
};

/** Create all EVM chain handlers */
export function createEvmHandlers(): EvmChainHandler[] {
  return [
    new EvmChainHandler(SEPOLIA_CONFIG, ['11155111']),
    new EvmChainHandler(ARBITRUM_SEPOLIA_CONFIG, ['421614']),
    new EvmChainHandler(BASE_SEPOLIA_CONFIG, ['84532']),
    new EvmChainHandler(BSC_TESTNET_CONFIG, ['97']),
    new EvmChainHandler(OPTIMISM_SEPOLIA_CONFIG, ['11155420']),
    new EvmChainHandler(POLYGON_AMOY_CONFIG, ['80002']),
    new EvmChainHandler(MOONBASE_ALPHA_CONFIG, ['1287']),
  ];
}
