/**
 * CERTEN API Bridge Server
 *
 * HTTP API server that provides Accumulate network integration
 * for the CERTEN Protocol Web Application
 *
 * Default configuration: Kermit Testnet (206.191.154.164)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { AccumulateService } from './AccumulateService.js';
import { AdiStorageService } from './AdiStorageService.js';
import { CertenIntentService, CreateIntentRequest, CreateMultiLegIntentRequest, IntentLeg, ExecutionMode } from './CertenIntentService.js';
import { getChainHandler, getAllChainHandlers, getRegisteredChainIds } from './chains/index.js';
import { VALIDATOR_ADDRESSES, CHAIN_HANDLER_IDS, NON_EVM_CHAINS } from './chains/validator-addresses.js';

// Native token decimals per chain (EVM defaults to 18)
const CHAIN_DECIMALS: Record<string, number> = {
  'tron': 6, 'tron mainnet': 6, 'tron-mainnet': 6,
  'tron shasta': 6, 'tron-shasta': 6, 'tron shasta testnet': 6, 'tron-testnet': 6, 'tron testnet': 6,
  'solana': 9, 'solana-mainnet': 9, 'solana-testnet': 9, 'solana-devnet': 9,
  'near': 24, 'near-mainnet': 24, 'near-testnet': 24,
};

function getChainDecimals(chain: string): number {
  return CHAIN_DECIMALS[chain.toLowerCase()] ?? 18;
}

function getChainSymbol(chain: string): string {
  const lower = chain.toLowerCase();
  if (lower.includes('tron')) return 'TRX';
  if (lower.includes('solana')) return 'SOL';
  if (lower.includes('near')) return 'NEAR';
  return 'ETH';
}

function convertToBaseUnits(amount: string, decimals: number): string {
  const amountStr = amount.toString();
  const [integerPart, decimalPart = ''] = amountStr.split('.');
  const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integerPart + paddedDecimal).toString();
}

// Load environment variables first
dotenv.config();

const app = express();
const port = process.env.PORT || 8085;

// Fix BigInt JSON serialization
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

// CORS configuration - allow web app origins
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3000,https://certen-web.web.app').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Also allow any localhost origin for development
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Initialize services
let accumulateService: AccumulateService;
let adiStorageService: AdiStorageService;
let certenIntentService: CertenIntentService;

try {
  accumulateService = new AccumulateService();
  adiStorageService = new AdiStorageService();
  certenIntentService = new CertenIntentService(accumulateService);
  console.log('✅ Fixed Accumulate service initialized');
  console.log('✅ ADI Storage service initialized');
  console.log('✅ Certen Intent service initialized');
} catch (error) {
  console.error('❌ Failed to initialize services:', error);
  process.exit(1);
}

// Helper function for retrying network operations with delays
async function retryWithDelay<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  delayMs: number = 2000,
  operationName: string = 'operation'
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${operationName}`);
      const result = await operation();
      console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.log(`❌ ${operationName} failed on attempt ${attempt}:`, error instanceof Error ? error.message : error);

      if (attempt === maxRetries) {
        console.log(`💥 ${operationName} failed after ${maxRetries} attempts`);
        throw error;
      }

      console.log(`⏳ Waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Retry logic failed unexpectedly for ${operationName}`);
}

/**
 * Wait for an account to exist on the network by polling
 * Used after creating ADI to ensure it has propagated before next step
 */
