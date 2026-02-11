/**
 * Chain Handler Types
 *
 * Common interfaces for multi-chain account factory support.
 * Each chain handler implements these interfaces to provide
 * uniform account-address, deploy-account, and sponsor-status functionality.
 */

export interface AccountAddressResult {
  accountAddress: string;
  isDeployed: boolean;
  explorerUrl: string;
}

export interface DeployAccountResult {
  accountAddress: string;
  alreadyExisted: boolean;
  transactionHash: string | null;
  explorerUrl: string;
  gasUsed?: string;
  message: string;
}

export interface SponsorStatusResult {
  name: string;
  available: boolean;
  factoryAddress: string;
  balance?: string;
  minBalance?: string;
  error?: string;
}

export interface ChainHandler {
  /** Chain IDs this handler responds to (e.g. ["sepolia", "11155111"]) */
  readonly chainIds: string[];
  /** Human-readable chain name */
  readonly chainName: string;
  /** Whether this handler has sponsor keys configured for deployments */
  isSponsorConfigured(): boolean;
  /** Get the predicted account address for an ADI on this chain */
  getAccountAddress(adiUrl: string): Promise<AccountAddressResult>;
  /** Deploy (or confirm existing) abstract account for an ADI */
  deployAccount(adiUrl: string): Promise<DeployAccountResult>;
  /** Get sponsor wallet status for this chain */
  getSponsorStatus(): Promise<SponsorStatusResult>;
}

export interface ChainConfig {
  chainId: string;
  name: string;
  rpcUrl: string;
  factoryAddress: string;
  explorerUrl: string;
}
