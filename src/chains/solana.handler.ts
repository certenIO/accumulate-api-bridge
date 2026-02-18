/**
 * Solana Devnet Chain Handler
 *
 * Uses the CertenAccountFactory Anchor program for account deployment.
 * Factory program: FBcWmM1w7wJ9gmzEMNhDFCVKGryGaM8yYuDfjGpdD1Nc
 *
 * The owner keypair is derived deterministically from keccak256(adiUrl).
 * The CertenAccount PDA is ["certen_account", ownerPubkey] in the CertenAccount program.
 */

import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { createHash } from 'crypto';
import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult, AddressBalanceResult } from './types.js';
import { deriveOwnerBytes32, deriveSaltU64 } from './utils.js';

const CHAIN_IDS = ['solana-devnet'];
const CHAIN_NAME = 'Solana Devnet';
const EXPLORER_URL = 'https://solscan.io';

// Program IDs
const DEFAULT_FACTORY_PROGRAM = 'FBcWmM1w7wJ9gmzEMNhDFCVKGryGaM8yYuDfjGpdD1Nc';
const DEFAULT_ACCOUNT_PROGRAM = 'DivFgpvEQyVJSUuVDHEGGXZYn13h8zRVadQLRfaSoQvS';
const DEFAULT_ANCHOR_V4_PROGRAM = '2JcPAjzBp2rdHK6AAsdw5ArrDeB1aw6fFufk7C1tYnNj';
const DEFAULT_BLS_VERIFIER_PROGRAM = '2uYnieNHceDYc1LWJsM11SYUK9hDCDrH5pfQjh5m2Hoa';

// PDA seeds (must match the Anchor program's constants)
const SEED_FACTORY_STATE = Buffer.from('factory_state');
const SEED_ADI_REGISTRY = Buffer.from('adi_registry');
const SEED_DEPLOYED_ACCOUNT = Buffer.from('deployed_account');
const SEED_FEE_VAULT = Buffer.from('fee_vault');
const SEED_CERTEN_ACCOUNT = Buffer.from('certen_account');
const SEED_ACCOUNT_VAULT = Buffer.from('account_vault');
const SEED_USER_ROLE = Buffer.from('user_role');

/**
 * Compute the Anchor 8-byte instruction discriminator.
 * Anchor discriminator = sha256("global:<instruction_name>")[0..8]
 */
function anchorDiscriminator(instructionName: string): Buffer {
  const hash = createHash('sha256').update(`global:${instructionName}`).digest();
  return Buffer.from(hash.subarray(0, 8));
}

/**
 * Borsh-serialize a Pubkey (32 bytes, raw)
 */
function serializePubkey(pubkey: PublicKey): Buffer {
  return pubkey.toBuffer();
}

/**
 * Borsh-serialize a String (u32 length prefix + UTF-8 bytes)
 */
function serializeString(str: string): Buffer {
  const bytes = Buffer.from(str, 'utf-8');
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length);
  return Buffer.concat([len, bytes]);
}

/**
 * Borsh-serialize a u64 (8 bytes, little-endian)
 */