async function waitForAccountToExist(
  accountUrl: string,
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<boolean> {
  console.log(`⏳ Waiting for account to exist: ${accountUrl}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await accumulateService.getAccount(accountUrl);
      // getAccount returns { success: true, account: {...} } on success
      if (result && (result.success || result.account)) {
        console.log(`✅ Account exists after ${attempt} attempt(s): ${accountUrl}`);
        return true;
      }
    } catch (error) {
      // Account doesn't exist yet, keep polling
    }

    if (attempt < maxAttempts) {
      console.log(`🔄 Polling attempt ${attempt}/${maxAttempts} - account not yet available, waiting ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Account ${accountUrl} did not become available after ${maxAttempts} attempts`);
}

/**
 * Wait for credits to appear on a keypage by polling
 * Used after adding credits to ensure the transaction has settled
 */
async function waitForKeyPageCredits(
  keyPageUrl: string,
  minCredits: number = 1,
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<number> {
  console.log(`⏳ Waiting for credits on keypage: ${keyPageUrl} (min: ${minCredits})`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await accumulateService.getAccount(keyPageUrl);
      const creditBalance = result?.account?.creditBalance || result?.creditBalance || 0;

      if (creditBalance >= minCredits) {
        console.log(`✅ Credits found after ${attempt} attempt(s): ${creditBalance} on ${keyPageUrl}`);
        return creditBalance;
      }

      console.log(`🔄 Polling attempt ${attempt}/${maxAttempts} - credits: ${creditBalance}, waiting ${delayMs}ms...`);
    } catch (error) {
      console.log(`🔄 Polling attempt ${attempt}/${maxAttempts} - keypage query failed, waiting ${delayMs}ms...`);
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Credits did not appear on ${keyPageUrl} after ${maxAttempts} attempts`);
}

// Comprehensive ADI credential mapping from environment variables
function getAdiCredentialsFromEnv(adiUrl: string): { privateKey: string; publicKey: string; publicKeyHash: string } | null {
  // Direct ADI registry mappings
  const adiRegistry: Record<string, { privateKey: string; publicKey: string; publicKeyHash: string }> = {
    'acc://certen-demo-13112025.acme': {
      privateKey: process.env.CERTEN_ACCOUNT_V2_PRIVATE_KEY || '',
      publicKey: process.env.CERTEN_ACCOUNT_V2_PUBLIC_KEY || '',
      publicKeyHash: process.env.CERTEN_ACCOUNT_V2_PUBLIC_KEY_HASH || ''
    },
    'acc://certen.acme': {
      privateKey: process.env.CERTEN_ACCOUNT_PRIVATE_KEY || '',
      publicKey: process.env.CERTEN_ACCOUNT_PUBLIC_KEY || '',
      publicKeyHash: process.env.CERTEN_ACCOUNT_PUBLIC_KEY_HASH || ''
    },
    'acc://certenprotocol.acme': {
      privateKey: process.env.CERTEN_KEYPAGE_PRIVATE_KEY || '',
      publicKey: process.env.CERTEN_KEYPAGE_PUBLIC_KEY || '',
      publicKeyHash: process.env.CERTEN_KEYPAGE_PUBLIC_KEY_HASH || ''
    },
    'acc://certenprotocol.acme/book': {
      privateKey: process.env.CERTEN_KEYPAGE_PRIVATE_KEY || '',
      publicKey: process.env.CERTEN_KEYPAGE_PUBLIC_KEY || '',
      publicKeyHash: process.env.CERTEN_KEYPAGE_PUBLIC_KEY_HASH || ''
    },
    'acc://certenprotocol.acme/book/1': {
      privateKey: process.env.CERTEN_KEYPAGE_PRIVATE_KEY || '',
      publicKey: process.env.CERTEN_KEYPAGE_PUBLIC_KEY || '',
      publicKeyHash: process.env.CERTEN_KEYPAGE_PUBLIC_KEY_HASH || ''
    },
    'acc://certenprotocol.acme/staked': {
      privateKey: process.env.CERTEN_STAKED_KEYPAGE_PRIVATE_KEY || '',
      publicKey: process.env.CERTEN_STAKED_KEYPAGE_PUBLIC_KEY || '',
      publicKeyHash: process.env.CERTEN_STAKED_KEYPAGE_PUBLIC_KEY_HASH || ''
    },
    // Base Accumulate Credits Payer ADI
    'acc://549e7ac1e763aa247b13323856395536907017f9aeabb98a/acme': {
      privateKey: process.env.ACCUM_PRIV_KEY || '',
      publicKey: process.env.ACCUM_PUBLIC_KEY || '',
      publicKeyHash: process.env.ACCUM_PUBLIC_KEY_HASH || ''
    },
    'acc://549e7ac1e763aa247b13323856395536907017f9aeabb98a': {
      privateKey: process.env.ACCUM_PRIV_KEY || '',
      publicKey: process.env.ACCUM_PUBLIC_KEY || '',
      publicKeyHash: process.env.ACCUM_PUBLIC_KEY_HASH || ''
    }
  };

  // Check direct registry first
  if (adiRegistry[adiUrl] && adiRegistry[adiUrl].privateKey) {
    console.log(`🎯 Found direct registry mapping for ADI: ${adiUrl}`);
    return adiRegistry[adiUrl];
  }

  // Pattern-based environment variable detection
  const patterns = [
    { pattern: /acc:\/\/certen-demo-(\d+)\.acme/, envPrefix: 'CERTEN_ACCOUNT_V2' },
    { pattern: /acc:\/\/certen\.acme/, envPrefix: 'CERTEN_ACCOUNT' },
    { pattern: /acc:\/\/test-(\w+)\.acme/, envPrefix: 'TEST_ACCOUNT' },
    { pattern: /acc:\/\/dev-(\w+)\.acme/, envPrefix: 'DEV_ACCOUNT' },
    { pattern: /acc:\/\/(\w+)-demo\.acme/, envPrefix: 'DEMO_ACCOUNT' }
  ];

  for (const { pattern, envPrefix } of patterns) {
    const match = adiUrl.match(pattern);
    if (match) {
      const privateKey = process.env[`${envPrefix}_PRIVATE_KEY`] || '';
      const publicKey = process.env[`${envPrefix}_PUBLIC_KEY`] || '';
      const publicKeyHash = process.env[`${envPrefix}_PUBLIC_KEY_HASH`] || '';

      if (privateKey) {
        console.log(`🔍 Found pattern-based credentials for ADI: ${adiUrl} using ${envPrefix}`);
        return { privateKey, publicKey, publicKeyHash };
      }
    }
  }

  // Dynamic environment variable search for any ADI
  const envVarPattern = /^(\w+)_PRIVATE_KEY$/;
  const envKeys = Object.keys(process.env);

  for (const envKey of envKeys) {
    const match = envKey.match(envVarPattern);
    if (match) {
      const basePrefix = match[1];
      const privateKey = process.env[`${basePrefix}_PRIVATE_KEY`] || '';
      const publicKey = process.env[`${basePrefix}_PUBLIC_KEY`] || '';
      const publicKeyHash = process.env[`${basePrefix}_PUBLIC_KEY_HASH`] || '';

      // Check if this could be for the requested ADI based on naming patterns
      const normalizedUrl = adiUrl.replace(/acc:\/\//, '').replace(/[.-]/g, '_').toUpperCase();
      if (basePrefix.includes(normalizedUrl.split('_')[0]) || normalizedUrl.includes(basePrefix.toLowerCase())) {
        if (privateKey) {
          console.log(`🧭 Found dynamic credentials for ADI: ${adiUrl} using ${basePrefix}`);
          return { privateKey, publicKey, publicKeyHash };
        }
      }
    }
  }

  console.log(`❓ No credentials found for ADI: ${adiUrl}`);
  return null;
}

// Automatic ADI Registry Service - Pre-populate known ADIs on startup
async function initializeAdiRegistry() {
  console.log('🚀 Initializing ADI Registry with automatic credential detection...');

  const knownAdis = [
    process.env.CERTEN_ACCOUNT_V2_ADI,
    'acc://certenprotocol.acme',
    'acc://certenprotocol.acme/book',
    'acc://certenprotocol.acme/book/1',
    'acc://certenprotocol.acme/staked',
    process.env.ACCUM_LTA,
    process.env.ACCUM_LID
  ].filter(Boolean); // Remove undefined values

  let registeredCount = 0;
  let skippedCount = 0;

  for (const adiUrl of knownAdis) {
    if (!adiUrl) continue;

    try {
      // Check if ADI already exists in storage
      const existingAdi = adiStorageService.getAdi(adiUrl);
      if (existingAdi && existingAdi.privateKey) {
        console.log(`✅ ADI already registered: ${adiUrl}`);
        skippedCount++;
        continue;
      }

      // Get credentials for this ADI
      const credentials = getAdiCredentialsFromEnv(adiUrl);
      if (!credentials || !credentials.privateKey) {
        console.log(`⚠️ No credentials available for ADI: ${adiUrl}`);
        continue;
      }

      // Try to fetch ADI details from Accumulate network
      console.log(`🔍 Fetching ADI details from network: ${adiUrl}`);
      const accountResult = await accumulateService.getAccount(adiUrl);

      if (accountResult && accountResult.account) {
        // Store the ADI with credentials
        const adiToStore = {
          adiUrl: adiUrl,
          adiName: adiUrl.split('//')[1] || adiUrl, // Extract name from URL
          bookUrl: accountResult.account.keyBook || `${adiUrl}/book`,
          privateKey: credentials.privateKey,
          publicKey: credentials.publicKey,
          publicKeyHash: credentials.publicKeyHash,
          keyPageUrl: `${adiUrl}/book/1`,
          creditBalance: accountResult.account.creditBalance || 0,
          createdAt: new Date().toISOString(),
          transactionHash: accountResult.account.transactionHash || 'auto-registered'
        };

        adiStorageService.saveAdi(adiToStore);
        console.log(`✅ Auto-registered ADI: ${adiUrl}`);
        registeredCount++;
      } else {
        console.log(`❓ ADI not found on network: ${adiUrl}`);
      }
    } catch (error) {
      console.log(`❌ Failed to auto-register ADI ${adiUrl}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`🎯 ADI Registry initialization complete: ${registeredCount} registered, ${skippedCount} skipped`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'accumulate-bridge',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get service configuration
app.get('/config', (req, res) => {
  try {
    const config = accumulateService.getConfig();
    res.json({
      success: true,
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create ADI endpoint (real implementation)
app.post('/api/v1/adi/create', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'ADI URL is required'
      });
    }

    console.log(`🆔 Creating ADI: ${url}`);

    const result = await accumulateService.createIdentity(url);

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to create ADI:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Verify ADI creation endpoint with retry mechanism
app.get('/api/v1/adi/:url/verify', async (req, res) => {
  try {
    let { url } = req.params;
    url = decodeURIComponent(url);

    if (!url.startsWith('acc://')) {
      url = `acc://${url}`;
    }

    console.log(`🔍 Verifying ADI with retry: ${url}`);

    const account = await retryWithDelay(
      async () => {
        const result = await accumulateService.getAccount(url);
        if (!result || !result.account) {
          throw new Error('Account not found or not yet propagated');
        }
        return result;
      },
      10, // max retries (doubled from 5 to 10)
      2000, // 2 second delay
      `ADI verification for ${url}`
    );

    res.json({
      success: true,
      verified: true,
      adiUrl: url,
      account: account.account,
      message: 'ADI successfully verified'
    });

  } catch (error) {
    console.error('❌ Failed to verify ADI after retries:', error);
    res.status(404).json({
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'ADI not found after waiting for network propagation'
    });
  }
});

// Verify keypage exists endpoint with retry mechanism
app.get('/api/v1/keypage/:url/verify', async (req, res) => {
  try {
    let { url } = req.params;
    url = decodeURIComponent(url);

    if (!url.startsWith('acc://')) {
      url = `acc://${url}`;
    }

    console.log(`🔍 Verifying keypage with retry: ${url}`);

    const account = await retryWithDelay(
      async () => {
        const result = await accumulateService.getAccount(url);
        if (!result || !result.account) {
          throw new Error('Keypage not found or not yet propagated');
        }
        return result;
      },
      10, // max retries (doubled from 5 to 10)
      2000, // 2 second delay
      `Keypage verification for ${url}`
    );

    res.json({
      success: true,
      verified: true,
      keypageUrl: url,
      account: account.account,
      message: 'Keypage successfully verified'
    });

  } catch (error) {
    console.error('❌ Failed to verify keypage after retries:', error);
    res.status(404).json({
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Keypage not found after waiting for network propagation'
    });
  }
});

// Create key book endpoint (real implementation)
app.post('/api/v1/keybook/create', async (req, res) => {
  try {
    const { adiName, keyBookName, adiUrl, keyBookUrl, publicKeyHash } = req.body;

    // Extract ADI name from adiUrl if adiName is not provided
    let finalAdiName = adiName;
    if (!finalAdiName && adiUrl) {
      // Extract from "acc://test-debug-1762015679.acme" -> "test-debug-1762015679.acme"
      finalAdiName = adiUrl.replace('acc://', '');
    }

    // Extract keybook name from keyBookUrl if keyBookName is not provided
    let finalKeyBookName = keyBookName;
    if (!finalKeyBookName && keyBookUrl) {
      // Extract from "acc://test-debug-1762015679.acme/book2" -> "book2"
      const parts = keyBookUrl.split('/');
      finalKeyBookName = parts[parts.length - 1];
    }

    if (!finalAdiName) {
      return res.status(400).json({
        success: false,
        error: 'ADI name or adiUrl is required'
      });
    }

    if (!finalKeyBookName) {
      return res.status(400).json({
        success: false,
        error: 'Key book name or keyBookUrl is required'
      });
    }

    if (!publicKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'Public key hash is required'
      });
    }

    // Validate public key hash is valid hex
    if (!/^[0-9a-fA-F]{64}$/.test(publicKeyHash)) {
      return res.status(400).json({
        success: false,
        error: 'Public key hash must be a 64-character hexadecimal string'
      });
    }

    console.log(`📖 Creating key book: ${finalKeyBookName} under ADI: ${finalAdiName}`);

    const result = await accumulateService.createKeyBook(finalAdiName, finalKeyBookName, publicKeyHash);

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to create key book:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// TWO-PHASE SIGNING FOR KEYBOOK CREATION (Key Vault integration)
// =============================================================================

/**
 * Prepare a KeyBook creation transaction for Key Vault signing.
 * Phase 1: Returns the hash that needs to be signed by the Key Vault.
 */
app.post('/api/v1/keybook/create/prepare', async (req, res) => {
  try {
    const { adiName, keyBookName, adiUrl, keyBookUrl, publicKeyHash, signerPublicKey, signerKeypageUrl } = req.body;

    // Extract ADI name from adiUrl if adiName is not provided
    let finalAdiName = adiName;
    if (!finalAdiName && adiUrl) {
      finalAdiName = adiUrl.replace('acc://', '');
    }

    // Extract keybook name from keyBookUrl if keyBookName is not provided
    let finalKeyBookName = keyBookName;
    if (!finalKeyBookName && keyBookUrl) {
      const parts = keyBookUrl.split('/');
      finalKeyBookName = parts[parts.length - 1];
    }

    if (!finalAdiName) {
      return res.status(400).json({
        success: false,
        error: 'ADI name or adiUrl is required'
      });
    }

    if (!finalKeyBookName) {
      return res.status(400).json({
        success: false,
        error: 'Key book name or keyBookUrl is required'
      });
    }

    if (!publicKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'Public key hash is required (for the new KeyBook)'
      });
    }

    if (!signerPublicKey) {
      return res.status(400).json({
        success: false,
        error: 'Signer public key is required for Key Vault signing'
      });
    }

    console.log(`🔐 Preparing KeyBook creation for Key Vault signing: ${finalKeyBookName} under ADI: ${finalAdiName}`);

    const result = await accumulateService.prepareKeyBookCreate(
      finalAdiName,
      finalKeyBookName,
      publicKeyHash,
      signerPublicKey,
      signerKeypageUrl
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      request_id: result.requestId,
      transaction_hash: result.transactionHash,
      hash_to_sign: result.hashToSign,
      signer_key_page_url: result.signerKeyPageUrl,
      key_page_version: result.keyPageVersion,
      adi_url: result.adiUrl,
      key_book_url: result.keyBookUrl
    });

  } catch (error) {
    console.error('❌ Failed to prepare KeyBook creation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Submit a prepared KeyBook creation with a signature from Key Vault.
 * Phase 2: Submits the transaction with the external signature.
 */
app.post('/api/v1/keybook/create/submit-signed', async (req, res) => {
  try {
    const { requestId, signature, publicKey } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Signature is required'
      });
    }

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required'
      });
    }

    console.log(`📤 Submitting signed KeyBook creation: ${requestId}`);

    const result = await accumulateService.submitKeyBookCreateWithExternalSignature(
      requestId,
      signature,
      publicKey
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      tx_id: result.txId,
      tx_hash: result.txHash,
      adi_url: result.adiUrl,
      key_book_url: result.keyBookUrl
    });

  } catch (error) {
    console.error('❌ Failed to submit signed KeyBook creation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create data account endpoint (real implementation)
app.post('/api/v1/data-account/create', async (req, res) => {
  try {
    const { adiName, dataAccountName } = req.body;

    if (!adiName) {
      return res.status(400).json({
        success: false,
        error: 'ADI name is required'
      });
    }

    if (!dataAccountName) {
      return res.status(400).json({
        success: false,
        error: 'Data account name is required'
      });
    }

    console.log(`📄 Creating data account: ${dataAccountName} under ADI: ${adiName}`);

    const result = await accumulateService.createDataAccount(adiName, dataAccountName);

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to create data account:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create complete deployment (ADI + data account + credits) in single operation
app.post('/api/v1/deployment/complete', async (req, res) => {
  try {
    const { adiName, creditsAmount } = req.body;

    if (!adiName) {
      return res.status(400).json({
        success: false,
        error: 'ADI name is required'
      });
    }

    console.log(`🚀 Starting complete deployment for ADI: ${adiName}`);

    // Step 1: Create ADI
    console.log(`🆔 Creating ADI: ${adiName}`);
    const adiResult = await accumulateService.createIdentity(adiName);

    console.log(`✅ ADI created: ${adiResult.adiUrl}`);

    // Step 2: Add credits to keypage if requested
    if (creditsAmount && creditsAmount > 0) {
      const keyPageUrl = `${adiResult.adiUrl}/book/1`;
      console.log(`💳 Adding ${creditsAmount} credits to keypage: ${keyPageUrl}`);

      const creditsResult = await accumulateService.addCredits(keyPageUrl, creditsAmount);
      console.log(`✅ Credits added: ${creditsResult.txId}`);
    }

    // Step 3: Create data account (uses LID key for ADI keypage signing)
    const dataAccountName = 'data';
    const dataAccountUrl = `${adiResult.adiUrl}/${dataAccountName}`;

    console.log(`📄 Creating data account: ${dataAccountUrl}`);
    const dataResult = await accumulateService.createDataAccount(adiName, dataAccountName);

    console.log(`✅ Data account created: ${dataResult.dataAccountUrl}`);

    // Return combined results
    res.json({
      success: true,
      adi: adiResult,
      dataAccount: dataResult,
      credits: creditsAmount ? {
        amount: creditsAmount,
        recipient: `${adiResult.adiUrl}/book/1`
      } : null,
      message: 'Complete deployment created successfully'
    });

  } catch (error) {
    console.error('❌ Failed to create complete deployment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create deployment data account endpoint (creates <adi>/data specifically)
app.post('/api/v1/deployment/data-account', async (req, res) => {
  try {
    const { adiUrl } = req.body;

    if (!adiUrl) {
      return res.status(400).json({
        success: false,
        error: 'ADI URL is required'
      });
    }

    // Extract ADI name and create data account
    const adiName = adiUrl.replace('acc://', '');
    const dataAccountName = 'data';
    const dataAccountUrl = `${adiUrl}/data`;

    console.log(`📄 Creating deployment data account: ${dataAccountUrl}`);

    const result = await accumulateService.createDataAccount(adiName, dataAccountName);

    res.json({
      ...result,
      dataAccountUrl: dataAccountUrl,
      message: 'Deployment data account created successfully'
    });

  } catch (error) {
    console.error('❌ Failed to create deployment data account:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create keypage endpoint (real implementation)
app.post('/api/v1/keypage/create', async (req, res) => {
  try {
    console.log('🔑 Received KeyPage creation request:', JSON.stringify(req.body, null, 2));

    const { keyBookUrl, publicKey, publicKeyHash, keys, delegates, threshold, useSDKPattern } = req.body;

    if (!keyBookUrl) {
      console.log('❌ Missing keyBookUrl in request');
      return res.status(400).json({
        success: false,
        error: 'Key book URL is required'
      });
    }

    // Handle both old format (publicKey/publicKeyHash) and new format (keys array)
    let finalPublicKey = publicKey;
    let finalPublicKeyHash = publicKeyHash;

    if (!finalPublicKey && !finalPublicKeyHash) {
      // Check if using new format with keys array
      if (keys && Array.isArray(keys) && keys.length > 0) {
        const firstKey = keys[0];
        if (firstKey.keyHash) {
          finalPublicKeyHash = firstKey.keyHash;
        } else if (firstKey.publicKey) {
          finalPublicKey = firstKey.publicKey;
        }
      }
    }

    // Require either publicKey or publicKeyHash
    if (!finalPublicKey && !finalPublicKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'Either publicKey or publicKeyHash is required (directly or in keys array)'
      });
    }

    console.log(`🔑 Creating keypage in key book: ${keyBookUrl} with ${finalPublicKeyHash ? 'publicKeyHash' : 'publicKey'}`);
    if (useSDKPattern) {
      console.log(`🔧 Using SDK pattern with keys:`, keys, 'delegates:', delegates, 'threshold:', threshold);
    }

    const result = await accumulateService.createKeyPage(keyBookUrl, finalPublicKey, finalPublicKeyHash);

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to create keypage:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// TWO-PHASE SIGNING FOR KEYPAGE CREATION (Key Vault integration)
// =============================================================================

/**
 * Prepare a KeyPage creation transaction for Key Vault signing.
 * Phase 1: Returns the hash that needs to be signed by the Key Vault.
 */
app.post('/api/v1/keypage/create/prepare', async (req, res) => {
  try {
    const { keyBookUrl, publicKeyHash, keys, signerPublicKey, signerKeypageUrl } = req.body;

    if (!keyBookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Key book URL is required'
      });
    }

    if (!signerPublicKey) {
      return res.status(400).json({
        success: false,
        error: 'Signer public key is required for Key Vault signing'
      });
    }

    // Get the key hash for the new KeyPage
    let newKeyPageKeyHash = publicKeyHash;
    if (!newKeyPageKeyHash && keys && Array.isArray(keys) && keys.length > 0) {
      newKeyPageKeyHash = keys[0].keyHash;
    }

    if (!newKeyPageKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'Public key hash is required (for the new KeyPage)'
      });
    }

    console.log(`🔐 Preparing KeyPage creation for Key Vault signing in KeyBook: ${keyBookUrl}`);

    const result = await accumulateService.prepareKeyPageCreate(
      keyBookUrl,
      newKeyPageKeyHash,
      signerPublicKey,
      signerKeypageUrl
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      request_id: result.requestId,
      transaction_hash: result.transactionHash,
      hash_to_sign: result.hashToSign,
      signer_key_page_url: result.signerKeyPageUrl,
      key_page_version: result.keyPageVersion,
      key_book_url: result.keyBookUrl
    });

  } catch (error) {
    console.error('❌ Failed to prepare KeyPage creation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Submit a prepared KeyPage creation with a signature from Key Vault.
 * Phase 2: Submits the transaction with the external signature.
 */
app.post('/api/v1/keypage/create/submit-signed', async (req, res) => {
  try {
    const { requestId, signature, publicKey } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Signature is required'
      });
    }

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required'
      });
    }

    console.log(`📤 Submitting signed KeyPage creation: ${requestId}`);

    const result = await accumulateService.submitKeyPageCreateWithExternalSignature(
      requestId,
      signature,
      publicKey
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      tx_id: result.txId,
      tx_hash: result.txHash,
      key_book_url: result.keyBookUrl
    });

  } catch (error) {
    console.error('❌ Failed to submit signed KeyPage creation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// ACCOUNT AUTHORITIES TWO-PHASE SIGNING ENDPOINTS
// =============================================================================

/**
 * POST /api/v1/account/authorities/prepare
 *
 * Phase 1 of two-phase signing for account authority updates.
 * Prepares the transaction and returns hash_to_sign for Key Vault signing.
 * This ensures user approval is required for ALL authority modifications.
 */
app.post('/api/v1/account/authorities/prepare', async (req, res) => {
  console.log('\n🔐 POST /api/v1/account/authorities/prepare (Two-Phase Signing - Phase 1)');

  try {
    const { accountUrl, operations, publicKey, signerKeypageUrl } = req.body;

    // Validate required fields
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'public_key is required for two-phase signing (from Key Vault)'
      });
    }

    if (!accountUrl) {
      return res.status(400).json({
        success: false,
        error: 'Account URL is required'
      });
    }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Operations array is required and must contain at least one operation'
      });
    }

    // Validate each operation
    for (const operation of operations) {
      if (!operation.type || !['addAuthority', 'removeAuthority', 'enable', 'disable'].includes(operation.type)) {
        return res.status(400).json({
          success: false,
          error: 'Each operation must have a valid type: addAuthority, removeAuthority, enable, or disable'
        });
      }
      if (!operation.authority && operation.type !== 'enable' && operation.type !== 'disable') {
        return res.status(400).json({
          success: false,
          error: 'AddAuthority and RemoveAuthority operations must have an authority URL'
        });
      }
    }

    console.log(`  Account: ${accountUrl}`);
    console.log(`  Operations: ${operations.length}`);
    console.log(`  Public key: ${publicKey?.slice(0, 20)}...`);

    const result = await accumulateService.prepareAccountAuthUpdate(
      accountUrl,
      operations,
      publicKey,
      signerKeypageUrl
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to prepare authority update'
      });
    }

    console.log('✅ Authority update prepared for Key Vault signing');

    res.json({
      success: true,
      request_id: result.requestId,
      transaction_hash: result.transactionHash,
      hash_to_sign: result.hashToSign,  // THIS is what Key Vault should sign!
      signer_key_page_url: result.signerKeyPageUrl,
      key_page_version: result.keyPageVersion,
      operations: result.operations,
      message: 'Authority update prepared. Sign hash_to_sign with Key Vault and call /api/v1/account/authorities/submit-signed'
    });

  } catch (error) {
    console.error('❌ Failed to prepare authority update:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/account/authorities/submit-signed
 *
 * Phase 2 of two-phase signing for account authority updates.
 * Accepts the signature from Key Vault and submits the transaction.
 */
app.post('/api/v1/account/authorities/submit-signed', async (req, res) => {
  console.log('\n📤 POST /api/v1/account/authorities/submit-signed (Two-Phase Signing - Phase 2)');

  try {
    const { request_id, signature, public_key } = req.body;

    console.log('  Submitting signed authority update:', {
      request_id,
      hasSignature: !!signature,
      hasPublicKey: !!public_key
    });

    // Validate required fields
    if (!request_id) {
      return res.status(400).json({
        success: false,
        error: 'request_id is required (from /api/v1/account/authorities/prepare)'
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'signature is required (from Key Vault)'
      });
    }

    if (!public_key) {
      return res.status(400).json({
        success: false,
        error: 'public_key is required (from Key Vault)'
      });
    }

    const result = await accumulateService.submitAccountAuthWithExternalSignature(
      request_id,
      signature,
      public_key
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to submit authority update'
      });
    }

    console.log('✅ Authority update submitted with Key Vault signature');

    res.json({
      success: true,
      txId: result.txId,
      tx_hash: result.txHash,
      account_url: result.accountUrl,
      operations: result.operations,
      message: 'Authority update submitted successfully with Key Vault signature'
    });

  } catch (error) {
    console.error('❌ Failed to submit authority update:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Legacy endpoint (DEPRECATED - use two-phase signing endpoints instead)
// Update account authorities endpoint (real implementation)
app.post('/api/v1/account/authorities/update', async (req, res) => {
  console.log('\n⚠️ WARNING: /api/v1/account/authorities/update is DEPRECATED');
  console.log('  Use /api/v1/account/authorities/prepare + /submit-signed for Key Vault signing');

  try {
    const { accountUrl, operations, signerKeypageUrl } = req.body;

    if (!accountUrl) {
      return res.status(400).json({
        success: false,
        error: 'Account URL is required'
      });
    }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Operations array is required and must contain at least one operation'
      });
    }

    // Validate each operation
    for (const operation of operations) {
      if (!operation.type || !['addAuthority', 'removeAuthority', 'enable', 'disable'].includes(operation.type)) {
        return res.status(400).json({
          success: false,
          error: 'Each operation must have a valid type: addAuthority, removeAuthority, enable, or disable'
        });
      }
      if (!operation.authority) {
        return res.status(400).json({
          success: false,
          error: 'Each operation must have an authority URL'
        });
      }
    }

    console.log(`🔐 Updating account authorities for: ${accountUrl}`);
    console.log(`📝 Operations: ${operations.map(op => `${op.type} ${op.authority}`).join(', ')}`);

    const result = await accumulateService.updateAccountAuth(accountUrl, operations, signerKeypageUrl);

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to update account authorities:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add credits to keypage endpoint
app.post('/api/v1/credits/add', async (req, res) => {
  try {
    const { recipient, amount } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'Recipient keypage URL is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount in ACME tokens is required'
      });
    }

    console.log(`💳 Adding ${amount} ACME credits to: ${recipient}`);

    const result = await accumulateService.addCredits(recipient, amount);

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to add credits:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Purchase 100000 credits for keypage (specific endpoint for deployment)
app.post('/api/v1/credits/purchase-deployment', async (req, res) => {
  try {
    const { recipient } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'Recipient keypage URL is required'
      });
    }

    // Fixed amount: 100000 credits (= 1000 ACME tokens)
    const creditsNeeded = 100000;
    const amountACME = creditsNeeded / 100; // 1000 ACME

    console.log(`💳 Purchasing ${creditsNeeded} credits (${amountACME} ACME) for deployment: ${recipient}`);

    const result = await accumulateService.addCredits(recipient, amountACME);

    res.json({
      ...result,
      creditsTargeted: creditsNeeded,
      amountACME: amountACME,
      message: `Successfully purchased ${creditsNeeded} credits for deployment`
    });

  } catch (error) {
    console.error('❌ Failed to purchase deployment credits:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get account balance
app.get('/api/v1/account/:url/balance', async (req, res) => {
  try {
    const { url } = req.params;

    console.log(`💰 Getting balance for: ${url}`);

    const balance = await accumulateService.getBalance(url);

    res.json({
      success: true,
      balance
    });

  } catch (error) {
    console.error('❌ Failed to get balance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// DATA ACCOUNT AUTHORITIES ENDPOINT
// NOTE: This MUST be defined BEFORE /api/v1/account/:url to avoid route conflict
// =============================================================================

/**
 * GET /api/v1/account/authorities
 * Get current authorities and pending authority updates for a data account
 */
app.get('/api/v1/account/authorities', async (req, res) => {
  try {
    const { accountUrl, adiUrl } = req.query;

    if (!accountUrl) {
      return res.status(400).json({
        success: false,
        error: 'accountUrl is required'
      });
    }

    console.log(`🔍 Getting authorities for account: ${accountUrl}`);

    // Query the account to get its authorities
    const accountResult = await accumulateService.getAccount(accountUrl as string);

    if (!accountResult || !accountResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Get authority URLs from the account
    const authorityUrls = accountResult.account?.authorities || [];
    console.log(`📋 Found ${authorityUrls.length} authorities on account`);

    // Build authorities list with details
    const authorities: Array<{
      id: string;
      keyBookUrl: string;
      name: string;
      enabled: boolean;
      existsOnNetwork: boolean;
      isInherited: boolean;
      disabled?: boolean;
    }> = [];

    for (let i = 0; i < authorityUrls.length; i++) {
      const authUrl = authorityUrls[i];
      const keyBookUrl = typeof authUrl === 'string' ? authUrl : (authUrl.url || authUrl.toString());

      // Determine if this is the inherited main keybook
      const isMainKeyBook = adiUrl && keyBookUrl === `${adiUrl}/book`;

      // Check if authority is disabled (Accumulate allows disabling individual authorities)
      const isDisabled = typeof authUrl === 'object' && authUrl.disabled === true;

      authorities.push({
        id: `auth-${i}`,
        keyBookUrl,
        name: isMainKeyBook ? 'Inherited Authority (Main KeyBook)' : `Authority: ${keyBookUrl.split('/').pop()}`,
        enabled: !isDisabled,
        existsOnNetwork: true,
        isInherited: isMainKeyBook || false,
        disabled: isDisabled
      });
    }

    // If no explicit authorities, the account inherits from ADI's main keybook
    if (authorities.length === 0 && adiUrl) {
      const inheritedKeyBookUrl = `${adiUrl}/book`;
      console.log(`📋 No explicit authorities - adding inherited authority: ${inheritedKeyBookUrl}`);
      authorities.push({
        id: 'inherited-auth-0',
        keyBookUrl: inheritedKeyBookUrl,
        name: 'Inherited Authority (Main KeyBook)',
        enabled: true,
        existsOnNetwork: true,
        isInherited: true,
        disabled: false
      });
    }

    // Query pending transactions for updateAccountAuth operations
    const pendingAuthorities: Array<{
      id: string;
      keyBookUrl: string;
      name: string;
      operationType: string; // 'addAuthority' | 'removeAuthority' | 'enable' | 'disable'
      txHash: string;
      existsOnNetwork: boolean;
    }> = [];

    try {
      console.log(`🔍 Querying pending transactions for: ${accountUrl}`);
      const pendingResult = await accumulateService.getPendingTransactions(accountUrl as string);

      console.log(`📋 Pending query result:`, {
        success: pendingResult.success,
        pendingCount: pendingResult.pending?.length || 0,
        error: pendingResult.error
      });

      if (pendingResult.success && pendingResult.pending) {
        for (const pendingTx of pendingResult.pending) {
          console.log(`📝 Pending tx:`, {
            txHash: pendingTx.txHash?.substring(0, 16),
            txType: pendingTx.txType,
            hasBody: !!pendingTx.body
          });

          // Log full body for debugging
          console.log(`📝 Pending tx full body:`, JSON.stringify(pendingTx.body, null, 2));

          // Check transaction type - handle both direct updateAccountAuth (type 14)
          // and RemoteTransaction (type 21) which wraps the actual transaction
          const txTypeStr = String(pendingTx.txType).toLowerCase();
          let body = pendingTx.body;
          let isUpdateAccountAuth = false;

          // Type 14 = updateAccountAuth directly
          if (txTypeStr === '14' || txTypeStr === 'updateaccountauth') {
            isUpdateAccountAuth = true;
          }
          // Type 21 = RemoteTransaction - check inner transaction type
          else if (txTypeStr === '21' || txTypeStr === 'remotetransaction') {
            console.log(`🔍 Type 21 (RemoteTransaction) detected, checking inner body...`);
            // RemoteTransaction may have the actual body type inside
            const innerType = body?.type?.toString()?.toLowerCase() || '';
            console.log(`  Inner body type: ${innerType}`);
            if (innerType === '14' || innerType === 'updateaccountauth') {
              isUpdateAccountAuth = true;
            }
            // Also check if body has operations directly (some formats embed operations)
            if (body?.operations && Array.isArray(body.operations)) {
              console.log(`  Found operations array directly in type 21 body`);
              isUpdateAccountAuth = true;
            }
          }

          if (isUpdateAccountAuth) {
            console.log(`🔐 updateAccountAuth tx body:`, JSON.stringify(body, null, 2));

            if (body?.operations && Array.isArray(body.operations)) {
              for (const op of body.operations) {
                const opType = String(op.type || '').toLowerCase();
                let operationType = 'unknown';
                let opKeyBookUrl = '';

                if (opType.includes('add')) {
                  operationType = 'addAuthority';
                  opKeyBookUrl = op.authority?.toString() || '';
                } else if (opType.includes('remove')) {
                  operationType = 'removeAuthority';
                  opKeyBookUrl = op.authority?.toString() || '';
                } else if (opType.includes('enable')) {
                  operationType = 'enable';
                  opKeyBookUrl = op.authority?.toString() || '';
                } else if (opType.includes('disable')) {
                  operationType = 'disable';
                  opKeyBookUrl = op.authority?.toString() || '';
                }

                console.log(`  Operation: ${opType} -> ${operationType}, authority: ${opKeyBookUrl}`);

                if (opKeyBookUrl) {
                  pendingAuthorities.push({
                    id: `pending-${pendingTx.txHash}-${opKeyBookUrl}`,
                    keyBookUrl: opKeyBookUrl,
                    name: `Pending: ${opKeyBookUrl.split('/').pop()}`,
                    operationType,
                    txHash: pendingTx.txHash,
                    existsOnNetwork: false
                  });
                }
              }
            }
          }
        }
      }
    } catch (pendingError) {
      console.warn('⚠️ Failed to query pending transactions:', pendingError);
      // Continue without pending - don't fail the whole request
    }

    console.log(`✅ Found ${authorities.length} authorities, ${pendingAuthorities.length} pending operations`);

    res.json({
      success: true,
      accountUrl,
      authorities,
      pendingAuthorities,
      totalAuthorities: authorities.length,
      totalPending: pendingAuthorities.length
    });

  } catch (error) {
    console.error('❌ Failed to get account authorities:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get account information
app.get('/api/v1/account/:url', async (req, res) => {
  try {
    const { url } = req.params;

    console.log(`🔍 Getting account: ${url}`);

    const account = await accumulateService.getAccount(url);

    res.json({
      success: true,
      account
    });

  } catch (error) {
    console.error('❌ Failed to get account:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get network status
app.get('/api/v1/network/status', async (req, res) => {
  try {
    console.log('📊 Getting network status');

    const status = await accumulateService.getNetworkStatus();

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('❌ Failed to get network status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current oracle price
app.get('/api/v1/oracle/price', async (req, res) => {
  try {
    console.log('🔮 Getting oracle price');

    const oraclePrice = await accumulateService.getOraclePrice();

    res.json({
      success: true,
      oraclePrice,
      precision: 2,
      note: 'Oracle price has precision 2'
    });

  } catch (error) {
    console.error('❌ Failed to get oracle price:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Query transaction status endpoint
app.post('/api/v1/query', async (req, res) => {
  try {
    const { url, prove } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Transaction URL is required'
      });
    }

    console.log(`🔍 Querying transaction: ${url}`, { prove });

    const result = await accumulateService.queryTransaction(url, prove);

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to query transaction:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🎯 CREATE CERTEN TRANSACTION INTENT - Core Endpoint
app.post('/api/v1/intent/create', async (req, res) => {
  try {
    const { intent, contractAddresses, executionParameters, validationRules, expirationMinutes, adiPrivateKey, signerKeyPageUrl, proofClass } = req.body;

    console.log('🎯 Creating Certen transaction intent', {
      intentId: intent?.id,
      fromChain: intent?.fromChain,
      toChain: intent?.toChain,
      amount: intent?.amount,
      adiUrl: intent?.adiUrl,
      proofClass: proofClass || 'on_demand (default)'
    });

    // Validate required fields
    if (!intent) {
      return res.status(400).json({
        success: false,
        error: 'Intent object is required'
      });
    }

    if (!contractAddresses) {
      return res.status(400).json({
        success: false,
        error: 'Contract addresses are required'
      });
    }

    // Validate proof_class if provided (must be 'on_demand' or 'on_cadence')
    if (proofClass !== undefined && proofClass !== 'on_demand' && proofClass !== 'on_cadence') {
      return res.status(400).json({
        success: false,
        error: `Invalid proof_class: '${proofClass}'. Must be 'on_demand' or 'on_cadence'`
      });
    }

    // Private key is optional - will use environment fallback if not provided
    const privateKeyToUse = adiPrivateKey || process.env.ACCUM_PRIV_KEY?.substring(0, 64) || '';
    if (!privateKeyToUse) {
      return res.status(400).json({
        success: false,
        error: 'No private key available - provide adiPrivateKey or set ACCUM_PRIV_KEY environment variable'
      });
    }

    // Create intent request
    const createIntentRequest: CreateIntentRequest = {
      intent,
      contractAddresses,
      executionParameters,
      validationRules,
      expirationMinutes: expirationMinutes || 95,
      proofClass: proofClass || 'on_demand'  // Default to on_demand for immediate processing
    };

    // Create the intent using CertenIntentService
    const result = await certenIntentService.createTransactionIntent(
      createIntentRequest,
      privateKeyToUse,
      signerKeyPageUrl
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to create Certen intent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// TWO-PHASE SIGNING ENDPOINTS (for Key Vault external signing)
// =============================================================================

/**
 * PREPARE INTENT - Phase 1 of two-phase signing
 * Returns transaction hash for external signing by Key Vault extension
 */
app.post('/api/v1/intent/prepare', async (req, res) => {
  try {
    const {
      intent,
      contractAddresses,
      executionParameters,
      validationRules,
      expirationMinutes,
      signerKeyPageUrl,
      proofClass,
      publicKey,
      // Advanced Transaction Conditions (wired to Accumulate transaction header)
      transactionMetadata,     // User-provided metadata string
      expireAtTime,            // Unix timestamp (seconds) for transaction expiration
      additionalAuthorities    // Array of additional authority URLs
    } = req.body;

    console.log('🎯 Preparing Certen transaction intent (Phase 1 - Two-Phase Signing)', {
      intentId: intent?.id,
      adiUrl: intent?.adiUrl,
      fromChain: intent?.fromChain,
      toChain: intent?.toChain,
      amount: intent?.amount,
      hasPublicKey: !!publicKey,
      hasMetadata: !!transactionMetadata,
      hasExpire: !!expireAtTime,
      hasAuthorities: !!additionalAuthorities?.length
    });

    // Validate required fields
    if (!intent) {
      return res.status(400).json({
        success: false,
        error: 'Intent object is required'
      });
    }

    if (!contractAddresses) {
      return res.status(400).json({
        success: false,
        error: 'Contract addresses are required'
      });
    }

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'publicKey is required for two-phase signing (from Key Vault)'
      });
    }

    // Validate proof_class if provided (must be 'on_demand' or 'on_cadence')
    if (proofClass !== undefined && proofClass !== 'on_demand' && proofClass !== 'on_cadence') {
      return res.status(400).json({
        success: false,
        error: `Invalid proof_class: '${proofClass}'. Must be 'on_demand' or 'on_cadence'`
      });
    }

    // Extract ADI name from URL
    const adiUrl = intent.adiUrl;
    const adiName = adiUrl.replace('acc://', '').split('.')[0];
    const dataAccountName = 'data';

    // Generate 4-blob data entries matching certen-protocol spec
    const nowMs = Date.now();
    const nowSeconds = Math.floor(nowMs / 1000);
    const expirationMins = expirationMinutes || 95;
    const expiresAtSeconds = nowSeconds + (expirationMins * 60);
    const nonce = `certen_${nowMs}_${Math.random().toString(36).substring(7)}`;

    // Convert amount to base units using chain-specific decimals
    const chainDecimals = getChainDecimals(intent.toChain || 'ethereum');
    const amountWei = convertToBaseUnits(intent.amount, chainDecimals);
    const legId = `leg-${(intent.toChain || 'ethereum').toLowerCase()}-${intent.toChainId || 11155111}-1`;

    // data[0]: intentData - Protocol metadata, proof_class, descriptions
    const intentData = {
      kind: "CERTEN_INTENT",
      version: "1.0",
      proof_class: proofClass || 'on_demand',
      intentType: "single_leg_cross_chain_transfer",
      description: `Transfer ${intent.amount} ${intent.tokenSymbol || 'ETH'} from ${intent.fromChain} to ${intent.toChain}`,
      organizationAdi: adiUrl,
      initiator: {
        adi: adiUrl,
        by: intent.initiatedBy,
        role: "organization_operator"
      },
      priority: "high",
      risk_level: parseFloat(intent.amount) > 1.0 ? "high" : "medium",
      compliance_required: false,
      estimated_gas: (executionParameters?.gasLimit || 300000).toString(),
      estimated_fees: {
        network_fee_gwei: (parseInt(executionParameters?.maxFeePerGas || "20000000000") / 1e9).toString(),
        priority_fee_gwei: (parseInt(executionParameters?.maxPriorityFeePerGas || "2000000000") / 1e9).toString(),
        total_cost_eth: "0.00042"
      },
      intent_id: intent.id,
      created_by: intent.initiatedBy,
      created_at: new Date(intent.timestamp).toISOString(),
      intent_class: "financial_transfer",
      regulatory_jurisdiction: "global",
      tags: [intent.tokenSymbol?.toLowerCase() || "eth", intent.toChain?.toLowerCase() || "sepolia", "intent"]
    };

    // data[1]: crossChainData - Chain details, legs, gas policies
    const crossChainData = {
      protocol: "CERTEN",
      version: "1.0",
      operationGroupId: intent.id,
      legs: [
        {
          legId: legId,
          role: "payment",
          chain: (intent.toChain || "ethereum").toLowerCase().includes("sepolia") ? "ethereum" : (intent.toChain || "ethereum").toLowerCase(),
          chainId: intent.toChainId || 11155111,
          network: (intent.toChain || "sepolia").toLowerCase(),
          asset: {
            symbol: intent.tokenSymbol || getChainSymbol(intent.toChain || 'ethereum'),
            decimals: chainDecimals,
            native: !intent.tokenAddress,
            contract_address: intent.tokenAddress || null,
            verified: true
          },
          from: intent.fromAddress,
          to: intent.toAddress,
          amountEth: intent.amount,
          amountWei: amountWei,
          execution_sequence: 1,
          conditional_execution: false,
          rollback_conditions: {
            timeout_seconds: 3600,
            failure_modes: ["gas_limit_exceeded", "insufficient_balance"]
          },
          anchorContract: {
            address: contractAddresses?.anchor || "0x8398D7EB594bCc608a0210cf206b392d35Ed5339",
            functionSelector: "commitAnchor(bytes32,bytes)",
            version: "v2.1"
          },
          gasPolicy: {
            maxFeePerGasGwei: (parseInt(executionParameters?.maxFeePerGas || "20000000000") / 1e9).toString(),
            maxPriorityFeePerGasGwei: (parseInt(executionParameters?.maxPriorityFeePerGas || "2000000000") / 1e9).toString(),
            gasLimit: executionParameters?.gasLimit || 300000,
            payer: "from",
            gas_estimation_buffer: 1.2
          },
          slippage_tolerance: "0.5%",
          deadline_timestamp: expiresAtSeconds
        }
      ],
      atomicity: {
        mode: "single_leg",
        rollback_strategy: "all_or_nothing",
        partial_execution_allowed: false
      },
      execution_constraints: {
        max_execution_time_seconds: 3600,
        required_confirmations: 1,
        parallel_execution: false
      },
      cross_chain_routing: {
        bridge_type: "certen_anchor",
        relay_mechanism: "proof_based",
        finality_requirements: "fast"
      }
    };

    // data[2]: governanceData - Authorization, validation rules, compliance
    const keyBook = signerKeyPageUrl ? signerKeyPageUrl.replace(/\/page\/\d+$/, '/book') : `${adiUrl}/book`;
    const keyPage = signerKeyPageUrl || `${adiUrl}/book/1`;
    const governanceData = {
      organizationAdi: adiUrl,
      authorization: {
        required_key_book: keyBook,
        required_key_page: keyPage,
        signature_threshold: 1,
        required_signers: [publicKey],
        roles: [
          {
            role: "DEFAULT_SIGNER",
            keyPage: keyPage
          }
        ],
        authorization_hash: ""  // Will be set after operation_id calculation
      },
      validation_rules: {
        max_amount: validationRules?.maxAmount || "1000000",
        daily_limit: validationRules?.dailyLimit || "10000",
        requires_approval: validationRules?.requiresApproval || false,
        risk_level: parseFloat(intent.amount) > 1.0 ? "high" : "medium"
      },
      compliance_checks: {
        aml_required: parseFloat(intent.amount) > 10000,
        kyc_verified: true,
        sanctions_check: "passed",
        jurisdiction: "compliant"
      }
    };

    // data[3]: replayData - Nonces, timestamps (Unix SECONDS), security
    const replayData = {
      nonce: nonce,
      created_at: nowSeconds,
      expires_at: expiresAtSeconds,
      intent_hash: "",  // Will be calculated below
      chain_nonces: {
        [(intent.fromChain || "ethereum").toLowerCase()]: "latest",
        accumulated: "1"
      },
      execution_window: {
        start_time: nowSeconds,
        end_time: expiresAtSeconds,
        grace_period_minutes: 5,
        max_retries: 3
      },
      security: {
        double_spending_protection: true,
        replay_attack_prevention: true,
        temporal_validation: "strict",
        nonce_validation: "required"
      }
    };

    // Calculate operation_id from all 4 blobs (sha256 of concatenated JSON)
    const operationIdPayload = JSON.stringify([intentData, crossChainData, governanceData, replayData]);
    const operationId = '0x' + crypto.createHash('sha256').update(operationIdPayload).digest('hex');

    // Update replayData with calculated operation_id
    replayData.intent_hash = operationId;
    governanceData.authorization.authorization_hash = operationId;

    // Create 4 data entries
    const dataEntries = [
      JSON.stringify(intentData),     // data[0]: intentData
      JSON.stringify(crossChainData), // data[1]: crossChainData
      JSON.stringify(governanceData), // data[2]: governanceData
      JSON.stringify(replayData)      // data[3]: replayData
    ];

    // Prepare transaction without signing - pass publicKey for proper hash computation
    // Also pass Advanced Transaction Conditions for the Accumulate transaction header
    const result = await accumulateService.prepareWriteData(
      adiName,
      dataAccountName,
      dataEntries,
      signerKeyPageUrl,
      'CERTEN_INTENT',
      publicKey,              // Required for computing initiator and proper hash to sign
      transactionMetadata,    // User-provided metadata for transaction header
      expireAtTime,           // Transaction expiration timestamp
      additionalAuthorities   // Additional authority URLs required for this tx
    );

    if (result.success) {
      console.log('✅ Intent preparation successful', {
        requestId: result.requestId,
        transactionHash: result.transactionHash,
        hashToSign: result.hashToSign
      });

      res.json({
        success: true,
        requestId: result.requestId,
        transactionHash: result.transactionHash,
        hashToSign: result.hashToSign,  // THIS is what Key Vault should sign!
        signerKeyPageUrl: result.signerKeyPageUrl,
        keyPageVersion: result.keyPageVersion,
        intentId: intent.id,
        message: 'Transaction prepared. Sign the hashToSign with Key Vault and call /api/v1/intent/submit-signed'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Failed to prepare Certen intent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * SUBMIT SIGNED INTENT - Phase 2 of two-phase signing
 * Accepts the signature from Key Vault and submits the transaction
 */
app.post('/api/v1/intent/submit-signed', async (req, res) => {
  try {
    const { requestId, signature, publicKey } = req.body;

    console.log('📤 Submitting signed intent (Phase 2 - Two-Phase Signing)', {
      requestId,
      hasSignature: !!signature,
      hasPublicKey: !!publicKey
    });

    // Validate required fields
    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'requestId is required (from /api/v1/intent/prepare)'
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'signature is required (from Key Vault)'
      });
    }

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'publicKey is required (from Key Vault)'
      });
    }

    // Submit with external signature
    const result = await accumulateService.submitWithExternalSignature(
      requestId,
      signature,
      publicKey
    );

    if (result.success) {
      console.log('✅ Signed intent submitted successfully', {
        txHash: result.txHash,
        signatureTxHash: result.signatureTxHash,
        dataTransactionHash: result.dataTransactionHash
      });

      res.json({
        success: true,
        txHash: result.txHash,
        signatureTxHash: result.signatureTxHash,
        dataTransactionHash: result.dataTransactionHash,
        dataAccountUrl: result.dataAccountUrl,
        message: 'Transaction submitted successfully with Key Vault signature'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Failed to submit signed intent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Write data to data account endpoint (real implementation)
app.post('/api/v1/data-account/write', async (req, res) => {
  try {
    const { adiName, dataAccountName, dataEntries, adiPrivateKey, signerKeyPageUrl, memo } = req.body;

    if (!adiName) {
      return res.status(400).json({
        success: false,
        error: 'ADI name is required'
      });
    }

    if (!dataAccountName) {
      return res.status(400).json({
        success: false,
        error: 'Data account name is required'
      });
    }

    if (!dataEntries || !Array.isArray(dataEntries) || dataEntries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Data entries array is required and must contain at least one entry'
      });
    }

    // Validate each entry is a string
    if (!dataEntries.every(entry => typeof entry === 'string')) {
      return res.status(400).json({
        success: false,
        error: 'All data entries must be strings'
      });
    }

    console.log(`📝 Writing ${dataEntries.length} entries to data account: ${dataAccountName} under ADI: ${adiName}`, {
      hasPrivateKey: !!adiPrivateKey,
      signerKeyPageUrl: signerKeyPageUrl || 'using default',
      hasMemo: !!memo,
      memo: memo || 'none'
    });

    const result = await accumulateService.writeData(
      adiName,
      dataAccountName,
      dataEntries,
      adiPrivateKey,
      signerKeyPageUrl,
      memo  // Optional memo field for intent discovery
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to write data to data account:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get credit balance (supports both LID accounts and keypages)
app.get('/api/v1/credits/balance', async (req, res) => {
  try {
    // Check if account URL is provided as query parameter
    const accountUrl = req.query.account as string;

    // Default to LID if no account specified
    const targetUrl = accountUrl || process.env.ACCUM_LID;

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'Account URL required (either as query parameter ?account=URL or LID configured)'
      });
    }

    console.log(`💳 Getting credit balance: ${targetUrl}`);

    const account = await accumulateService.getAccount(targetUrl);

    if (!account || !account.account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const accountData = account.account;
    const accountType = accountData.type;

    console.log(`🔍 Account type debug:`, {
      accountType,
      accountTypeType: typeof accountType,
      accountData: JSON.stringify(accountData, null, 2)
    });

    let rawCredits = 0;
    let accountTypeDesc = '';

    // Parse credits based on account type (using numeric enum values)
    if (accountType === 15 || accountType === 'liteIdentity') {
      // LID account (AccountType.LiteIdentity = 15) - credits from creditBalance
      rawCredits = parseInt(accountData.creditBalance?.toString() || '0');
      accountTypeDesc = 'Lite Identity (LID)';
    } else if (accountType === 9 || accountType === 'keyPage') {
      // Keypage account (AccountType.KeyPage = 9) - credits from creditBalance
      rawCredits = parseInt(accountData.creditBalance?.toString() || '0');
      accountTypeDesc = 'Key Page';
    } else {
      return res.status(400).json({
        success: false,
        error: `Account type '${accountType}' does not support credit balances. Only 'liteIdentity' (15) and 'keyPage' (9) accounts have credits.`
      });
    }

    // Credits have precision 2 (divide by 100 for display)
    const creditsFormatted = (rawCredits / 100).toFixed(2);

    res.json({
      success: true,
      account: targetUrl,
      accountType: accountTypeDesc,
      type: 'credits',
      balance: rawCredits.toString(),
      creditsRemaining: rawCredits,
      creditsFormatted: creditsFormatted,
      precision: 2
    });

  } catch (error) {
    console.error('❌ Failed to get credit balance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Verify credit balance meets minimum (for deployment verification) with retry mechanism
app.get('/api/v1/credits/verify-minimum', async (req, res) => {
  try {
    const accountUrl = req.query.account as string;
    const minimumRequired = parseInt(req.query.minimum as string) || 100000;

    if (!accountUrl) {
      return res.status(400).json({
        success: false,
        error: 'Account URL required as query parameter ?account=URL'
      });
    }

    console.log(`🔍 Verifying ${accountUrl} has at least ${minimumRequired} credits with retry`);

    const rawCredits = await retryWithDelay(
      async () => {
        const credits = await accumulateService.getCreditBalance(accountUrl);

        // Only succeed if we have sufficient credits (not just that account exists)
        if (credits < minimumRequired) {
          throw new Error(`Insufficient credits: ${credits} < ${minimumRequired}`);
        }

        return credits;
      },
      10, // max retries (doubled from 5 to 10)
      2000, // 2 second delay
      `Credit verification for ${accountUrl}`
    );

    const hasEnoughCredits = rawCredits >= minimumRequired;

    res.json({
      success: true,
      verified: hasEnoughCredits,
      account: accountUrl,
      creditsFound: rawCredits,
      minimumRequired: minimumRequired,
      message: hasEnoughCredits
        ? `Account has sufficient credits (${rawCredits} >= ${minimumRequired})`
        : `Account has insufficient credits (${rawCredits} < ${minimumRequired})`
    });

  } catch (error) {
    console.error('❌ Failed to verify credit balance after retries:', error);
    res.status(404).json({
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Account not found after waiting for network propagation'
    });
  }
});

// Get ACME token balance (from LTA - Lite Token Account)
app.get('/api/v1/tokens/balance', async (req, res) => {
  try {
    const ltaUrl = process.env.ACCUM_LTA;
    if (!ltaUrl) {
      return res.status(500).json({
        success: false,
        error: 'LTA URL not configured'
      });
    }

    console.log(`🪙 Getting ACME token balance: ${ltaUrl}`);

    const balance = await accumulateService.getBalance(ltaUrl);

    const rawTokens = parseInt(balance.balance);
    const tokensFormatted = (rawTokens / 100000000).toFixed(8); // ACME tokens have precision 8

    res.json({
      success: true,
      account: ltaUrl,
      type: 'tokens',
      balance: balance.balance,
      tokensRemaining: rawTokens,
      tokensFormatted: tokensFormatted,
      symbol: 'ACME',
      accountType: balance.accountType
    });

  } catch (error) {
    console.error('❌ Failed to get token balance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Legacy endpoint for backward compatibility (returns credits)
app.get('/api/v1/lta/balance', async (req, res) => {
  try {
    const lidUrl = process.env.ACCUM_LID;
    if (!lidUrl) {
      return res.status(500).json({
        success: false,
        error: 'LID URL not configured'
      });
    }

    console.log(`💰 Getting credit balance (legacy endpoint): ${lidUrl}`);

    const balance = await accumulateService.getBalance(lidUrl);

    const rawCredits = parseInt(balance.balance);
    const creditsFormatted = (rawCredits / 100).toFixed(2); // Credits have precision 2

    res.json({
      success: true,
      lta: lidUrl,
      balance: balance.balance,
      creditsRemaining: rawCredits,
      creditsFormatted: creditsFormatted,
      accountType: balance.accountType
    });

  } catch (error) {
    console.error('❌ Failed to get LTA balance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get keypage version endpoint
app.get('/api/v1/keypage/:url/version', async (req, res) => {
  try {
    let { url } = req.params;

    // Handle URL encoding issues
    url = decodeURIComponent(url);

    console.log(`📄 Getting keypage version for: ${url}`);

    const version = await accumulateService.getKeyPageVersion(url);

    res.json({
      success: true,
      keyPageUrl: url,
      version
    });

  } catch (error) {
    console.error('❌ Failed to get keypage version:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update keypage endpoint (real implementation)
app.post('/api/v1/keypage/update', async (req, res) => {
  try {
    const { keyPageUrl, operations, signerKeypageUrl } = req.body;

    if (!keyPageUrl) {
      return res.status(400).json({
        success: false,
        error: 'KeyPage URL is required'
      });
    }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Operations array is required and must contain at least one operation'
      });
    }

    // Validate each operation
    const validOperationTypes = ['add', 'remove', 'update', 'setThreshold', 'updateAllowed', 'setRejectThreshold', 'setResponseThreshold'];
    for (const operation of operations) {
      if (!operation.type || !validOperationTypes.includes(operation.type)) {
        return res.status(400).json({
          success: false,
          error: `Each operation must have a valid type: ${validOperationTypes.join(', ')}`
        });
      }

      // Validate operation-specific requirements
      if (operation.type === 'add' || operation.type === 'remove') {
        if (!operation.keyHash && !operation.delegate) {
          return res.status(400).json({
            success: false,
            error: `${operation.type} operation requires either keyHash or delegate`
          });
        }
      } else if (operation.type === 'update') {
        if (!operation.oldKeyHash && !operation.newKeyHash && !operation.newDelegate) {
          return res.status(400).json({
            success: false,
            error: 'Update operation requires oldKeyHash and either newKeyHash or newDelegate'
          });
        }
      } else if (['setThreshold', 'setRejectThreshold', 'setResponseThreshold'].includes(operation.type)) {
        if (operation.threshold === undefined || operation.threshold < 1) {
          return res.status(400).json({
            success: false,
            error: `${operation.type} operation requires a valid threshold value >= 1`
          });
        }
      } else if (operation.type === 'updateAllowed') {
        if (!operation.allow && !operation.deny) {
          return res.status(400).json({
            success: false,
            error: 'updateAllowed operation requires either allow or deny array'
          });
        }
      }
    }

    console.log(`🔑 Updating keypage: ${keyPageUrl}`);
    console.log(`📝 Operations: ${operations.map(op => op.type).join(', ')}`);

    const result = await accumulateService.updateKeyPage(keyPageUrl, operations, signerKeypageUrl);

    res.json(result);

  } catch (error) {
    console.error('❌ Failed to update keypage:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// TWO-PHASE SIGNING FOR KEYPAGE UPDATES (Key Vault integration)
// =============================================================================

/**
 * Prepare a KeyPage update transaction for Key Vault signing.
 * Phase 1: Returns the hash that needs to be signed by the Key Vault.
 */
app.post('/api/v1/keypage/update/prepare', async (req, res) => {
  try {
    const { keyPageUrl, operations, publicKey, signerKeypageUrl } = req.body;

    if (!keyPageUrl) {
      return res.status(400).json({
        success: false,
        error: 'KeyPage URL is required'
      });
    }

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required for Key Vault signing'
      });
    }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Operations array is required and must contain at least one operation'
      });
    }

    // Validate each operation
    const validOperationTypes = ['add', 'remove', 'update', 'setThreshold', 'updateAllowed', 'setRejectThreshold', 'setResponseThreshold'];
    for (const operation of operations) {
      if (!operation.type || !validOperationTypes.includes(operation.type)) {
        return res.status(400).json({
          success: false,
          error: `Each operation must have a valid type: ${validOperationTypes.join(', ')}`
        });
      }
    }

    console.log(`🔐 Preparing KeyPage update for Key Vault signing: ${keyPageUrl}`);
    console.log(`📝 Operations: ${operations.map((op: any) => op.type).join(', ')}`);

    const result = await accumulateService.prepareKeyPageUpdate(
      keyPageUrl,
      operations,
      publicKey,
      signerKeypageUrl
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      request_id: result.requestId,
      transaction_hash: result.transactionHash,
      hash_to_sign: result.hashToSign,
      signer_key_page_url: result.signerKeyPageUrl,
      key_page_version: result.keyPageVersion,
      key_page_url: result.keyPageUrl,
      operations: result.operations
    });

  } catch (error) {
    console.error('❌ Failed to prepare KeyPage update:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Submit a prepared KeyPage update with a signature from Key Vault.
 * Phase 2: Submits the transaction with the external signature.
 */
app.post('/api/v1/keypage/update/submit-signed', async (req, res) => {
  try {
    const { requestId, signature, publicKey } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Signature is required'
      });
    }

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required'
      });
    }

    console.log(`📤 Submitting signed KeyPage update: ${requestId}`);

    const result = await accumulateService.submitKeyPageWithExternalSignature(
      requestId,
      signature,
      publicKey
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      tx_id: result.txId,
      tx_hash: result.txHash,
      key_page_url: result.keyPageUrl,
      operations: result.operations
    });

  } catch (error) {
    console.error('❌ Failed to submit signed KeyPage update:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark old endpoint as DEPRECATED (kept for backward compatibility)
// Clients should migrate to /api/v1/keypage/update/prepare + /api/v1/keypage/update/submit-signed

// Get ADI governance structure
app.get('/api/v1/adi/:url/governance', async (req, res) => {
  try {
    let { url } = req.params;
    url = decodeURIComponent(url);

    // Ensure proper URL format
    if (!url.startsWith('acc://')) {
      url = `acc://${url}`;
    }

    console.log('🏛️ Getting ADI governance structure:', url);

    const result = await accumulateService.getAdiGovernanceStructure(url);

    if (result.success) {
      res.json({
        success: true,
        adiUrl: result.adiUrl,
        governanceStructure: {
          totalAuthorities: result.totalAuthorities,
          totalSigners: result.totalSigners,
          keyBooks: result.keyBooks
        }
      });
    } else {
      // Return successful response with empty structure instead of 404
      // This allows the frontend to handle "no governance found" gracefully
      res.json({
        success: true,
        adiUrl: url,
        governanceStructure: {
          totalAuthorities: 0,
          totalSigners: 0,
          keyBooks: []
        },
        message: result.error || 'No governance structure found'
      });
    }
  } catch (error) {
    console.error('❌ Error getting ADI governance structure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ADI governance structure'
    });
  }
});

// In-memory storage for ADIs (in production, use a proper database)
interface StoredAdi {
  adiUrl: string;
  adiName: string;
  bookUrl: string;
  keyPageUrl: string;
  publicKeyHash: string;
  publicKey: string;
  privateKey: string;
  creditBalance: number;
  createdAt: string;
  transactionHash: string;
}

// ADI storage is now handled by AdiStorageService with persistent file storage

// Store ADI data endpoint (for authority-editor to save ADI data)
app.post('/api/v1/adis', async (req, res) => {
  try {
    const { adiUrl, adiName, bookUrl, keyPageUrl, publicKeyHash, publicKey, privateKey, creditBalance, transactionHash } = req.body;

    // Validate required fields
    if (!adiUrl || !adiName || !bookUrl || !keyPageUrl || !publicKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: adiUrl, adiName, bookUrl, keyPageUrl, publicKeyHash'
      });
    }

    const storedAdi: StoredAdi = {
      adiUrl,
      adiName,
      bookUrl,
      keyPageUrl,
      publicKeyHash,
      publicKey: publicKey || '',
      privateKey: privateKey || '',
      creditBalance: creditBalance || 0,
      createdAt: new Date().toISOString(),
      transactionHash: transactionHash || ''
    };

    // Store the ADI data using persistent storage
    const success = adiStorageService.saveAdi(storedAdi);
    if (!success) {
      throw new Error('Failed to save ADI to persistent storage');
    }

    console.log('💾 Stored ADI data:', adiUrl);

    res.json({
      success: true,
      message: 'ADI data stored successfully',
      adiUrl
    });

  } catch (error) {
    console.error('❌ Failed to store ADI data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all stored ADIs endpoint (for wallet to fetch ADI list)
app.get('/api/v1/adis', async (req, res) => {
  try {
    const adis = adiStorageService.getAllAdis().map(adi => {
      // Don't expose private keys in the list view for security
      const { privateKey, ...safeAdi } = adi;
      return safeAdi;
    });

    console.log(`📋 Retrieved ${adis.length} stored ADIs`);

    res.json({
      success: true,
      adis
    });

  } catch (error) {
    console.error('❌ Failed to retrieve ADIs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific ADI with full details endpoint
app.get('/api/v1/adis/:url', async (req, res) => {
  try {
    let { url } = req.params;
    url = decodeURIComponent(url);

    // Ensure proper URL format
    if (!url.startsWith('acc://')) {
      url = `acc://${url}`;
    }

    let adi = await adiStorageService.getAdiWithAuthorities(url);

    // If not in storage, try to fetch from Accumulate network and store locally
    if (!adi) {
      console.log(`📡 ADI not in storage, attempting to fetch from Accumulate: ${url}`);

      try {
        // Try to get the ADI from Accumulate network
        const accResult = await accumulateService.getAccount(url);
        if (accResult && accResult.account && (accResult.account.type === 1 || accResult.account.type === 2)) { // ADI type (1 or 2)
          console.log(`✅ Found ADI on Accumulate network: ${url}`);

          // Store the ADI locally for future use with proper credentials for known ADI
          let privateKey = '';
          let publicKey = '';
          let publicKeyHash = '';

          // Auto-populate credentials from environment variables based on ADI URL patterns
          const adiCredentials = getAdiCredentialsFromEnv(url);
          if (adiCredentials) {
            privateKey = adiCredentials.privateKey;
            publicKey = adiCredentials.publicKey;
            publicKeyHash = adiCredentials.publicKeyHash;
            console.log(`🔑 Found credentials for ADI: ${url}`);
          } else {
            console.log(`⚠️ No credentials found for ADI: ${url}, storing without private key`);
          }

          const storedAdi = {
            adiUrl: url,
            adiName: url.replace('acc://', '').replace('.acme', ''),
            bookUrl: `${url}/book`,
            keyPageUrl: `${url}/book/1`, // Default key page
            publicKeyHash: publicKeyHash,
            publicKey: publicKey,
            privateKey: privateKey,
            creditBalance: 0,
            createdAt: new Date().toISOString(),
            transactionHash: '' // Not available from network query
          };

          adiStorageService.saveAdi(storedAdi);
          adi = await adiStorageService.getAdiWithAuthorities(url);

          console.log(`💾 Stored ADI locally for future requests: ${url}`);
        }
      } catch (networkError) {
        console.log(`⚠️ Could not fetch ADI from Accumulate network: ${networkError}`);
      }

      // If still not found after network fetch attempt
      if (!adi) {
        return res.status(404).json({
          success: false,
          error: 'ADI not found in storage or Accumulate network'
        });
      }
    }

    // Get governance structure for this ADI
    let governanceStructure = null;
    try {
      const governanceResult = await accumulateService.getAdiGovernanceStructure(url);
      if (governanceResult.success) {
        governanceStructure = {
          totalAuthorities: governanceResult.totalAuthorities,
          totalSigners: governanceResult.totalSigners,
          keyBooks: governanceResult.keyBooks
        };
      }
    } catch (error) {
      console.log('⚠️ Could not fetch governance structure for ADI:', error);
    }

    console.log(`📋 Retrieved ADI details: ${url}`);

    res.json({
      success: true,
      adi: {
        ...adi,
        authorities: governanceStructure?.keyBooks?.map((keyBook: any) => ({
          url: keyBook.keyBookUrl,
          type: 2, // KeyBook type
          threshold: 1,
          priority: 1,
          signers: keyBook.signers || []
        })) || []
      }
    });

  } catch (error) {
    console.error('❌ Failed to retrieve ADI details:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Import ADIs from browser storage endpoint
app.post('/api/v1/adis/import', async (req, res) => {
  try {
    const { adis } = req.body;

    if (!Array.isArray(adis)) {
      return res.status(400).json({
        success: false,
        error: 'ADIs must be an array'
      });
    }

    const success = adiStorageService.importAdisFromBrowser(adis);

    if (!success) {
      throw new Error('Failed to import ADIs to persistent storage');
    }

    console.log(`📥 Imported ${adis.length} ADIs from browser storage`);

    res.json({
      success: true,
      message: `Successfully imported ${adis.length} ADIs`,
      count: adis.length
    });

  } catch (error) {
    console.error('❌ Failed to import ADIs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed'
    });
  }
});

// Delete ADI from storage endpoint
app.delete('/api/v1/adis/:url', async (req, res) => {
  try {
    let { url } = req.params;
    url = decodeURIComponent(url);

    // Ensure proper URL format
    if (!url.startsWith('acc://')) {
      url = `acc://${url}`;
    }

    const deleted = adiStorageService.deleteAdi(url);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'ADI not found in storage'
      });
    }

    console.log(`🗑️ Deleted ADI from storage: ${url}`);

    res.json({
      success: true,
      message: 'ADI deleted successfully',
      adiUrl: url
    });

  } catch (error) {
    console.error('❌ Failed to delete ADI:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get ADI directory endpoint
app.get('/api/v1/adi/directory', async (req, res) => {
  try {
    const { adiUrl } = req.query;

    if (!adiUrl) {
      return res.status(400).json({
        success: false,
        error: 'ADI URL is required'
      });
    }

    console.log(`📁 Getting directory for ADI: ${adiUrl}`);

    const result = await accumulateService.getAdiDirectory(adiUrl as string);

    res.json({
      success: true,
      directory: result
    });

  } catch (error) {
    console.error('❌ Failed to get ADI directory:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get account details endpoint
app.get('/api/v1/account', async (req, res) => {
  try {
    const { accountUrl } = req.query;

    if (!accountUrl) {
      return res.status(400).json({
        success: false,
        error: 'Account URL is required'
      });
    }

    console.log(`📄 Getting account details for: ${accountUrl}`);

    const result = await accumulateService.getAccountDetails(accountUrl as string);

    res.json({
      success: true,
      account: result
    });

  } catch (error) {
    console.error('❌ Failed to get account details:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate KeyBook endpoint
app.post('/api/v1/keybook/validate', async (req, res) => {
  try {
    const { keyBookUrl } = req.body;

    if (!keyBookUrl) {
      return res.status(400).json({
        success: false,
        error: 'KeyBook URL is required'
      });
    }

    console.log(`🔍 Validating KeyBook: ${keyBookUrl}`);

    const result = await accumulateService.validateKeyBook(keyBookUrl);

    res.json({
      success: true,
      validation: result
    });

  } catch (error) {
    console.error('❌ Failed to validate KeyBook:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    });
  }
});

// Discover ADI KeyBooks endpoint
app.get('/api/v1/adi/keybooks', async (req, res) => {
  try {
    const { adiUrl } = req.query;

    if (!adiUrl) {
      return res.status(400).json({
        success: false,
        error: 'ADI URL is required'
      });
    }

    console.log(`🔍 Discovering KeyBooks for ADI: ${adiUrl}`);

    const result = await accumulateService.discoverADIKeyBooks(adiUrl as string);

    res.json({
      success: true,
      keybooks: result
    });

  } catch (error) {
    console.error('❌ Failed to discover ADI KeyBooks:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// ONBOARDING ENDPOINTS - User ADI creation with sponsor funding
// =============================================================================

/**
 * GET /api/v1/onboarding/sponsor-status
 * Check sponsor health and available funds for onboarding
 */
app.get('/api/v1/onboarding/sponsor-status', async (req, res) => {
  try {
    console.log('📊 Checking onboarding sponsor status...');

    const status = await accumulateService.getSponsorStatus();

    res.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('❌ Failed to get sponsor status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/onboarding/create-adi
 * Create ADI + credits + data account for new user
 * Uses sponsor's key as initial authority
 */
app.post('/api/v1/onboarding/create-adi', async (req, res) => {
  try {
    const { adiName, userPublicKeyHash } = req.body;

    if (!adiName) {
      return res.status(400).json({
        success: false,
        error: 'ADI name is required'
      });
    }

    if (!userPublicKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'User public key hash is required'
      });
    }

    // Validate public key hash format (64-char hex)
    if (!/^[0-9a-fA-F]{64}$/.test(userPublicKeyHash)) {
      return res.status(400).json({
        success: false,
        error: 'User public key hash must be a 64-character hexadecimal string'
      });
    }

    console.log(`🚀 Starting onboarding ADI creation for: ${adiName}`);
    console.log(`🔑 User public key hash: ${userPublicKeyHash.substring(0, 16)}...`);

    // Step 1: Check sponsor status
    const sponsorStatus = await accumulateService.getSponsorStatus();
    if (!sponsorStatus.onboardingEnabled) {
      return res.status(503).json({
        success: false,
        error: 'INSUFFICIENT_SPONSOR_FUNDS',
        message: 'Onboarding is temporarily unavailable. Sponsor account needs to be refunded.',
        sponsorStatus
      });
    }

    // Step 2: Check if ADI already exists
    const strippedName = adiName.replace(/^acc:\/\//, '');
    const normalizedName = strippedName.endsWith('.acme') ? strippedName : `${strippedName}.acme`;
    const adiUrl = `acc://${normalizedName}`;

    try {
      const existingAdi = await accumulateService.getAccount(adiUrl);
      if (existingAdi && existingAdi.account) {
        return res.status(409).json({
          success: false,
          error: 'ADI_EXISTS',
          message: `ADI name '${adiName}' is already taken. Please choose a different name.`
        });
      }
    } catch (error) {
      // ADI doesn't exist - this is expected, continue
      console.log(`✅ ADI name ${adiName} is available`);
    }

    // Step 3: Create ADI with sponsor's key
    console.log('🆔 Step 1/4: Creating ADI with sponsor key...');
    const adiResult = await accumulateService.createIdentityForOnboarding(adiName);

    if (!adiResult.success) {
      throw new Error(`ADI creation failed: ${adiResult.message || 'Unknown error'}`);
    }

    console.log(`✅ ADI created: ${adiResult.adiUrl}`);

    // Wait for ADI to exist on network before proceeding
    await waitForAccountToExist(adiResult.adiUrl, 30, 1000);

    // Step 4: Add credits to the keypage
    const creditsAmount = parseInt(process.env.ONBOARDING_CREDITS_AMOUNT || '10000');
    const acmeForCredits = creditsAmount / 100; // Credits = ACME * 100

    console.log(`💳 Step 2/4: Adding ${creditsAmount} credits (${acmeForCredits} ACME) to keypage...`);

    const creditsResult = await retryWithDelay(
      async () => {
        return await accumulateService.addCredits(adiResult.keyPageUrl, acmeForCredits);
      },
      3,
      2000,
      `Adding credits to ${adiResult.keyPageUrl}`
    );

    console.log(`✅ Credits added: ${creditsResult.txId}`);

    // Wait for credits to appear on keypage before creating data account
    // Credits are stored as creditBalance * 100 on the network
    await waitForKeyPageCredits(adiResult.keyPageUrl, creditsAmount * 100, 30, 1000);

    // Additional delay to ensure network consistency after credit addition
    console.log('⏳ Waiting for network propagation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Create data account
    console.log(`📄 Step 3/4: Creating data account...`);
    console.log(`🔑 Using sponsor key hash: ${adiResult.sponsorKeyHash}`);

    const dataAccountResult = await retryWithDelay(
      async () => {
        return await accumulateService.createDataAccount(normalizedName, 'data');
      },
      3,
      2000,
      `Creating data account for ${adiResult.adiUrl}`
    );

    const dataAccountUrl = `${adiResult.adiUrl}/data`;
    console.log(`✅ Data account created: ${dataAccountUrl}`);

    // Get the keypage version for the key swap step
    console.log(`📋 Step 4/4: Getting keypage version for key swap...`);

    const keyPageVersion = await retryWithDelay(
      async () => {
        return await accumulateService.getKeyPageVersion(adiResult.keyPageUrl);
      },
      5,
      2000,
      `Getting keypage version for ${adiResult.keyPageUrl}`
    );

    console.log(`✅ Keypage version: ${keyPageVersion}`);

    // Return all the details needed for key swap
    res.json({
      success: true,
      adiUrl: adiResult.adiUrl,
      keyBookUrl: adiResult.keyBookUrl,
      keyPageUrl: adiResult.keyPageUrl,
      dataAccountUrl: dataAccountUrl,
      sponsorKeyHash: adiResult.sponsorKeyHash,
      userKeyHash: userPublicKeyHash,
      creditsAdded: creditsAmount,
      keyPageVersion: keyPageVersion,
      message: 'ADI created successfully. Ready for key swap to transfer ownership.'
    });

  } catch (error) {
    console.error('❌ Failed to create onboarding ADI:', error);

    // Determine error type for better client handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorCode = 'ONBOARDING_FAILED';

    if (errorMessage.includes('already exists') || errorMessage.includes('already taken')) {
      errorCode = 'ADI_EXISTS';
    } else if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
      errorCode = 'INSUFFICIENT_SPONSOR_FUNDS';
    }

    res.status(500).json({
      success: false,
      error: errorCode,
      message: errorMessage
    });
  }
});

/**
 * POST /api/v1/onboarding/complete-key-swap
 * Atomic key swap: replace sponsor's key with user's key on keypage
 * This transfers ownership of the ADI to the user
 */
app.post('/api/v1/onboarding/complete-key-swap', async (req, res) => {
  try {
    const { keyPageUrl, sponsorKeyHash, userKeyHash, keyPageVersion } = req.body;

    if (!keyPageUrl) {
      return res.status(400).json({
        success: false,
        error: 'KeyPage URL is required'
      });
    }

    if (!sponsorKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'Sponsor key hash is required'
      });
    }

    if (!userKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'User key hash is required'
      });
    }

    // Validate key hash formats
    if (!/^[0-9a-fA-F]{64}$/.test(sponsorKeyHash)) {
      return res.status(400).json({
        success: false,
        error: 'Sponsor key hash must be a 64-character hexadecimal string'
      });
    }

    if (!/^[0-9a-fA-F]{64}$/.test(userKeyHash)) {
      return res.status(400).json({
        success: false,
        error: 'User key hash must be a 64-character hexadecimal string'
      });
    }

    console.log(`🔄 Performing key swap on ${keyPageUrl}`);
    console.log(`🔑 Sponsor key: ${sponsorKeyHash.substring(0, 16)}...`);
    console.log(`🔑 User key: ${userKeyHash.substring(0, 16)}...`);

    // Get fresh keypage version if not provided or to verify
    let actualVersion = keyPageVersion;
    if (!actualVersion) {
      actualVersion = await accumulateService.getKeyPageVersion(keyPageUrl);
      console.log(`📋 Using fresh keypage version: ${actualVersion}`);
    }

    // Perform the atomic key swap
    const swapResult = await accumulateService.performKeySwap(
      keyPageUrl,
      sponsorKeyHash,
      userKeyHash
    );

    if (!swapResult.success) {
      throw new Error(swapResult.message || 'Key swap failed');
    }

    console.log(`✅ Key swap completed successfully: ${swapResult.txId}`);

    res.json({
      success: true,
      txId: swapResult.txId,
      keyPageUrl: keyPageUrl,
      newOwnerKeyHash: userKeyHash,
      message: 'Ownership transferred successfully. The ADI is now controlled by the user\'s key.'
    });

  } catch (error) {
    console.error('❌ Failed to complete key swap:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorCode = 'KEY_SWAP_FAILED';

    if (errorMessage.includes('version') || errorMessage.includes('nonce')) {
      errorCode = 'KEY_PAGE_VERSION_MISMATCH';
    } else if (errorMessage.includes('not found')) {
      errorCode = 'KEYPAGE_NOT_FOUND';
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      errorCode = 'NETWORK_ERROR';
    }

    res.status(500).json({
      success: false,
      error: errorCode,
      message: errorMessage
    });
  }
});

// =============================================================================
// CHAIN VERIFICATION ENDPOINTS - EVM Address Ownership Verification
// =============================================================================

/**
 * POST /api/v1/chain/verify-address
 * Verify EVM address ownership via digital signature (EIP-191)
 *
 * This endpoint verifies that a user controls an EVM address by checking
 * a signed challenge message. The challenge must contain the address, ADI URL,
 * chain ID, and timestamp.
 */
app.post('/api/v1/chain/verify-address', async (req, res) => {
  try {
    const { address, chainId, adiUrl, challenge, signature, timestamp } = req.body;

    // Validate required fields
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    if (!chainId) {
      return res.status(400).json({
        success: false,
        error: 'Chain ID is required'
      });
    }

    if (!adiUrl) {
      return res.status(400).json({
        success: false,
        error: 'ADI URL is required'
      });
    }

    if (!challenge) {
      return res.status(400).json({
        success: false,
        error: 'Challenge message is required'
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Signature is required'
      });
    }

    if (!timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Timestamp is required'
      });
    }

    // Validate timestamp is not too old (5 minute window)
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 5 * 60; // 5 minutes
    if (now - timestamp > maxAge) {
      return res.status(400).json({
        success: false,
        error: 'Challenge has expired. Please generate a new challenge.',
        verified: false
      });
    }

    // Validate address format (EVM address)
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid EVM address format. Must be 0x followed by 40 hex characters.'
      });
    }

    // Validate signature format (65-byte hex with 0x prefix)
    if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature format. Must be 0x followed by 130 hex characters (65 bytes).'
      });
    }

    // Validate challenge format contains expected fields
    const expectedChallengePattern = new RegExp(
      `I am linking address ${address.toLowerCase()} to ADI ${adiUrl} on chain ${chainId} at ${timestamp}`,
      'i'
    );
    if (!expectedChallengePattern.test(challenge.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Challenge message format is invalid or does not match provided parameters.'
      });
    }

    console.log(`🔐 Verifying address ownership:`);
    console.log(`   Address: ${address}`);
    console.log(`   Chain: ${chainId}`);
    console.log(`   ADI: ${adiUrl}`);
    console.log(`   Timestamp: ${timestamp}`);

    // Import ethers for signature verification
    const { ethers } = await import('ethers');

    // Recover the address from the signature using EIP-191 personal sign
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(challenge, signature);
    } catch (sigError) {
      console.error('❌ Signature recovery failed:', sigError);
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Failed to recover address from signature. Invalid signature format.',
        address: address,
        recoveredAddress: null
      });
    }

    // Compare recovered address with claimed address (case-insensitive)
    const verified = recoveredAddress.toLowerCase() === address.toLowerCase();

    if (verified) {
      console.log(`✅ Address verified successfully: ${address}`);
    } else {
      console.log(`❌ Address verification failed:`);
      console.log(`   Claimed: ${address}`);
      console.log(`   Recovered: ${recoveredAddress}`);
    }

    res.json({
      success: true,
      verified,
      address: address,
      recoveredAddress: recoveredAddress,
      chainId: chainId,
      adiUrl: adiUrl,
      message: verified
        ? 'Address ownership verified successfully'
        : `Signature verification failed. Recovered address (${recoveredAddress}) does not match claimed address (${address})`
    });

  } catch (error) {
    console.error('❌ Failed to verify address:', error);
    res.status(500).json({
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// MULTI-CHAIN SPONSORED ACCOUNT DEPLOYMENT
// =============================================================================
// Chain handlers are registered in ./chains/index.ts (EVM + non-EVM)
// Supported: Sepolia, Arbitrum, Base, BSC, Optimism, Polygon, Moonbeam,
//            Solana, Aptos, Sui, NEAR, TON, TRON

/**
 * POST /api/v1/chain/deploy-account
 *
 * Deploys a Certen Abstract Account for an ADI on any supported chain.
 * The abstract account address is deterministically derived from the ADI URL.
 * Gas fees are sponsored by Certen - users don't need tokens or keys on target chains.
 *
 * Request body:
 * - adiUrl: The Accumulate ADI URL (acc://...)
 * - chainId: The target blockchain (e.g., "sepolia", "solana-devnet", "aptos-testnet")
 */
app.post('/api/v1/chain/deploy-account', async (req, res) => {
  console.log('\n📦 POST /api/v1/chain/deploy-account');

  try {
    const { adiUrl, chainId } = req.body;

    if (!adiUrl || !chainId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: adiUrl, chainId'
      });
    }

    if (!adiUrl.startsWith('acc://')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ADI URL format. Must start with acc://'
      });
    }

    const handler = getChainHandler(chainId);
    if (!handler) {
      return res.status(400).json({
        success: false,
        error: `Unsupported chain: ${chainId}. Supported chains: ${getRegisteredChainIds().join(', ')}`
      });
    }

    if (!handler.isSponsorConfigured()) {
      return res.status(503).json({
        success: false,
        error: `Sponsored deployment is not configured for ${handler.chainName}`
      });
    }

    console.log(`  Chain: ${handler.chainName} (${chainId})`);
    console.log(`  ADI: ${adiUrl}`);

    const result = await handler.deployAccount(adiUrl);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Failed to deploy account:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/chain/account-address
 *
 * Returns the predicted abstract account address for an ADI on any supported chain.
 * This allows the UI to show the user their address before deployment.
 *
 * Query params:
 * - adiUrl: The Accumulate ADI URL (acc://...)
 * - chainId: The target blockchain (e.g., "sepolia", "solana-devnet")
 */
app.get('/api/v1/chain/account-address', async (req, res) => {
  console.log('\n🔍 GET /api/v1/chain/account-address');

  try {
    const { adiUrl, chainId } = req.query;

    if (!adiUrl || !chainId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query params: adiUrl, chainId'
      });
    }

    const adiUrlStr = adiUrl as string;
    const chainIdStr = chainId as string;

    if (!adiUrlStr.startsWith('acc://')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ADI URL format. Must start with acc://'
      });
    }

    const handler = getChainHandler(chainIdStr);
    if (!handler) {
      return res.status(400).json({
        success: false,
        error: `Unsupported chain: ${chainIdStr}. Supported chains: ${getRegisteredChainIds().join(', ')}`
      });
    }

    const result = await handler.getAccountAddress(adiUrlStr);

    console.log(`  ADI: ${adiUrlStr}`);
    console.log(`  Chain: ${handler.chainName}`);
    console.log(`  Address: ${result.accountAddress}`);
    console.log(`  Deployed: ${result.isDeployed}`);

    res.json({
      success: true,
      adiUrl: adiUrlStr,
      chainId: chainIdStr,
      chainName: handler.chainName,
      ...result
    });

  } catch (error) {
    console.error('❌ Failed to get account address:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/chain/wallet-balance
 *
 * Returns the native token balance for an address on any supported chain.
 * For Certen Abstract Accounts, returns the contract's internal balance.
 *
 * Query params:
 * - address: The on-chain address or object ID
 * - chainId: The target blockchain (e.g., "sui-testnet", "aptos-testnet")
 */
app.get('/api/v1/chain/wallet-balance', async (req, res) => {
  console.log('\n💰 GET /api/v1/chain/wallet-balance');

  try {
    const { address, chainId } = req.query;

    if (!address || !chainId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query params: address, chainId'
      });
    }

    const addressStr = address as string;
    const chainIdStr = chainId as string;

    const handler = getChainHandler(chainIdStr);
    if (!handler) {
      return res.status(400).json({
        success: false,
        error: `Unsupported chain: ${chainIdStr}`
      });
    }

    const result = await handler.getAddressBalance(addressStr);

    console.log(`  Chain: ${handler.chainName}`);
    console.log(`  Address: ${addressStr}`);
    console.log(`  Balance: ${result.balance} ${result.symbol}`);

    res.json({
      success: true,
      chainId: chainIdStr,
      ...result
    });

  } catch (error) {
    console.error('❌ Failed to get wallet balance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/chain/sponsor-status
 *
 * Returns the status of sponsor wallets across all supported chains.
 * Useful for checking if sponsored deployments are available.
 */
app.get('/api/v1/chain/sponsor-status', async (req, res) => {
  console.log('\n📊 GET /api/v1/chain/sponsor-status');

  try {
    const allHandlers = getAllChainHandlers();
    const chainStatuses: Record<string, any> = {};

    // Query all handlers in parallel
    const statusPromises = allHandlers.map(async (handler) => {
      const status = await handler.getSponsorStatus();
      // Register under the first chain ID (canonical name)
      chainStatuses[handler.chainIds[0]] = status;
    });

    await Promise.allSettled(statusPromises);

    const anyEnabled = allHandlers.some(h => h.isSponsorConfigured());

    res.json({
      success: true,
      enabled: anyEnabled,
      chains: chainStatuses,
      supportedChains: getRegisteredChainIds()
    });

  } catch (error) {
    console.error('❌ Failed to get sponsor status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/chain/validator-balances
 *
 * Returns balances for all Certen validator nodes across all non-EVM chains.
 * Queries each chain's RPC for native token balances.
 *
 * Optional query params:
 *   ?chain=solana,sui   - filter to specific chains (comma-separated)
 *   ?validator=1,2,3    - filter to specific validators (comma-separated)
 */
app.get('/api/v1/chain/validator-balances', async (req, res) => {
  console.log('\n📊 GET /api/v1/chain/validator-balances');

  try {
    const chainFilter = req.query.chain
      ? String(req.query.chain).split(',').map(c => c.trim().toLowerCase())
      : null;
    const validatorFilter = req.query.validator
      ? String(req.query.validator).split(',').map(v => {
          const num = v.trim();
          return num.startsWith('validator-') ? num : `validator-${num}`;
        })
      : null;

    const validators = Object.entries(VALIDATOR_ADDRESSES)
      .filter(([vid]) => !validatorFilter || validatorFilter.includes(vid));

    const chains = NON_EVM_CHAINS.filter(c => !chainFilter || chainFilter.includes(c));

    // Build balance queries - all in parallel
    const results: Record<string, Record<string, any>> = {};
    const queries: Promise<void>[] = [];

    for (const [vid, addrs] of validators) {
      results[vid] = {};
      for (const chain of chains) {
        const handlerId = CHAIN_HANDLER_IDS[chain];
        const handler = getChainHandler(handlerId);
        if (!handler) continue;

        const address = addrs[chain as keyof typeof addrs];
        if (!address) continue;

        queries.push(
          handler.getAddressBalance(address).then(bal => {
            results[vid][chain] = bal;
          }).catch(err => {
            results[vid][chain] = {
              address,
              balance: '0',
              symbol: chain.toUpperCase(),
              error: err.message,
            };
          })
        );
      }
    }

    await Promise.allSettled(queries);

    // Build summary
    const summary: Record<string, { total: number; symbol: string; funded: number; unfunded: number }> = {};
    for (const chain of chains) {
      const balances = Object.values(results).map(v => v[chain]).filter(Boolean);
      const symbol = balances[0]?.symbol || chain.toUpperCase();
      const funded = balances.filter(b => parseFloat(b.balance) > 0).length;
      summary[chain] = {
        total: balances.reduce((sum, b) => sum + parseFloat(b.balance || '0'), 0),
        symbol,
        funded,
        unfunded: balances.length - funded,
      };
    }

    res.json({
      success: true,
      validatorCount: validators.length,
      chains: chains,
      validators: results,
      summary,
    });

  } catch (error) {
    console.error('❌ Failed to get validator balances:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== Transaction Status Endpoints ====================

/**
 * GET /api/v1/intent/:txHash/status
 *
 * Get comprehensive status for a transaction intent by its Accumulate tx hash.
 * Queries Accumulate network for pending/delivered status.
 */
app.get('/api/v1/intent/:txHash/status', async (req, res) => {
  console.log('\n📊 GET /api/v1/intent/:txHash/status');

  try {
    const txHash = decodeURIComponent(req.params.txHash);
    console.log('  Transaction hash:', txHash);

    // Query Accumulate for transaction status using queryTransaction method
    const queryResult = await accumulateService.queryTransaction(txHash, true);

    let status = 'unknown';
    let statusNo = 0;
    let pendingSignatures = 0;
    let collectedSignatures = 0;
    let signers: string[] = [];

    if (queryResult && queryResult.success) {
      const txData = queryResult.transaction;
      const txStatus = queryResult.status;

      // Check status from response
      if (txStatus === 'delivered' || queryResult.statusNo === 201) {
        status = 'delivered';
        statusNo = 201;
      } else if (txStatus === 'pending' || queryResult.statusNo === 100) {
        status = 'pending';
        statusNo = 100;

        // Try to get pending signature info
        if (txData?.pending) {
          pendingSignatures = txData.pending.requiredSignatures || 0;
          collectedSignatures = txData.pending.signatures?.length || 0;
          signers = txData.pending.signatures?.map((s: any) => s.signer) || [];
        }
      } else if (queryResult.statusNo >= 400) {
        status = 'failed';
        statusNo = queryResult.statusNo;
      } else if (txData) {
        // Transaction found - assume delivered
        status = 'delivered';
        statusNo = 201;
      }
    }

    res.json({
      success: true,
      accumulate: {
        status,
        statusNo,
        pendingSignatures,
        collectedSignatures,
        signers,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get intent status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/intents/status/batch
 *
 * Batch query for multiple transaction statuses.
 * More efficient than individual queries when checking many transactions.
 */
app.post('/api/v1/intents/status/batch', async (req, res) => {
  console.log('\n📊 POST /api/v1/intents/status/batch');

  try {
    const { txHashes } = req.body;

    if (!txHashes || !Array.isArray(txHashes)) {
      return res.status(400).json({
        success: false,
        error: 'txHashes array is required',
      });
    }

    console.log('  Querying', txHashes.length, 'transactions');

    // Query each transaction using queryTransaction method
    const results = await Promise.all(
      txHashes.map(async (hash: string) => {
        try {
          const queryResult = await accumulateService.queryTransaction(hash, false);

          let status = 'unknown';
          let statusNo = 0;
          let pendingSignatures = 0;
          let collectedSignatures = 0;

          if (queryResult && queryResult.success) {
            const txData = queryResult.transaction;
            const txStatus = queryResult.status;

            if (txStatus === 'delivered' || queryResult.statusNo === 201) {
              status = 'delivered';
              statusNo = 201;
            } else if (txStatus === 'pending' || queryResult.statusNo === 100) {
              status = 'pending';
              statusNo = 100;
              if (txData?.pending) {
                pendingSignatures = txData.pending.requiredSignatures || 0;
                collectedSignatures = txData.pending.signatures?.length || 0;
              }
            } else if (queryResult.statusNo >= 400) {
              status = 'failed';
              statusNo = queryResult.statusNo;
            } else if (txData) {
              status = 'delivered';
              statusNo = 201;
            }
          }

          return {
            txHash: hash,
            status,
            statusNo,
            pendingSignatures,
            collectedSignatures,
          };
        } catch (err) {
          return {
            txHash: hash,
            error: err instanceof Error ? err.message : 'Query failed',
          };
        }
      })
    );

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed batch status query:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/adi/:url/pending
 *
 * Get pending transactions for an ADI's data account.
 * Returns transactions awaiting signatures on the pending chain.
 * Note: Full pending chain queries require additional Accumulate API support.
 */
app.get('/api/v1/adi/:url/pending', async (req, res) => {
  console.log('\n📊 GET /api/v1/adi/:url/pending');

  try {
    let adiUrl = decodeURIComponent(req.params.url);
    if (!adiUrl.startsWith('acc://')) {
      adiUrl = `acc://${adiUrl}`;
    }

    const dataAccountUrl = `${adiUrl}/data`;
    console.log('  Checking data account:', dataAccountUrl);

    // Query pending transactions on the data account
    const pendingResult = await accumulateService.getPendingTransactions(dataAccountUrl);

    res.json({
      success: true,
      adiUrl,
      dataAccountUrl,
      pending: pendingResult.pending || [],
      count: pendingResult.pending?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get pending transactions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/account/:url/pending
 *
 * Get pending transactions for any account (key page, token account, etc.).
 * Queries the pending chain to discover transactions awaiting signatures.
 */
app.get('/api/v1/account/:url/pending', async (req, res) => {
  console.log('\n📊 GET /api/v1/account/:url/pending');

  try {
    let accountUrl = decodeURIComponent(req.params.url);
    if (!accountUrl.startsWith('acc://')) {
      accountUrl = `acc://${accountUrl}`;
    }

    console.log('  Querying pending transactions for:', accountUrl);

    // Query pending transactions on the account
    const pendingResult = await accumulateService.getPendingTransactions(accountUrl);

    if (!pendingResult.success) {
      return res.status(400).json({
        success: false,
        error: pendingResult.error || 'Failed to query pending transactions',
      });
    }

    res.json({
      success: true,
      accountUrl,
      pending: pendingResult.pending || [],
      count: pendingResult.pending?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get pending transactions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== Pending Actions Endpoints ====================

/**
 * GET /api/v1/pending/:txHash/signing-data
 *
 * Get signing data for a pending transaction.
 * Computes the complete dataForSignature that KeyVault should sign directly.
 *
 * Query params:
 * - signerId: string (key page URL that will sign)
 * - publicKey: string (hex-encoded public key - required for sigMdHash)
 * - timestamp?: number (optional microseconds timestamp - if not provided, one is generated)
 *
 * Response:
 * - transactionHash: string (the full transaction hash)
 * - initiatorHash: string (body hash)
 * - dataForSignature: string (the complete hash to sign)
 * - signerVersion: number (key page version)
 * - timestamp: number (the timestamp used - must be passed to KeyVault)
 */
app.get('/api/v1/pending/:txHash/signing-data', async (req, res) => {
  console.log('\n🔐 GET /api/v1/pending/:txHash/signing-data');

  try {
    const txHash = decodeURIComponent(req.params.txHash);
    const signerId = req.query.signerId as string;
    const publicKey = req.query.publicKey as string;
    const vote = (req.query.vote as 'approve' | 'reject' | 'abstain') || 'approve';
    const timestamp = req.query.timestamp ? Number(req.query.timestamp) : undefined;

    console.log('  Transaction Hash:', txHash);
    console.log('  Signer ID:', signerId);
    console.log('  Public Key:', publicKey ? publicKey.substring(0, 16) + '...' : 'missing');
    console.log('  Vote:', vote);
    console.log('  Timestamp:', timestamp || 'will be generated');

    if (!signerId) {
      return res.status(400).json({
        success: false,
        error: 'signerId query parameter is required'
      });
    }

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'publicKey query parameter is required'
      });
    }

    const result = await accumulateService.getPendingTransactionSigningData({
      txHash,
      signerId,
      publicKey,
      vote,
      timestamp
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to get signing data'
      });
    }

    console.log('  ✅ Got signing data:', {
      transactionHash: result.transactionHash,
      initiatorHash: result.initiatorHash?.substring(0, 16) + '...',
      dataForSignature: result.dataForSignature?.substring(0, 16) + '...',
      signerVersion: result.signerVersion,
      timestamp: result.timestamp
    });

    res.json(result);

  } catch (error) {
    console.error('Error getting signing data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/pending/:txHash/vote
 *
 * Submit a vote (signature) on a pending transaction.
 * This adds a signature to an existing pending transaction.
 *
 * Request body:
 * - vote: 'approve' | 'reject' | 'abstain'
 * - signerId: string (key page URL)
 * - signature: string (hex-encoded signature)
 * - publicKey: string (hex-encoded public key)
 * - signerVersion?: number (optional key page version)
 * - timestamp?: number (microseconds timestamp used when signing - required for signature verification)
 */
app.post('/api/v1/pending/:txHash/vote', async (req, res) => {
  console.log('\n📝 POST /api/v1/pending/:txHash/vote');

  try {
    const txHash = decodeURIComponent(req.params.txHash);
    const { vote, signerId, signature, publicKey, signerVersion, timestamp } = req.body;

    console.log('  Transaction Hash:', txHash);
    console.log('  Vote:', vote);
    console.log('  Signer ID:', signerId);
    console.log('  Has Signature:', !!signature);
    console.log('  Has Public Key:', !!publicKey);
    console.log('  Timestamp:', timestamp || '(will be generated)');

    // Validate required fields
    if (!vote || !['approve', 'reject', 'abstain'].includes(vote)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote. Must be one of: approve, reject, abstain'
      });
    }

    if (!signerId) {
      return res.status(400).json({
        success: false,
        error: 'signerId (key page URL) is required'
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'signature is required (hex-encoded from Key Vault)'
      });
    }

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'publicKey is required (hex-encoded)'
      });
    }

    // Submit the signature to the pending transaction
    const result = await accumulateService.submitVoteOnPendingTransaction({
      txHash,
      vote,
      signerId,
      signature,
      publicKey,
      signerVersion: signerVersion || 1,
      timestamp: timestamp ? Number(timestamp) : undefined
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to submit vote'
      });
    }

    res.json({
      success: true,
      txHash,
      signatureTxHash: result.signatureTxHash,
      signatureCount: result.signatureCount,
      message: `Successfully submitted ${vote} vote on pending transaction`
    });

  } catch (error) {
    console.error('❌ Failed to submit vote on pending transaction:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/pending/:txHash/authority
 *
 * Get authority requirements for a pending transaction.
 * Returns the authorities, required signatures, and collected signatures.
 */
app.get('/api/v1/pending/:txHash/authority', async (req, res) => {
  console.log('\n📊 GET /api/v1/pending/:txHash/authority');

  try {
    const txHash = decodeURIComponent(req.params.txHash);
    console.log('  Transaction Hash:', txHash);

    // Query the transaction to get its principal
    const txResult = await accumulateService.getTransactionStatus(txHash);

    if (!txResult || !txResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    const principal = txResult.principal;
    console.log('  Principal:', principal);

    // Query the principal account to get its authorities
    const accountResult = await accumulateService.getAccount(principal);

    if (!accountResult || !accountResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Principal account not found'
      });
    }

    // Get authority URLs from the account
    const authorityUrls = accountResult.account?.authorities || [];
    const authorities: Array<{
      url: string;
      keyBookUrl: string;
      keyPageUrl: string;
      threshold: number;
      totalKeys: number;
      signatures: Array<{ publicKeyHash: string; signedAt: string; vote: string }>;
    }> = [];

    let totalRequired = 0;
    let totalCollected = 0;

    // Query each authority to get threshold and key information
    for (const authUrl of authorityUrls) {
      try {
        // Authority URL is typically a key book URL
        const keyBookUrl = typeof authUrl === 'string' ? authUrl : authUrl.url;
        const keyBookResult = await accumulateService.getAccount(keyBookUrl);

        if (keyBookResult && keyBookResult.success && keyBookResult.account) {
          // Get the first key page
          const keyPageUrl = keyBookResult.account.pages?.[0] || `${keyBookUrl}/1`;
          const keyPageResult = await accumulateService.getAccount(keyPageUrl);

          if (keyPageResult && keyPageResult.success && keyPageResult.account) {
            const threshold = keyPageResult.account.acceptThreshold || 1;
            const totalKeys = keyPageResult.account.entries?.length || 1;

            authorities.push({
              url: keyBookUrl,
              keyBookUrl,
              keyPageUrl,
              threshold,
              totalKeys,
              signatures: [] // Would be populated from transaction pending state
            });

            totalRequired += threshold;
          }
        }
      } catch (authError) {
        console.warn(`  Warning: Could not query authority ${authUrl}:`, authError);
      }
    }

    // Get pending signatures from transaction status
    if (txResult.signatures && Array.isArray(txResult.signatures)) {
      totalCollected = txResult.signatures.length;
    }

    res.json({
      success: true,
      txHash,
      principal,
      authorities,
      requiredSignatures: totalRequired || 1,
      collectedSignatures: totalCollected,
      isReady: totalCollected >= (totalRequired || 1),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get authority requirements:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/pending/:actionId/dismiss
 *
 * Dismiss a pending action (mark as seen/ignored).
 * This is handled client-side in Firestore, but this endpoint
 * can be used for backend validation or logging.
 */
app.post('/api/v1/pending/:actionId/dismiss', async (req, res) => {
  console.log('\n📝 POST /api/v1/pending/:actionId/dismiss');

  try {
    const actionId = decodeURIComponent(req.params.actionId);
    const { reason, userId } = req.body;

    console.log('  Action ID:', actionId);
    console.log('  Reason:', reason);
    console.log('  User ID:', userId?.substring(0, 8) + '...');

    // Note: Actual dismissal is handled in Firestore on the client side
    // This endpoint is for audit logging and potential backend validation

    res.json({
      success: true,
      actionId,
      dismissed: true,
      message: 'Action dismissed successfully'
    });

  } catch (error) {
    console.error('❌ Failed to dismiss action:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== Relationship Endpoints ====================

/**
 * GET /api/v1/relationships
 *
 * Get delegation relationships for an ADI.
 * Queries the Accumulate network to find which key pages have
 * delegated authority to other ADIs.
 */
app.get('/api/v1/relationships', async (req, res) => {
  console.log('\n📊 GET /api/v1/relationships');

  try {
    const { adiUrl } = req.query;

    if (!adiUrl || typeof adiUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'adiUrl query parameter is required'
      });
    }

    const normalizedAdiUrl = adiUrl.startsWith('acc://') ? adiUrl : `acc://${adiUrl}`;
    console.log('  ADI URL:', normalizedAdiUrl);

    // Query the ADI's key book to find delegation relationships
    const keyBookUrl = `${normalizedAdiUrl}/book`;
    const keyBookResult = await accumulateService.getAccount(keyBookUrl);

    const relationships: Array<{
      id: string;
      type: 'grantor' | 'grantee';
      delegateUrl: string;
      keyPageUrl: string;
      permissions: string[];
    }> = [];

    if (keyBookResult && keyBookResult.success && keyBookResult.account) {
      const pages = keyBookResult.account.pages || [];

      for (const pageUrl of pages) {
        try {
          const pageResult = await accumulateService.getAccount(pageUrl);
          if (pageResult && pageResult.account) {
            // Check for delegate entries on the key page
            const entries = pageResult.account.entries || pageResult.account.keys || [];
            for (const entry of entries) {
              if (entry.delegate) {
                relationships.push({
                  id: `${pageUrl}-${entry.delegate}`,
                  type: 'grantor',
                  delegateUrl: entry.delegate,
                  keyPageUrl: pageUrl,
                  permissions: ['sign']
                });
              }
            }
          }
        } catch (pageError) {
          console.warn(`  Warning: Could not query key page ${pageUrl}`);
        }
      }
    }

    res.json({
      success: true,
      adiUrl: normalizedAdiUrl,
      relationships,
      count: relationships.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get relationships:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/relationships/delegation-request
 *
 * Create a delegation request.
 * Note: This endpoint logs the request for audit purposes.
 * The actual Firestore storage is handled client-side.
 */
app.post('/api/v1/relationships/delegation-request', async (req, res) => {
  console.log('\n📝 POST /api/v1/relationships/delegation-request');

  try {
    const { requester, target, authorityType, permissions, message } = req.body;

    console.log('  Requester:', requester?.adiUrl);
    console.log('  Target:', target?.adiUrl);
    console.log('  Authority Type:', authorityType);
    console.log('  Permissions:', permissions);

    if (!requester?.adiUrl || !target?.adiUrl) {
      return res.status(400).json({
        success: false,
        error: 'requester.adiUrl and target.adiUrl are required'
      });
    }

    // Validate that both ADIs exist on the network
    const [requesterResult, targetResult] = await Promise.all([
      accumulateService.getAccount(requester.adiUrl),
      accumulateService.getAccount(target.adiUrl)
    ]);

    if (!requesterResult?.success) {
      return res.status(404).json({
        success: false,
        error: `Requester ADI not found: ${requester.adiUrl}`
      });
    }

    if (!targetResult?.success) {
      return res.status(404).json({
        success: false,
        error: `Target ADI not found: ${target.adiUrl}`
      });
    }

    const requestId = `dreq-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    res.json({
      success: true,
      requestId,
      requester: requester.adiUrl,
      target: target.adiUrl,
      authorityType: authorityType || 'delegate',
      permissions: permissions || [],
      message: 'Delegation request created. Store in Firestore for persistence.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to create delegation request:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/relationships/:requestId/respond
 *
 * Respond to a delegation request (accept or reject).
 * If accepted, can optionally add the delegate to the key page on Accumulate.
 */
app.post('/api/v1/relationships/:requestId/respond', async (req, res) => {
  console.log('\n📝 POST /api/v1/relationships/:requestId/respond');

  try {
    const requestId = decodeURIComponent(req.params.requestId);
    const { accept, grantorAdiUrl, granteePublicKey, keyPageUrl, signature, publicKey } = req.body;

    console.log('  Request ID:', requestId);
    console.log('  Accept:', accept);
    console.log('  Grantor ADI:', grantorAdiUrl);
    console.log('  Key Page:', keyPageUrl);

    if (accept === undefined) {
      return res.status(400).json({
        success: false,
        error: 'accept (boolean) is required'
      });
    }

    // If accepted and we have the necessary info, we could add the delegate
    // to the key page. This requires a signed transaction from the grantor.
    // For now, we just acknowledge the response and let the client handle Firestore.

    if (accept && granteePublicKey && keyPageUrl && signature) {
      console.log('  Note: On-chain delegation would be processed here');
      // In a full implementation, we would:
      // 1. Prepare an UpdateKeyPage transaction to add the delegate
      // 2. Submit it with the provided signature
    }

    res.json({
      success: true,
      requestId,
      accepted: accept,
      message: accept
        ? 'Delegation request accepted. Update Firestore to create relationship.'
        : 'Delegation request rejected.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to respond to delegation request:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/relationships/:relationshipId
 *
 * Revoke a delegation relationship.
 * Note: This logs the revocation. Actual key page updates require
 * a signed transaction from the grantor.
 */
app.delete('/api/v1/relationships/:relationshipId', async (req, res) => {
  console.log('\n🗑️ DELETE /api/v1/relationships/:relationshipId');

  try {
    const relationshipId = decodeURIComponent(req.params.relationshipId);
    const { keyPageUrl, delegatePublicKey, signature, publicKey } = req.body;

    console.log('  Relationship ID:', relationshipId);
    console.log('  Key Page:', keyPageUrl);

    // If we have the necessary info, we could remove the delegate
    // from the key page. This requires a signed transaction.
    // For now, we just acknowledge and let the client update Firestore.

    if (keyPageUrl && delegatePublicKey && signature) {
      console.log('  Note: On-chain delegation removal would be processed here');
      // In a full implementation, we would:
      // 1. Prepare an UpdateKeyPage transaction to remove the delegate
      // 2. Submit it with the provided signature
    }

    res.json({
      success: true,
      relationshipId,
      revoked: true,
      message: 'Delegation revoked. Update Firestore to reflect status.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to revoke delegation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/adi/:url/intents
 *
 * Get recent intents from an ADI's data account.
 * Returns the data account info and any stored data entries.
 * Note: Full chain history queries require additional Accumulate API support.
 */
app.get('/api/v1/adi/:url/intents', async (req, res) => {
  console.log('\n📊 GET /api/v1/adi/:url/intents');

  try {
    let adiUrl = decodeURIComponent(req.params.url);
    if (!adiUrl.startsWith('acc://')) {
      adiUrl = `acc://${adiUrl}`;
    }

    const dataAccountUrl = `${adiUrl}/data`;
    const limitCount = parseInt(req.query.limit as string) || 50;

    console.log('  Checking data account:', dataAccountUrl);

    // Get the data account to verify it exists and get current state
    const accountResult = await accumulateService.getAccount(dataAccountUrl);

    if (!accountResult || !accountResult.success) {
      return res.json({
        success: true,
        adiUrl,
        dataAccountUrl,
        intents: [],
        count: 0,
        message: 'Data account not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Note: Intent history is primarily tracked in Firestore
    // The data account shows the current state, not full history
    res.json({
      success: true,
      adiUrl,
      dataAccountUrl,
      account: accountResult.account,
      intents: [],
      count: 0,
      message: 'Intent history is tracked via Firestore transaction intents',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Failed to get ADI intents:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== Proof Service Proxy Endpoints ====================

const PROOF_SERVICE_URL = process.env.PROOF_SERVICE_URL || 'http://localhost:8082';

/**
 * GET /api/v1/proof/status/:txHash
 *
 * Get proof status for a transaction.
 * Proxies to the proof service.
 */
app.get('/api/v1/proof/status/:txHash', async (req, res) => {
  console.log('\n📊 GET /api/v1/proof/status/:txHash');

  try {
    const txHash = decodeURIComponent(req.params.txHash);
    console.log('  Checking proof status for:', txHash);

    // Proxy to proof service
    const response = await fetch(`${PROOF_SERVICE_URL}/api/v1/proofs/tx/${encodeURIComponent(txHash)}`);

    if (!response.ok) {
      return res.json({
        success: true,
        hasProof: false,
        message: 'No proof found for this transaction',
      });
    }

    const proofData = await response.json() as Record<string, unknown>;

    res.json({
      success: true,
      hasProof: true,
      proof: {
        proofId: proofData.proof_id,
        status: proofData.verified ? 'verified' : 'pending',
        batchId: proofData.batch_id,
        batchType: proofData.batch_type,
        merkleRoot: proofData.merkle_root,
        anchorTxHash: proofData.anchor_tx_hash,
        anchorChain: proofData.anchor_chain,
        anchorBlockNumber: proofData.anchor_block_number,
        confirmations: proofData.confirmations,
      },
    });

  } catch (error) {
    // Proof service may not be running - return graceful response
    console.warn('⚠️ Proof service query failed:', error instanceof Error ? error.message : error);
    res.json({
      success: true,
      hasProof: false,
      message: 'Proof service unavailable',
    });
  }
});

/**
 * GET /api/v1/anchor/batch/:batchId
 *
 * Get batch status by ID.
 * Proxies to the proof service.
 */
app.get('/api/v1/anchor/batch/:batchId', async (req, res) => {
  console.log('\n📊 GET /api/v1/anchor/batch/:batchId');

  try {
    const batchId = decodeURIComponent(req.params.batchId);
    console.log('  Checking batch status for:', batchId);

    const response = await fetch(`${PROOF_SERVICE_URL}/api/v1/batches/${encodeURIComponent(batchId)}`);

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    const batchData = await response.json() as Record<string, unknown>;

    res.json({
      success: true,
      batch: {
        batchId: batchData.batch_id,
        status: batchData.status, // pending, closed, anchoring, anchored, confirmed
        batchType: batchData.batch_type, // on_demand, on_cadence
        transactionCount: batchData.transaction_count,
        merkleRoot: batchData.merkle_root,
        anchorTxHash: batchData.anchor_tx_hash,
        anchorChain: batchData.anchor_chain,
        createdAt: batchData.created_at,
        anchoredAt: batchData.anchored_at,
      },
    });

  } catch (error) {
    console.warn('⚠️ Batch query failed:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: 'Batch query failed',
    });
  }
});

/**
 * GET /api/v1/anchor/confirmations/:proofId
 *
 * Get anchor confirmation count for a proof.
 * Proxies to the proof service.
 */
app.get('/api/v1/anchor/confirmations/:proofId', async (req, res) => {
  console.log('\n📊 GET /api/v1/anchor/confirmations/:proofId');

  try {
    const proofId = decodeURIComponent(req.params.proofId);
    console.log('  Checking confirmations for proof:', proofId);

    const response = await fetch(`${PROOF_SERVICE_URL}/api/v1/proofs/${encodeURIComponent(proofId)}/confirmations`);

    if (!response.ok) {
      return res.json({
        success: true,
        anchor: null,
        message: 'No anchor found for this proof',
      });
    }

    const anchorData = await response.json() as Record<string, unknown>;

    res.json({
      success: true,
      anchor: {
        txHash: anchorData.anchor_tx_hash,
        chain: anchorData.chain,
        blockNumber: anchorData.block_number,
        confirmations: anchorData.confirmations,
        requiredConfirmations: anchorData.required_confirmations || 6,
        confirmed: (anchorData.confirmations as number) >= ((anchorData.required_confirmations as number) || 6),
      },
    });

  } catch (error) {
    console.warn('⚠️ Confirmations query failed:', error instanceof Error ? error.message : error);
    res.json({
      success: true,
      anchor: null,
      message: 'Confirmation query failed',
    });
  }
});

// ==================== V2 Multi-Leg Intent Endpoints ====================

/**
 * POST /api/v2/intents
 *
 * Create a multi-leg intent with support for 1-N legs targeting same or different chains.
 * Supports execution modes: sequential, parallel, atomic
 */
app.post('/api/v2/intents', async (req, res) => {
  console.log('\n🔀 POST /api/v2/intents (Multi-Leg Intent)');

  try {
    const {
      intent_data,
      cross_chain_data,
      governance_data,
      replay_data,
      execution_mode = 'sequential',
      proof_class = 'on_demand',
      contract_addresses,
      adi_url,
    } = req.body;

    // Validate required fields
    if (!cross_chain_data || !cross_chain_data.legs || !Array.isArray(cross_chain_data.legs)) {
      return res.status(400).json({
        success: false,
        error: 'cross_chain_data.legs is required and must be an array',
      });
    }

    if (cross_chain_data.legs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one leg is required',
      });
    }

    // Validate execution mode
    const validModes = ['sequential', 'parallel', 'atomic'];
    if (!validModes.includes(execution_mode)) {
      return res.status(400).json({
        success: false,
        error: `Invalid execution_mode. Must be one of: ${validModes.join(', ')}`,
      });
    }

    // Validate proof class
    const validProofClasses = ['on_demand', 'on_cadence'];
    if (!validProofClasses.includes(proof_class)) {
      return res.status(400).json({
        success: false,
        error: `Invalid proof_class. Must be one of: ${validProofClasses.join(', ')}`,
      });
    }

    // Enrich cross_chain_data with execution mode
    const enrichedCrossChainData = {
      ...cross_chain_data,
      version: '2.0',
      execution_mode,
      execution_constraints: {
        ...cross_chain_data.execution_constraints,
        mode: execution_mode,
      },
    };

    // Generate intent ID if not provided
    const intentId = intent_data?.intent_id || crypto.randomUUID();
    const legCount = cross_chain_data.legs.length;

    console.log(`  Intent ID: ${intentId}`);
    console.log(`  Leg count: ${legCount}`);
    console.log(`  Execution mode: ${execution_mode}`);
    console.log(`  Proof class: ${proof_class}`);

    // Group legs by target chain for logging
    const chainGroups: Record<string, any[]> = {};
    for (const leg of cross_chain_data.legs) {
      const chainKey = `${leg.chain}:${leg.chainId || 'unknown'}`;
      if (!chainGroups[chainKey]) {
        chainGroups[chainKey] = [];
      }
      chainGroups[chainKey].push(leg);
    }
    console.log(`  Chain groups: ${Object.keys(chainGroups).join(', ')}`);

    // Build multi-leg intent request
    const adiUrl = adi_url || governance_data?.organizationAdi || '';

    // Convert incoming legs to IntentLeg format
    const intentLegs: IntentLeg[] = cross_chain_data.legs.map((leg: any, index: number) => ({
      legId: leg.legId || `leg-${index}`,
      role: leg.role || (index === 0 ? 'source' : 'destination'),
      chain: leg.chain || 'ethereum',
      chainId: leg.chainId || 1,
      fromAddress: leg.from || '',
      toAddress: leg.to || '',
      amount: leg.amountEth || '0',
      amountWei: leg.amountWei,
      tokenSymbol: leg.asset?.symbol || 'ETH',
      tokenAddress: leg.asset?.address,
      sequenceOrder: leg.sequence_order ?? index,
    }));

    console.log(`  Building multi-leg intent with ${intentLegs.length} legs`);
    intentLegs.forEach((leg, i) => {
      console.log(`    Leg ${i}: ${leg.chain} ${leg.amount} ${leg.tokenSymbol} -> ${leg.toAddress.slice(0, 10)}...`);
    });

    const createRequest: CreateMultiLegIntentRequest = {
      intent: {
        id: intentId,
        legs: intentLegs,
        adiUrl: adiUrl,
        initiatedBy: intent_data?.created_by || 'api-bridge',
        timestamp: Date.now(),
        executionMode: execution_mode as ExecutionMode,
      },
      contractAddresses: contract_addresses || {
        anchor: '0x8398D7EB594bCc608a0210cf206b392d35Ed5339',
        anchorV2: '0x9B29771EFA2C6645071C589239590b81ae2C5825',
        abstractAccount: '',
        entryPoint: '',
      },
      proofClass: proof_class as 'on_demand' | 'on_cadence',
      executionMode: execution_mode as ExecutionMode,
    };

    // Get private key from stored ADI or fall back to sponsor key
    const storedAdi = adiStorageService.getAdi(adiUrl);
    const privateKeyToUse = storedAdi?.privateKey || process.env.ACCUM_PRIV_KEY?.substring(0, 64) || '';
    if (!privateKeyToUse) {
      return res.status(400).json({
        success: false,
        error: 'No private key available for this ADI',
      });
    }

    // Create the multi-leg intent via the service
    const result = await certenIntentService.createMultiLegTransactionIntent(createRequest, privateKeyToUse);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to create multi-leg intent',
      });
    }

    res.json({
      success: true,
      intent_id: intentId,
      operation_id: result.roundId,
      tx_hash: result.txHash,
      leg_count: legCount,
      execution_mode,
      proof_class,
      chain_groups: Object.keys(chainGroups).map(key => ({
        chain_key: key,
        leg_count: chainGroups[key].length,
      })),
      data_account: result.dataAccount,
      created_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Multi-leg intent creation failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =============================================================================
// V2 TWO-PHASE SIGNING ENDPOINTS (for Key Vault external signing)
// =============================================================================

/**
 * POST /api/v2/intents/prepare
 *
 * Phase 1 of two-phase signing for multi-leg intents.
 * Prepares the transaction and returns hashToSign for Key Vault signing.
 * This ensures user approval is required for ALL multi-leg transactions.
 */
app.post('/api/v2/intents/prepare', async (req, res) => {
  console.log('\n🔐 POST /api/v2/intents/prepare (Multi-Leg Two-Phase Signing - Phase 1)');

  try {
    const {
      intent_data,
      cross_chain_data,
      governance_data,
      replay_data,
      execution_mode = 'sequential',
      proof_class = 'on_demand',
      contract_addresses,
      adi_url,
      public_key,  // Required for two-phase signing
      signer_key_page_url,
    } = req.body;

    // Validate required fields
    if (!public_key) {
      return res.status(400).json({
        success: false,
        error: 'public_key is required for two-phase signing (from Key Vault)',
      });
    }

    if (!cross_chain_data || !cross_chain_data.legs || !Array.isArray(cross_chain_data.legs)) {
      return res.status(400).json({
        success: false,
        error: 'cross_chain_data.legs is required and must be an array',
      });
    }

    if (cross_chain_data.legs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one leg is required',
      });
    }

    // Validate execution mode
    const validModes = ['sequential', 'parallel', 'atomic'];
    if (!validModes.includes(execution_mode)) {
      return res.status(400).json({
        success: false,
        error: `Invalid execution_mode. Must be one of: ${validModes.join(', ')}`,
      });
    }

    // Validate proof class
    const validProofClasses = ['on_demand', 'on_cadence'];
    if (!validProofClasses.includes(proof_class)) {
      return res.status(400).json({
        success: false,
        error: `Invalid proof_class. Must be one of: ${validProofClasses.join(', ')}`,
      });
    }

    // Generate intent ID if not provided
    const intentId = intent_data?.intent_id || crypto.randomUUID();
    const legCount = cross_chain_data.legs.length;
    const adiUrl = adi_url || governance_data?.organizationAdi || '';

    console.log(`  Intent ID: ${intentId}`);
    console.log(`  Leg count: ${legCount}`);
    console.log(`  Execution mode: ${execution_mode}`);
    console.log(`  Proof class: ${proof_class}`);
    console.log(`  Public key: ${public_key?.slice(0, 20)}...`);

    // Convert incoming legs to IntentLeg format
    const intentLegs: IntentLeg[] = cross_chain_data.legs.map((leg: any, index: number) => ({
      legId: leg.legId || `leg-${index}`,
      role: leg.role || (index === 0 ? 'source' : 'destination'),
      chain: leg.chain || 'ethereum',
      chainId: leg.chainId || 1,
      fromAddress: leg.from || '',
      toAddress: leg.to || '',
      amount: leg.amountEth || '0',
      amountWei: leg.amountWei,
      tokenSymbol: leg.asset?.symbol || 'ETH',
      tokenAddress: leg.asset?.address,
      sequenceOrder: leg.sequence_order ?? index,
    }));

    console.log(`  Building multi-leg intent with ${intentLegs.length} legs for Key Vault signing`);

    const prepareRequest: CreateMultiLegIntentRequest = {
      intent: {
        id: intentId,
        legs: intentLegs,
        adiUrl: adiUrl,
        initiatedBy: intent_data?.created_by || 'api-bridge',
        timestamp: Date.now(),
        executionMode: execution_mode as ExecutionMode,
      },
      contractAddresses: contract_addresses || {
        anchor: '0x8398D7EB594bCc608a0210cf206b392d35Ed5339',
        anchorV2: '0x9B29771EFA2C6645071C589239590b81ae2C5825',
        abstractAccount: '',
        entryPoint: '',
      },
      proofClass: proof_class as 'on_demand' | 'on_cadence',
      executionMode: execution_mode as ExecutionMode,
    };

    // Prepare the multi-leg intent for external signing
    const result = await certenIntentService.prepareMultiLegTransactionIntent(
      prepareRequest,
      public_key,
      signer_key_page_url
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to prepare multi-leg intent',
      });
    }

    console.log('✅ Multi-leg intent prepared for Key Vault signing');

    res.json({
      success: true,
      request_id: result.requestId,
      transaction_hash: result.transactionHash,
      hash_to_sign: result.hashToSign,  // THIS is what Key Vault should sign!
      signer_key_page_url: result.signerKeyPageUrl,
      key_page_version: result.keyPageVersion,
      intent_id: intentId,
      leg_count: legCount,
      execution_mode,
      proof_class,
      data_account: result.dataAccount,
      message: 'Multi-leg intent prepared. Sign hash_to_sign with Key Vault and call /api/v2/intents/submit-signed',
    });

  } catch (error) {
    console.error('❌ Multi-leg intent preparation failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v2/intents/submit-signed
 *
 * Phase 2 of two-phase signing for multi-leg intents.
 * Accepts the signature from Key Vault and submits the transaction.
 */
app.post('/api/v2/intents/submit-signed', async (req, res) => {
  console.log('\n📤 POST /api/v2/intents/submit-signed (Multi-Leg Two-Phase Signing - Phase 2)');

  try {
    const { request_id, signature, public_key, intent_id, leg_count, execution_mode, proof_class } = req.body;

    console.log('  Submitting signed multi-leg intent:', {
      request_id,
      hasSignature: !!signature,
      hasPublicKey: !!public_key,
      intent_id,
      leg_count,
    });

    // Validate required fields
    if (!request_id) {
      return res.status(400).json({
        success: false,
        error: 'request_id is required (from /api/v2/intents/prepare)',
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'signature is required (from Key Vault)',
      });
    }

    if (!public_key) {
      return res.status(400).json({
        success: false,
        error: 'public_key is required (from Key Vault)',
      });
    }

    // Submit with external signature
    const result = await certenIntentService.submitMultiLegWithExternalSignature(
      request_id,
      signature,
      public_key
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to submit multi-leg intent',
      });
    }

    console.log('✅ Multi-leg intent submitted with Key Vault signature');

    res.json({
      success: true,
      tx_hash: result.txHash,
      operation_id: result.roundId,
      intent_id: intent_id,
      leg_count: leg_count,
      execution_mode: execution_mode,
      proof_class: proof_class,
      data_account: result.dataAccount,
      message: 'Multi-leg intent submitted successfully with Key Vault signature',
    });

  } catch (error) {
    console.error('❌ Multi-leg intent submission failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v2/intents/:intentId
 *
 * Get a multi-leg intent with all its legs and status.
 */
app.get('/api/v2/intents/:intentId', async (req, res) => {
  console.log('\n📊 GET /api/v2/intents/:intentId');

  try {
    const intentId = decodeURIComponent(req.params.intentId);
    console.log(`  Looking up intent: ${intentId}`);

    // Query proof service for intent data
    const response = await fetch(`${PROOF_SERVICE_URL}/api/v1/intents/${encodeURIComponent(intentId)}`);

    if (!response.ok) {
      // Try to find by operation ID as fallback
      const opIdResponse = await fetch(`${PROOF_SERVICE_URL}/api/v1/intents/operation/${encodeURIComponent(intentId)}`);

      if (!opIdResponse.ok) {
        return res.status(404).json({
          success: false,
          error: 'Intent not found',
        });
      }

      const intentData = await opIdResponse.json() as Record<string, unknown>;
      return res.json({
        success: true,
        intent: intentData,
      });
    }

    const intentData = await response.json() as Record<string, unknown>;

    res.json({
      success: true,
      intent: {
        intent_id: intentData.intent_id,
        operation_id: intentData.operation_id,
        status: intentData.status,
        leg_count: intentData.leg_count,
        execution_mode: intentData.execution_mode,
        proof_class: intentData.proof_class,
        legs_completed: intentData.legs_completed,
        legs_failed: intentData.legs_failed,
        legs_pending: intentData.legs_pending,
        accumulate_tx_hash: intentData.accumulate_tx_hash,
        created_at: intentData.created_at,
        completed_at: intentData.completed_at,
      },
    });

  } catch (error) {
    console.warn('⚠️ Intent query failed:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: 'Intent query failed',
    });
  }
});

/**
 * GET /api/v2/intents/:intentId/legs
 *
 * Get all legs for a multi-leg intent with their individual statuses.
 */
app.get('/api/v2/intents/:intentId/legs', async (req, res) => {
  console.log('\n📊 GET /api/v2/intents/:intentId/legs');

  try {
    const intentId = decodeURIComponent(req.params.intentId);
    console.log(`  Looking up legs for intent: ${intentId}`);

    const response = await fetch(`${PROOF_SERVICE_URL}/api/v1/intents/${encodeURIComponent(intentId)}/legs`);

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'Intent or legs not found',
      });
    }

    const legsData = await response.json() as { legs: Record<string, unknown>[] };

    res.json({
      success: true,
      intent_id: intentId,
      legs: legsData.legs?.map((leg: any) => ({
        leg_id: leg.leg_id,
        leg_index: leg.leg_index,
        leg_external_id: leg.leg_external_id,
        target_chain: leg.target_chain,
        chain_id: leg.chain_id,
        role: leg.role,
        status: leg.status,
        from_address: leg.from_address,
        to_address: leg.to_address,
        amount: leg.amount,
        token_symbol: leg.token_symbol,
        execution_tx_hash: leg.execution_tx_hash,
        execution_block: leg.execution_block,
        anchor_tx_hash: leg.anchor_tx_hash,
        created_at: leg.created_at,
        completed_at: leg.completed_at,
      })) || [],
    });

  } catch (error) {
    console.warn('⚠️ Legs query failed:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: 'Legs query failed',
    });
  }
});

/**
 * GET /api/v2/intents/:intentId/legs/:legId
 *
 * Get a specific leg by ID within an intent.
 */
app.get('/api/v2/intents/:intentId/legs/:legId', async (req, res) => {
  console.log('\n📊 GET /api/v2/intents/:intentId/legs/:legId');

  try {
    const intentId = decodeURIComponent(req.params.intentId);
    const legId = decodeURIComponent(req.params.legId);
    console.log(`  Looking up leg ${legId} for intent: ${intentId}`);

    const response = await fetch(`${PROOF_SERVICE_URL}/api/v1/intents/${encodeURIComponent(intentId)}/legs/${encodeURIComponent(legId)}`);

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'Leg not found',
      });
    }

    const legData = await response.json() as Record<string, unknown>;

    res.json({
      success: true,
      intent_id: intentId,
      leg: {
        leg_id: legData.leg_id,
        leg_index: legData.leg_index,
        leg_external_id: legData.leg_external_id,
        target_chain: legData.target_chain,
        chain_id: legData.chain_id,
        role: legData.role,
        sequence_order: legData.sequence_order,
        depends_on_legs: legData.depends_on_legs,
        status: legData.status,
        from_address: legData.from_address,
        to_address: legData.to_address,
        amount: legData.amount,
        token_symbol: legData.token_symbol,
        execution_tx_hash: legData.execution_tx_hash,
        execution_block: legData.execution_block,
        execution_gas_used: legData.execution_gas_used,
        execution_error: legData.execution_error,
        batch_id: legData.batch_id,
        anchor_id: legData.anchor_id,
        proof_id: legData.proof_id,
        retry_count: legData.retry_count,
        max_retries: legData.max_retries,
        created_at: legData.created_at,
        completed_at: legData.completed_at,
      },
    });

  } catch (error) {
    console.warn('⚠️ Leg query failed:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: 'Leg query failed',
    });
  }
});

/**
 * POST /api/v2/intents/:intentId/retry
 *
 * Retry failed legs for a multi-leg intent.
 */
app.post('/api/v2/intents/:intentId/retry', async (req, res) => {
  console.log('\n🔄 POST /api/v2/intents/:intentId/retry');

  try {
    const intentId = decodeURIComponent(req.params.intentId);
    const { leg_ids } = req.body; // Optional: specific legs to retry

    console.log(`  Retrying legs for intent: ${intentId}`);
    if (leg_ids && leg_ids.length > 0) {
      console.log(`  Specific legs: ${leg_ids.join(', ')}`);
    } else {
      console.log(`  Retrying all failed legs`);
    }

    // Proxy to proof service
    const response = await fetch(`${PROOF_SERVICE_URL}/api/v1/intents/${encodeURIComponent(intentId)}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leg_ids }),
    });

    if (!response.ok) {
      const errorData = await response.json() as Record<string, unknown>;
      return res.status(response.status).json({
        success: false,
        error: errorData.error || 'Retry failed',
      });
    }

    const result = await response.json() as Record<string, unknown>;

    res.json({
      success: true,
      intent_id: intentId,
      legs_retried: result.legs_retried,
      message: result.message || 'Failed legs queued for retry',
    });

  } catch (error) {
    console.warn('⚠️ Retry request failed:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: 'Retry request failed',
    });
  }
});

/**
 * GET /api/v2/intents/:intentId/chain-groups
 *
 * Get chain groups for a multi-leg intent (legs grouped by target chain).
 */
app.get('/api/v2/intents/:intentId/chain-groups', async (req, res) => {
  console.log('\n📊 GET /api/v2/intents/:intentId/chain-groups');

  try {
    const intentId = decodeURIComponent(req.params.intentId);
    console.log(`  Looking up chain groups for intent: ${intentId}`);

    const response = await fetch(`${PROOF_SERVICE_URL}/api/v1/intents/${encodeURIComponent(intentId)}/chain-groups`);

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'Intent or chain groups not found',
      });
    }

    const groupsData = await response.json() as { chain_groups: Record<string, unknown>[] };

    res.json({
      success: true,
      intent_id: intentId,
      chain_groups: groupsData.chain_groups?.map((group: any) => ({
        group_id: group.group_id,
        chain_key: group.chain_key,
        target_chain: group.target_chain,
        chain_id: group.chain_id,
        leg_count: group.leg_count,
        status: group.status,
        batch_id: group.batch_id,
        anchor_id: group.anchor_id,
        anchor_tx_hash: group.anchor_tx_hash,
        anchor_block: group.anchor_block,
        created_at: group.created_at,
        anchored_at: group.anchored_at,
        completed_at: group.completed_at,
      })) || [],
    });

  } catch (error) {
    console.warn('⚠️ Chain groups query failed:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: 'Chain groups query failed',
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(port, async () => {
  console.log(`\n🚀 CERTEN API Bridge Server v1.0.0`);
  console.log(`📡 API Endpoint: http://localhost:${port}`);
  console.log(`🔗 Accumulate Network: ${process.env.ACCUM_ENDPOINT || 'http://206.191.154.164/v3'}`);
  console.log(`🌐 Network: Kermit Testnet`);
  console.log(`💰 LTA: ${process.env.ACCUM_LTA || 'Not configured'}`);
  console.log(`🔒 CORS Origins: ${allowedOrigins.join(', ')}\n`);

  // Initialize ADI registry with automatic credential detection
  try {
    await initializeAdiRegistry();
  } catch (error) {
    console.error('❌ Failed to initialize ADI registry:', error);
  }
});