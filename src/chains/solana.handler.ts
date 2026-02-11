/**
 * Solana Devnet Chain Handler
 *
 * Uses PDA (Program Derived Address) computation for deterministic account addresses.
 * Factory program: CertenAccountFactory on Solana Devnet.
 */

import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { ethers } from 'ethers';
import type { ChainHandler, AccountAddressResult, DeployAccountResult, SponsorStatusResult } from './types.js';
import { adiUrlHash, deriveOwnerBytes32 } from './utils.js';

const CHAIN_IDS = ['solana-devnet'];
const CHAIN_NAME = 'Solana Devnet';
const EXPLORER_URL = 'https://solscan.io';

export class SolanaChainHandler implements ChainHandler {
  readonly chainIds = CHAIN_IDS;
  readonly chainName = CHAIN_NAME;
  private rpcUrl: string;
  private factoryProgramId: string;
  private accountProgramId: string;

  constructor() {
    this.rpcUrl = process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
    this.factoryProgramId = process.env.SOLANA_FACTORY_PROGRAM_ID || 'FBcWmM1w7wJ9gmzEMNhDFCVKGryGaM8yYuDfjGpdD1Nc';
    this.accountProgramId = process.env.SOLANA_ACCOUNT_PROGRAM_ID || '2JcPAjzBp2rdHK6AAsdw5ArrDeB1aw6fFufk7C1tYnNj';
  }

  isSponsorConfigured(): boolean {
    return process.env.SOLANA_SPONSORED_DEPLOYMENT_ENABLED === 'true' &&
      !!process.env.SOLANA_SPONSOR_PRIVATE_KEY;
  }

  private getConnection(): Connection {
    return new Connection(this.rpcUrl, 'confirmed');
  }

  private deriveOwnerPubkey(adiUrl: string): PublicKey {
    const hashHex = deriveOwnerBytes32(adiUrl);
    const bytes = Buffer.from(hashHex, 'hex');
    return new PublicKey(bytes);
  }

  private derivePDA(adiUrl: string): [PublicKey, number] {
    const ownerPubkey = this.deriveOwnerPubkey(adiUrl);
    const programId = new PublicKey(this.factoryProgramId);
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('certen_account'),
        ownerPubkey.toBuffer(),
      ],
      programId
    );
  }

  async getAccountAddress(adiUrl: string): Promise<AccountAddressResult> {
    const [pda] = this.derivePDA(adiUrl);
    const connection = this.getConnection();

    // Check if account exists on-chain
    const accountInfo = await connection.getAccountInfo(pda);
    const isDeployed = accountInfo !== null;

    return {
      accountAddress: pda.toBase58(),
      isDeployed,
      explorerUrl: `${EXPLORER_URL}/account/${pda.toBase58()}?cluster=devnet`
    };
  }

  async deployAccount(adiUrl: string): Promise<DeployAccountResult> {
    if (!this.isSponsorConfigured()) {
      throw new Error('Sponsored deployment is not configured for Solana');
    }

    const [pda] = this.derivePDA(adiUrl);
    const connection = this.getConnection();

    // Check if already deployed
    const accountInfo = await connection.getAccountInfo(pda);
    if (accountInfo !== null) {
      return {
        accountAddress: pda.toBase58(),
        alreadyExisted: true,
        transactionHash: null,
        explorerUrl: `${EXPLORER_URL}/account/${pda.toBase58()}?cluster=devnet`,
        message: 'Certen Abstract Account already exists at this address'
      };
    }

    // Build and send deployment transaction
    const sponsorKeyStr = process.env.SOLANA_SPONSOR_PRIVATE_KEY!;
    const sponsorKeypair = Keypair.fromSecretKey(
      Buffer.from(sponsorKeyStr, 'base64')
    );

    const ownerPubkey = this.deriveOwnerPubkey(adiUrl);
    const programId = new PublicKey(this.factoryProgramId);

    // Encode the ADI URL as instruction data
    const adiUrlBytes = Buffer.from(adiUrl, 'utf-8');
    // Instruction layout: [1 byte discriminator] [4 bytes url_len] [url bytes]
    const discriminator = Buffer.from([0]); // 0 = create_account
    const urlLen = Buffer.alloc(4);
    urlLen.writeUInt32LE(adiUrlBytes.length);
    const data = Buffer.concat([discriminator, urlLen, adiUrlBytes]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: sponsorKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: ownerPubkey, isSigner: false, isWritable: false },
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId,
      data,
    });

    const tx = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = sponsorKeypair.publicKey;

    tx.sign(sponsorKeypair);
    const txHash = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(txHash, 'confirmed');

    console.log(`  ✅ Solana account deployed: ${pda.toBase58()}`);

    return {
      accountAddress: pda.toBase58(),
      alreadyExisted: false,
      transactionHash: txHash,
      explorerUrl: `${EXPLORER_URL}/tx/${txHash}?cluster=devnet`,
      message: 'Certen Abstract Account deployed successfully on Solana Devnet'
    };
  }

  async getSponsorStatus(): Promise<SponsorStatusResult> {
    if (!this.isSponsorConfigured()) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryProgramId,
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
        factoryAddress: this.factoryProgramId,
        balance: `${balanceSol.toFixed(4)} SOL`,
        minBalance: `${minBalance} SOL`
      };
    } catch (err) {
      return {
        name: this.chainName,
        available: false,
        factoryAddress: this.factoryProgramId,
        error: 'Failed to connect to Solana Devnet'
      };
    }
  }
}

export function createSolanaHandler(): SolanaChainHandler {
  return new SolanaChainHandler();
}