function serializeU64(value: bigint | number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

/**
 * Compute keccak256 hash of a string, return as 32-byte Buffer.
 */
function keccak256(input: string): Buffer {
  // Use ethers-compatible keccak from the utils module
  const hex = deriveOwnerBytes32(input);
  return Buffer.from(hex, 'hex');
}

export class SolanaChainHandler implements ChainHandler {
  readonly chainIds = CHAIN_IDS;
  readonly chainName = CHAIN_NAME;
  private rpcUrl: string;
  private factoryProgramId: PublicKey;
  private accountProgramId: PublicKey;
  private anchorV4ProgramId: PublicKey;
  private blsVerifierProgramId: PublicKey;

  constructor() {
    this.rpcUrl = process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
    this.factoryProgramId = new PublicKey(
      process.env.SOLANA_FACTORY_PROGRAM_ID || DEFAULT_FACTORY_PROGRAM
    );
    this.accountProgramId = new PublicKey(
      process.env.SOLANA_CERTEN_ACCOUNT_PROGRAM_ID || DEFAULT_ACCOUNT_PROGRAM
    );
    this.anchorV4ProgramId = new PublicKey(
      process.env.SOLANA_ANCHOR_V4_PROGRAM_ID || DEFAULT_ANCHOR_V4_PROGRAM
    );
    this.blsVerifierProgramId = new PublicKey(
      process.env.SOLANA_BLS_VERIFIER_PROGRAM_ID || DEFAULT_BLS_VERIFIER_PROGRAM
    );
  }

  isSponsorConfigured(): boolean {
    return process.env.SOLANA_SPONSORED_DEPLOYMENT_ENABLED === 'true' &&
      !!process.env.SOLANA_SPONSOR_PRIVATE_KEY;
  }

  private getConnection(): Connection {
    return new Connection(this.rpcUrl, 'confirmed');
  }

  /**
   * Derive a deterministic owner Keypair from the ADI URL.
   * The seed is keccak256(adiUrl) — 32 bytes, used as Ed25519 seed.
   */
  private deriveOwnerKeypair(adiUrl: string): Keypair {
    const seed = keccak256(adiUrl);
    return Keypair.fromSeed(seed);
  }

  /**
   * Compute the CertenAccount PDA.
   * Seeds: ["certen_account", ownerPubkey] in the CertenAccount program.
   */
  private computeAccountPDA(ownerPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEED_CERTEN_ACCOUNT, ownerPubkey.toBuffer()],
      this.accountProgramId
    );
  }

  /**
   * Compute the Vault PDA that holds actual SOL for this account.
   * Seeds: ["account_vault", accountStatePDA] in the CertenAccount program.
   */
  private computeVaultPDA(accountPDA: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEED_ACCOUNT_VAULT, accountPDA.toBuffer()],
      this.accountProgramId
    );
  }

  /**
   * Compute the owner role PDA.
   * Seeds: ["user_role", accountStatePDA, ownerPubkey] in the CertenAccount program.
   */
  private computeOwnerRolePDA(accountPDA: PublicKey, ownerPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEED_USER_ROLE, accountPDA.toBuffer(), ownerPubkey.toBuffer()],
      this.accountProgramId
    );
  }

  /**
   * Compute factory_state PDA.
   * Seeds: ["factory_state"] in the factory program.
   */
  private computeFactoryStatePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEED_FACTORY_STATE],
      this.factoryProgramId
    );
  }

  /**
   * Compute ADI registry PDA.
   * Seeds: ["adi_registry", keccak256(adiUrl)] in the factory program.
   */
  private computeAdiRegistryPDA(adiUrl: string): [PublicKey, number] {
    const adiHash = keccak256(adiUrl);
    return PublicKey.findProgramAddressSync(
      [SEED_ADI_REGISTRY, adiHash],
      this.factoryProgramId
    );
  }

  /**
   * Compute deployed account registry PDA.
   * Seeds: ["deployed_account", accountPDA] in the factory program.
   */
  private computeDeployedRegistryPDA(accountPDA: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEED_DEPLOYED_ACCOUNT, accountPDA.toBuffer()],
      this.factoryProgramId
    );
  }

  /**
   * Compute fee vault PDA.
   * Seeds: ["fee_vault"] in the factory program.
   */
  private computeFeeVaultPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [SEED_FEE_VAULT],
      this.factoryProgramId
    );
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const ownerKeypair = this.deriveOwnerKeypair(adiUrl);
    const [accountPDA] = this.computeAccountPDA(ownerKeypair.publicKey);
    const [vaultPDA] = this.computeVaultPDA(accountPDA);
    const connection = this.getConnection();

    // Check if account exists on-chain
    const accountInfo = await connection.getAccountInfo(accountPDA);
    const isDeployed = accountInfo !== null;

    // Return the Vault PDA as the user's wallet address — this is where SOL lives
    // and where governance operations transfer from. The Account State PDA stores
    // governance config but doesn't hold user funds.
    return {
      accountAddress: vaultPDA.toBase58(),
      isDeployed,
      explorerUrl: `${EXPLORER_URL}/account/${vaultPDA.toBase58()}?cluster=devnet`
    };
  }

  async deployAccount(adiUrl: string): Promise<DeployAccountResult> {
    if (!this.isSponsorConfigured()) {
      throw new Error('Sponsored deployment is not configured for Solana');
    }

    // Derive owner keypair deterministically from ADI URL
    const ownerKeypair = this.deriveOwnerKeypair(adiUrl);
    const ownerPubkey = ownerKeypair.publicKey;

    // Compute account PDA and vault PDA
    const [accountPDA] = this.computeAccountPDA(ownerPubkey);
    const [vaultPDA] = this.computeVaultPDA(accountPDA);
    const connection = this.getConnection();

    // Check if already deployed
    const accountInfo = await connection.getAccountInfo(accountPDA);
    if (accountInfo !== null) {
      return {
        accountAddress: vaultPDA.toBase58(),
        alreadyExisted: true,
        transactionHash: null,
        explorerUrl: `${EXPLORER_URL}/account/${vaultPDA.toBase58()}?cluster=devnet`,
        message: 'Certen Abstract Account already exists at this address'
      };
    }

    // Sponsor keypair (pays for deployment)
    const sponsorKeyStr = process.env.SOLANA_SPONSOR_PRIVATE_KEY!;
    const sponsorKeypair = Keypair.fromSecretKey(
      Buffer.from(sponsorKeyStr, 'base64')
    );

    // Compute all required PDAs
    const [factoryState] = this.computeFactoryStatePDA();
    const [adiRegistry] = this.computeAdiRegistryPDA(adiUrl);
    const [deployedRegistry] = this.computeDeployedRegistryPDA(accountPDA);
    const [feeVault] = this.computeFeeVaultPDA();
    const [ownerRolePDA] = this.computeOwnerRolePDA(accountPDA, ownerPubkey);

    // Salt
    const salt = deriveSaltU64(adiUrl);

    // Build Anchor instruction data:
    // [8 bytes discriminator][32 bytes owner pubkey][4+N bytes adi_url string][8 bytes salt]
    const discriminator = anchorDiscriminator('create_account');
    const data = Buffer.concat([
      discriminator,
      serializePubkey(ownerPubkey),
      serializeString(adiUrl),
      serializeU64(salt),
    ]);

    // Build instruction with all 12 accounts in the correct order
    // (must match the CreateAccount struct in the Anchor program)
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: factoryState, isSigner: false, isWritable: true },         // factory_state
        { pubkey: adiRegistry, isSigner: false, isWritable: true },          // adi_registry (init)
        { pubkey: deployedRegistry, isSigner: false, isWritable: true },     // deployed_registry (init)
        { pubkey: feeVault, isSigner: false, isWritable: true },             // fee_vault
        { pubkey: accountPDA, isSigner: false, isWritable: true },           // account_pda
        { pubkey: ownerRolePDA, isSigner: false, isWritable: true },         // owner_role_pda
        { pubkey: ownerPubkey, isSigner: true, isWritable: false },          // account_owner (signer)
        { pubkey: sponsorKeypair.publicKey, isSigner: true, isWritable: true }, // payer (signer)
        { pubkey: this.accountProgramId, isSigner: false, isWritable: false }, // certen_account_program
        { pubkey: this.anchorV4ProgramId, isSigner: false, isWritable: false }, // anchor_program
        { pubkey: this.blsVerifierProgramId, isSigner: false, isWritable: false }, // verifier_program
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      ],
      programId: this.factoryProgramId,
      data,
    });

    const tx = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = sponsorKeypair.publicKey;

    // Both sponsor (payer) and owner must sign
    tx.sign(sponsorKeypair, ownerKeypair);
    const txHash = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(txHash, 'confirmed');

    // Post-deploy verification: confirm account actually exists on-chain
    const verifyInfo = await connection.getAccountInfo(accountPDA, 'confirmed');
    if (!verifyInfo) {
      throw new Error(`Account deployment TX confirmed but account ${accountPDA.toBase58()} not found on-chain`);
    }
    console.log(`  ✅ Solana account deployed and verified: ${accountPDA.toBase58()} (${verifyInfo.data.length} bytes)`);
    console.log(`  ✅ Vault PDA (user wallet): ${vaultPDA.toBase58()}`);

    return {
      accountAddress: vaultPDA.toBase58(),
      alreadyExisted: false,
      transactionHash: txHash,
      explorerUrl: `${EXPLORER_URL}/tx/${txHash}?cluster=devnet`,
      message: 'Certen Abstract Account deployed and verified on Solana Devnet'
    };
  }

  async getAddressBalance(address: string): Promise<AddressBalanceResult> {
    try {
      const connection = this.getConnection();
      const balance = await connection.getBalance(new PublicKey(address));
      return { address, balance: (balance / 1e9).toFixed(6), symbol: 'SOL' };
    } catch (e: any) {
      return { address, balance: '0', symbol: 'SOL', error: e.message };
    }
  }

  async getSponsorStatus(): Promise<SponsorStatusResult> {
    if (!this.isSponsorConfigured()) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryProgramId.toBase58(),
        error: 'Sponsor not configured'
      };
    }

    try {
      const connection = this.getConnection();
      const sponsorKeyStr = process.env.SOLANA_SPONSOR_PRIVATE_KEY!;
      const sponsorKeypair = Keypair.fromSecretKey(
        Buffer.from(sponsorKeyStr, 'base64')
      );
      const balance = await connection.getBalance(sponsorKeypair.publicKey);
      const balanceSol = balance / 1e9;
      const minBalance = 0.05; // 0.05 SOL minimum

      return {
        name: this.chainName,
        available: balanceSol >= minBalance,
        factoryAddress: this.factoryProgramId.toBase58(),
        balance: `${balanceSol.toFixed(4)} SOL`,
        minBalance: `${minBalance} SOL`
      };
    } catch (err) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryProgramId.toBase58(),
        error: 'Failed to connect to Solana Devnet'
      };
    }
  }
}

export function createSolanaHandler(): SolanaChainHandler {
  return new SolanaChainHandler();
}
