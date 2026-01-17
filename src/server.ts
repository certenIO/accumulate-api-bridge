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
import { AccumulateService } from './AccumulateService.js';
import { AdiStorageService } from './AdiStorageService.js';
import { CertenIntentService, CreateIntentRequest } from './CertenIntentService.js';

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
      if (result && result.url) {
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

// Update account authorities endpoint (real implementation)
app.post('/api/v1/account/authorities/update', async (req, res) => {
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
    const { intent, contractAddresses, executionParameters, validationRules, expirationMinutes, adiPrivateKey, signerKeyPageUrl } = req.body;

    console.log('🎯 Creating Certen transaction intent', {
      intentId: intent?.id,
      fromChain: intent?.fromChain,
      toChain: intent?.toChain,
      amount: intent?.amount,
      adiUrl: intent?.adiUrl
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
      expirationMinutes: expirationMinutes || 95
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

// Write data to data account endpoint (real implementation)
app.post('/api/v1/data-account/write', async (req, res) => {
  try {
    const { adiName, dataAccountName, dataEntries, adiPrivateKey, signerKeyPageUrl, memo, metadata } = req.body;

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

    // Process metadata if provided as hex string
    let metadataBuffer: Buffer | undefined;
    if (metadata) {
      if (typeof metadata === 'string') {
        metadataBuffer = Buffer.from(metadata, 'hex');
      } else if (Array.isArray(metadata)) {
        metadataBuffer = Buffer.from(metadata);
      } else {
        metadataBuffer = metadata;
      }
    }

    console.log(`📝 Writing ${dataEntries.length} entries to data account: ${dataAccountName} under ADI: ${adiName}`, {
      hasPrivateKey: !!adiPrivateKey,
      signerKeyPageUrl: signerKeyPageUrl || 'using default',
      hasMemo: !!memo,
      hasMetadata: !!metadataBuffer,
      memo: memo || 'none'
    });

    const result = await accumulateService.writeData(
      adiName,
      dataAccountName,
      dataEntries,
      adiPrivateKey,
      signerKeyPageUrl,
      memo,           // Optional memo field
      metadataBuffer  // Optional metadata field
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
    const normalizedName = adiName.endsWith('.acme') ? adiName : `${adiName}.acme`;
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

    // Step 5: Create data account
    console.log(`📄 Step 3/4: Creating data account...`);

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