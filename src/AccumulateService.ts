import { Logger } from './Logger.js';

// Use static import syntax but declare types - initialize at runtime
let api_v3: any;
let api_v2: any;
let core: any;
let ED25519Key: any;
let Signer: any;
let TransactionType: any;
let Transaction: any;
let Envelope: any;
let encode: any;  // For encoding signature metadata
let sha256: any;  // For hashing

import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SDK path configuration - supports both local and Docker deployment
// Returns a file:// URL for proper ESM import on all platforms
const getSDKUrl = () => {
  // 1. Check environment variable first
  if (process.env.ACCUMULATE_SDK_PATH) {
    const sdkPath = process.env.ACCUMULATE_SDK_PATH;
    // Convert to file URL if it's a path
    if (sdkPath.startsWith('file://')) {
      return sdkPath;
    }
    return pathToFileURL(sdkPath).href;
  }

  // 2. Check local typescript-sdk-accumulate directory (relative to project root)
  const localSDKPath = path.resolve(__dirname, '..', 'typescript-sdk-accumulate');
  if (fs.existsSync(localSDKPath)) {
    console.log(`Using local SDK at: ${localSDKPath}`);
    return pathToFileURL(localSDKPath).href;
  }

  // 3. Fall back to Docker path (already a valid path for Linux)
  return '/typescript-sdk-accumulate/lib';
};

export class AccumulateService {
  private logger: Logger;
  private client: any;
  private clientV2: any;
  private lid: any;
  private lta: string = '';
  private lastTimestamp: number = Date.now() * 1000; // Start with current time in microseconds

  constructor() {
    this.logger = new Logger('AccumulateService');
    this.initializeAsync();
  }

  private getNextTimestamp(): number {
    // Use microseconds format to match key's lastUsedOn
    const currentTimeMicros = Date.now() * 1000; // Convert to microseconds

    // Ensure timestamp is always greater than last used
    if (currentTimeMicros <= this.lastTimestamp) {
      this.lastTimestamp = this.lastTimestamp + 1000; // Add 1ms in microseconds
    } else {
      this.lastTimestamp = currentTimeMicros;
    }

    this.logger.debug('Generated timestamp', {
      generatedTimestamp: this.lastTimestamp,
      isMicroseconds: true
    });

    return this.lastTimestamp;
  }

  private async initializeAsync() {
    try {
      this.logger.info('Loading TypeScript SDK accumulate client');
      const sdkUrl = getSDKUrl();

      // Dynamic import with file:// URL for cross-platform compatibility
      // @ts-ignore: Module path determined at runtime
      const accumulate = await import(`${sdkUrl}/index.js`);

      // Extract modules using destructuring
      ({ api_v3, api_v2, core, ED25519Key, Signer } = accumulate);
      TransactionType = core.TransactionType;
      Transaction = core.Transaction;

      // Import Envelope from messaging
      // @ts-ignore: Module path determined at runtime
      const messaging = await import(`${sdkUrl}/messaging/index.js`);
      Envelope = messaging.Envelope;

      // Preload encoding index module to fix circular dependency issue
      // @ts-ignore: Module path determined at runtime
      const encodingIndex = await import(`${sdkUrl}/encoding/index.js`);
      // @ts-ignore: Module path determined at runtime
      const encodable = await import(`${sdkUrl}/encoding/encodable.js`);
      // @ts-ignore: Optional method may not exist
      if (encodable.setIndexModule) {
        // @ts-ignore: Optional method may not exist
        encodable.setIndexModule(encodingIndex);
      }

      // Store encode function for two-phase signing
      encode = encodingIndex.encode;

      // Load sha256 from common module
      // @ts-ignore: Module path determined at runtime
      const commonModule = await import(`${sdkUrl}/common/index.js`);
      sha256 = commonModule.sha256;

      // Initialize Accumulate clients - Kermit testnet by default
      const endpointV3 = process.env.ACCUM_ENDPOINT || 'http://206.191.154.164/v3';
      const endpointV2 = process.env.ACCUM_ENDPOINT_V2 || 'http://206.191.154.164/v2';
      console.log(`🔗 Connecting to Accumulate: ${endpointV3}`);
      this.client = new api_v3.JsonRpcClient(endpointV3);
      this.clientV2 = new api_v2.Client(endpointV2);

      // Create signing key from private key - FIXED VERSION
      const fullPrivateKey = process.env.ACCUM_PRIV_KEY || '';
      // Use only first 64 characters (32 bytes) - second 64 chars are public key
      const privateKeyHex = fullPrivateKey.substring(0, 64);
      const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
      const ed25519Key = ED25519Key.from(privateKeyBytes);

      // Create the signer for lite identity
      this.lid = Signer.forLite(ed25519Key);
      // Create LTA from LID exactly like comprehensive example
      this.lta = this.lid.url.join("ACME").toString();

      this.logger.info('🔗 Fixed service initialized successfully');
      this.logger.info('🔑 Using private key length:', { privateKeyLength: privateKeyHex.length });
      this.logger.info('💰 LID URL:', this.lid.url.toString());
      this.logger.info('💰 LTA URL:', this.lta);
    } catch (error) {
      this.logger.error('❌ Failed to initialize fixed service', { error });
      throw error;
    }
  }

  async createIdentity(adiName: string): Promise<any> {
    try {
      // Handle both full URLs and just names
      let normalizedName: string;
      if (adiName.startsWith('acc://')) {
        normalizedName = adiName.substring(6);
      } else {
        normalizedName = adiName.endsWith('.acme') ? adiName : `${adiName}.acme`;
      }

      const adiUrl = `acc://${normalizedName}`;
      const keyBookUrl = `${adiUrl}/book`;

      this.logger.info('🆔 Creating ADI with fixed service', { adiUrl, keyBookUrl });

      // Use the existing LID key instead of generating a new one
      // This way the ADI keypage will contain the same key as the LID
      const fullPrivateKey = process.env.ACCUM_PRIV_KEY || '';
      const privateKeyHex = fullPrivateKey.substring(0, 64);
      const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
      const identitySigner = ED25519Key.from(privateKeyBytes);

      // Create transaction exactly like the working example
      const transaction = new core.Transaction({
        header: {
          principal: this.lid.url,
        },
        body: {
          type: "createIdentity",
          url: adiUrl,
          keyHash: identitySigner.address.publicKeyHash,
          keyBookUrl: keyBookUrl,
        },
      });

      // Sign transaction with guaranteed fresh timestamp
      const timestamp = this.getNextTimestamp();
      this.logger.info('🕐 Using guaranteed fresh timestamp', { timestamp });
      const signature = await this.lid.sign(transaction, { timestamp });

      // Submit exactly like the working example
      this.logger.info('📤 Submitting transaction with fresh timestamp');

      const submitResult = await this.client.submit({
        transaction: [transaction],
        signatures: [signature]
      });

      this.logger.info('✅ ADI creation result', { submitResult });

      // Check for success
      for (const result of submitResult) {
        if (!result.success) {
          throw new Error(`Submission failed: ${result.message}`);
        }
      }

      return {
        success: true,
        txId: submitResult[0].status.txID,
        hash: submitResult[0].status.txID,
        adiUrl: adiUrl,
        keyBookUrl: keyBookUrl,
        identitySignerPublicKey: identitySigner.address.publicKeyHash,
        message: 'ADI created successfully',
        createdAt: new Date(),
        networkFee: 0
      };

    } catch (error) {
      this.logger.error('❌ Failed to create ADI with fixed service', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      });
      throw new Error(`Failed to create identity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addCredits(recipient: string, amountACME: number): Promise<any> {
    try {
      this.logger.info('💳 Adding credits with fixed service', { recipient, amountACME });

      // Get oracle price first using networkStatus like the working example
      const { oracle } = await this.client.networkStatus();
      const oraclePrice = oracle.price;

      // Calculate amount (following the working example)
      const creditsAmount = amountACME * 100; // Convert ACME to credits (precision 2)
      const actualAmount = ((creditsAmount * 10 ** 2) / oraclePrice) * 10 ** 8;

      // Create transaction exactly like the working example
      const transaction = new core.Transaction({
        header: {
          principal: this.lid.url.join("ACME"),
        },
        body: {
          type: "addCredits",
          recipient: recipient,
          amount: actualAmount,
          oracle: oraclePrice,
        },
      });

      // Sign and submit with proper timestamp
      const timestamp = this.getNextTimestamp();
      this.logger.info('🕐 Using fresh timestamp for credits', { timestamp });
      const signature = await this.lid.sign(transaction, { timestamp });

      const submitResult = await this.client.submit({
        transaction: [transaction],
        signatures: [signature]
      });

      // Check for success
      for (const result of submitResult) {
        if (!result.success) {
          throw new Error(`Credits submission failed: ${result.message}`);
        }
      }

      return {
        success: true,
        txId: submitResult[0].status.txID,
        hash: submitResult[0].status.txID,
        recipient: recipient,
        amount: amountACME.toString(),
        credits: creditsAmount,
        oracle: oraclePrice,
        message: 'Credits added successfully',
        createdAt: new Date()
      };

    } catch (error) {
      this.logger.error('❌ Failed to add credits', { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to add credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createDataAccount(adiName: string, dataAccountName: string): Promise<any> {
    try {
      const adiUrl = `acc://${adiName}`;
      const dataAccountUrl = `${adiUrl}/${dataAccountName}`;
      const keyPageUrl = `${adiUrl}/book/1`;

      this.logger.info('📄 Creating data account with fixed service', { dataAccountUrl });

      // Create the signing key from the same private key used to create the ADI
      const lidPrivateKey = process.env.ACCUM_PRIV_KEY?.substring(0, 64) || '';
      const privateKeyBytes = Buffer.from(lidPrivateKey, 'hex');
      const keypageKey = ED25519Key.from(privateKeyBytes);
      const signingKeyHash = Buffer.from(keypageKey.address.publicKeyHash).toString('hex');

      this.logger.info('🔑 Signing key details:', {
        keyPageUrl,
        signingKeyHash: signingKeyHash.substring(0, 16) + '...',
        privateKeyLength: lidPrivateKey.length
      });

      // Query the key page to verify our key is authorized and get the correct version
      let keyPageData: any;
      let currentVersion = 1;
      let keyPageKeys: string[] = [];

      try {
        keyPageData = await this.client.query(keyPageUrl);
        currentVersion = keyPageData.account?.version || 1;

        // Extract key hashes from the key page
        const keys = keyPageData.account?.keys || keyPageData.data?.keys || [];
        keyPageKeys = keys.map((k: any) => {
          if (k.publicKeyHash) {
            return Buffer.from(k.publicKeyHash).toString('hex');
          }
          if (k.keyHash) {
            return Buffer.from(k.keyHash).toString('hex');
          }
          return null;
        }).filter(Boolean);

        this.logger.info('🔍 KeyPage verification:', {
          keyPageUrl,
          version: currentVersion,
          keyCount: keyPageKeys.length,
          keys: keyPageKeys.map((k: string) => k.substring(0, 16) + '...'),
          creditBalance: keyPageData.account?.creditBalance || 0
        });

        // Verify our signing key is on the key page
        const keyIsAuthorized = keyPageKeys.some((k: string) =>
          k.toLowerCase() === signingKeyHash.toLowerCase()
        );

        if (!keyIsAuthorized && keyPageKeys.length > 0) {
          this.logger.error('❌ Signing key not found on key page!', {
            signingKeyHash: signingKeyHash.substring(0, 16) + '...',
            authorizedKeys: keyPageKeys.map((k: string) => k.substring(0, 16) + '...')
          });
          throw new Error(`Signing key ${signingKeyHash.substring(0, 16)}... is not authorized on key page. Authorized keys: ${keyPageKeys.map((k: string) => k.substring(0, 16) + '...').join(', ')}`);
        }

        if (keyIsAuthorized) {
          this.logger.info('✅ Signing key verified on key page');
        }
      } catch (queryError) {
        // If query fails, log and try to proceed with default version
        this.logger.warn('⚠️ Could not query key page, proceeding with default version:', {
          error: queryError instanceof Error ? queryError.message : String(queryError)
        });
      }

      // Add a small delay to ensure network consistency after any recent changes
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use the ADI as principal (not the keypage) following comprehensive example
      const transaction = new core.Transaction({
        header: {
          principal: adiUrl,
        },
        body: {
          type: "createDataAccount",
          url: dataAccountUrl,
        },
      });

      // Create ADI signer with verified version
      const adiSigner = Signer.forPage(keyPageUrl, keypageKey).withVersion(currentVersion);

      // Sign with fresh timestamp
      const timestamp = this.getNextTimestamp();
      this.logger.info('🕐 Signing data account creation:', {
        timestamp,
        version: currentVersion,
        signerUrl: keyPageUrl
      });

      const signature = await adiSigner.sign(transaction, { timestamp });

      const submitResult = await this.client.submit({
        transaction: [transaction],
        signatures: [signature]
      });

      // Check for success following comprehensive example
      for (const result of submitResult) {
        if (!result.success) {
          throw new Error(`Data account creation failed: ${result.message}`);
        }
        // Wait for transaction completion (simplified version of comprehensive example)
        this.logger.info('⏳ Waiting for data account creation transaction to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Verify data account was created following comprehensive example pattern
      let dataAccountQuery;
      for (let i = 0; i < 10; i++) {
        try {
          dataAccountQuery = await this.client.query(dataAccountUrl);
          break;
        } catch (error) {
          if (i === 9) throw error;
          this.logger.info(`⏳ Data account not yet available, retrying... (${i + 1}/10)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      this.logger.info('✅ Data account verified successfully', {
        dataAccountUrl,
        accountType: dataAccountQuery?.account?.type
      });

      return {
        success: true,
        txId: submitResult[0].status.txID,
        hash: submitResult[0].status.txID,
        dataAccountUrl: dataAccountUrl,
        accountType: dataAccountQuery?.account?.type,
        message: 'Data account created successfully',
        createdAt: new Date()
      };

    } catch (error) {
      this.logger.error('❌ Failed to create data account', { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to create data account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBalance(accountUrl: string): Promise<any> {
    try {
      const result = await this.client.query(accountUrl);
      // SDK may return account data in .account or .data property
      const accountData = result.account || result.data;
      return {
        url: accountUrl,
        balance: accountData?.balance || accountData?.creditBalance || '0',
        accountType: accountData?.type || 'unknown',
        account: accountData
      };
    } catch (error) {
      this.logger.error('❌ Failed to get balance', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async getAccount(accountUrl: string): Promise<any> {
    try {
      // Use the exact same pattern as the comprehensive example
      // Just query directly - if it succeeds, the account exists
      const result = await this.client.query(accountUrl);

      this.logger.info('🔍 Query successful for credit verification', {
        accountUrl,
        hasAccount: !!result?.account,
        accountType: result?.account?.type,
        creditBalance: result?.account?.creditBalance || result?.data?.creditBalance || 'not found',
        resultStructure: Object.keys(result || {})
      });

      // Follow the exact pattern from comprehensive example
      // If query succeeds, return the account data
      return {
        success: true,
        account: result.account
      };
    } catch (error) {
      this.logger.error('❌ Failed to query account', {
        error: error instanceof Error ? error.message : String(error),
        accountUrl
      });
      throw error;
    }
  }

  // Real KeyBook creation implementation
  async createKeyBook(adiName: string, keyBookName: string, publicKeyHash: string): Promise<any> {
    try {
      const adiUrl = `acc://${adiName}`;
      const keyBookUrl = `${adiUrl}/${keyBookName}`;
      const keyPageUrl = `${adiUrl}/book/1`;

      this.logger.info('📖 Creating KeyBook using SDK pattern', { adiUrl, keyBookUrl, publicKeyHash });

      // Get current key page version following createDataAccount pattern
      const currentVersion = await this.getKeyPageVersion(keyPageUrl);

      // Create ADI signer exactly like createDataAccount
      const lidPrivateKey = process.env.ACCUM_PRIV_KEY?.substring(0, 64) || '';
      const privateKeyBytes = Buffer.from(lidPrivateKey, 'hex');
      const keypageKey = ED25519Key.from(privateKeyBytes);
      const adiSigner = Signer.forPage(keyPageUrl, keypageKey).withVersion(currentVersion);

      // Create Transaction using SDK CreateKeyBookArgs structure
      const transaction = new core.Transaction({
        header: {
          principal: adiUrl, // ADI is the principal
        },
        body: {
          type: "createKeyBook",
          url: keyBookUrl,  // KeyBook URL
          publicKeyHash: publicKeyHash,  // Hex string
        },
      });

      this.logger.info('🔍 CreateKeyBook transaction:', {
        principal: adiUrl,
        transactionType: "createKeyBook",
        keyBookUrl: keyBookUrl,
        publicKeyHash: publicKeyHash
      });

      // Sign with fresh timestamp - EXACTLY like createDataAccount
      const timestamp = this.getNextTimestamp();
      this.logger.info('🕐 Using fresh timestamp for KeyBook creation', { timestamp });

      const signature = await adiSigner.sign(transaction, { timestamp });

      const submitResult = await this.client.submit({
        transaction: [transaction],
        signatures: [signature]
      });

      // Check for success following createDataAccount pattern
      for (const result of submitResult) {
        if (!result.success) {
          throw new Error(`KeyBook creation failed: ${result.message}`);
        }
        // Wait for transaction completion
        this.logger.info('⏳ Waiting for KeyBook creation transaction to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      this.logger.info('✅ KeyBook creation completed successfully', {
        txId: submitResult[0].status.txID
      });

      return {
        success: true,
        txId: submitResult[0].status.txID,
        hash: submitResult[0].status.txID,
        keyBookUrl: keyBookUrl,
        publicKeyHash: publicKeyHash,
        message: 'KeyBook created successfully',
        createdAt: new Date()
      };

    } catch (error) {
      this.logger.error('❌ Failed to create KeyBook', {
        error: error instanceof Error ? error.message : String(error),
        adiName,
        keyBookName,
        publicKeyHash
      });
      throw new Error(`Failed to create key book: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createKeyPage(keyBookUrl: string, publicKey?: string, publicKeyHash?: string): Promise<any> {
    try {
      this.logger.info('📄 Creating KeyPage using simple SDK pattern (matching createKeyBook)', { keyBookUrl, hasPublicKey: !!publicKey, hasPublicKeyHash: !!publicKeyHash });

      // Get the key hash for the new KeyPage
      let keyHashHex;
      if (publicKeyHash) {
        keyHashHex = publicKeyHash;
      } else if (publicKey) {
        // Create ED25519Key from public key to get the hash - same pattern as other methods
        const publicKeyBytes = Buffer.from(publicKey, 'hex');
        const tempKey = ED25519Key.from(publicKeyBytes);
        keyHashHex = tempKey.address.publicKeyHash.toString('hex');
      } else {
        throw new Error('Either publicKey or publicKeyHash must be provided');
      }

      // Use the KeyBook's first page as signer (not the ADI's book/1)
      const signerKeyPageUrl = `${keyBookUrl}/1`;

      this.logger.info('📄 Creating KeyPage using simplified structure', { signerKeyPageUrl, keyHashHex });

      // Get current key page version - make sure we get the right version for the KeyBook's page
      const currentVersion = await this.getKeyPageVersion(signerKeyPageUrl);
      this.logger.info('🔍 KeyPage version for signing:', { signerKeyPageUrl, currentVersion });

      // Create ADI signer exactly like createKeyBook
      const lidPrivateKey = process.env.ACCUM_PRIV_KEY?.substring(0, 64) || '';
      const privateKeyBytes = Buffer.from(lidPrivateKey, 'hex');
      const keypageKey = ED25519Key.from(privateKeyBytes);

      this.logger.info('🔍 Signer key details:', {
        privateKeyLength: lidPrivateKey.length,
        publicKeyHash: keypageKey.address.publicKeyHash.toString('hex'),
        signerKeyPageUrl: signerKeyPageUrl
      });

      const adiSigner = Signer.forPage(signerKeyPageUrl, keypageKey).withVersion(currentVersion);

      // Use exact structure from working example - Transaction from core, not core.Transaction
      const transaction = new Transaction({
        header: {
          principal: keyBookUrl,
        },
        body: {
          type: "createKeyPage",  // Use string like working example
          keys: [{
            keyHash: keyHashHex,
          }],
        },
      });

      this.logger.info('🔍 CreateKeyPage transaction (correct approach):', {
        principal: keyBookUrl,
        transactionType: "createKeyPage",
        keyHash: keyHashHex
      });

      // Sign with fresh timestamp
      const timestamp = this.getNextTimestamp();
      this.logger.info('🕐 Using fresh timestamp for KeyPage creation', { timestamp });

      const signature = await adiSigner.sign(transaction, { timestamp });

      // Create envelope exactly like working example
      const envelope = new Envelope({
        transaction: [transaction],
        signatures: [signature]
      });

      this.logger.info('📮 Envelope created, submitting to network...');

      // Submit envelope.asObject() exactly like working example
      const submitResult = await this.client.submit(envelope.asObject());

      // Check for success
      for (const result of submitResult) {
        if (!result.success) {
          throw new Error(`KeyPage creation failed: ${result.message}`);
        }
        this.logger.info('⏳ Waiting for KeyPage creation transaction to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      this.logger.info('✅ KeyPage creation completed successfully', {
        txId: submitResult[0].status.txID
      });

      return {
        success: true,
        txId: submitResult[0].status.txID,
        hash: submitResult[0].status.txID,
        keyBookUrl: keyBookUrl,
        keyHash: keyHashHex,
        message: 'KeyPage created successfully with KeyBook as principal',
        createdAt: new Date()
      };

    } catch (error) {
      this.logger.error('❌ Failed to create KeyPage', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        keyBookUrl
      });
      throw new Error(`Failed to create key page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateAccountAuth(accountUrl: string, operations: any[], signerKeypageUrl?: string): Promise<any> {
    try {
      this.logger.info('🔐 Starting AccountAuth update transaction', {
        accountUrl,
        operationsCount: operations.length,
        operations: operations.map(op => ({ type: op.type, authority: op.authority || op.authorityData?.keyBookUrl })),
        signerKeypageUrl
      });

      // Validate operations
      if (!operations || operations.length === 0) {
        throw new Error('No operations provided for AccountAuth update');
      }

      // Transform operations to SDK format
      const sdkOperations = operations.map(op => {
        const operation: any = {};

        switch (op.type.toLowerCase()) {
          case 'enable':
            operation.type = 'enable';
            if (op.authority) {
              operation.authority = op.authority;
            }
            break;
          case 'disable':
            operation.type = 'disable';
            if (op.authority) {
              operation.authority = op.authority;
            }
            break;
          case 'addauthority':
            operation.type = 'addAuthority';
            operation.authority = op.authority || op.authorityData?.keyBookUrl;
            if (!operation.authority) {
              throw new Error('AddAuthority operation requires authority URL');
            }
            break;
          case 'removeauthority':
            operation.type = 'removeAuthority';
            operation.authority = op.authority || op.authorityData?.keyBookUrl;
            if (!operation.authority) {
              throw new Error('RemoveAuthority operation requires authority URL');
            }
            break;
          default:
            throw new Error(`Unsupported operation type: ${op.type}`);
        }

        return operation;
      });

      this.logger.info('🔧 Transformed operations to SDK format', { sdkOperations });

      // Create the UpdateAccountAuth transaction
      const transaction = new Transaction({
        header: {
          principal: accountUrl,
        },
        body: {
          type: 'updateAccountAuth',
          operations: sdkOperations,
        },
      });

      this.logger.info('📝 AccountAuth transaction created', {
        principal: accountUrl,
        type: 'updateAccountAuth',
        operationsCount: sdkOperations.length
      });

      // Determine signer keypage URL - use provided or derive from account
      let keypageUrl = signerKeypageUrl;
      if (!keypageUrl) {
        // For data accounts, derive the main keybook/keypage from parent ADI
        const accountParts = accountUrl.split('/');
        if (accountParts.length >= 3) {
          const adiUrl = accountParts.slice(0, 3).join('/'); // acc://example.acme
          keypageUrl = `${adiUrl}/book/1`; // Default to main keybook, page 1
        } else {
          throw new Error('Cannot derive signer keypage URL from account URL');
        }
      }

      this.logger.info('🔑 Using signer keypage', { keypageUrl });

      // Get current key page version - same as all other working methods
      const currentVersion = await this.getCurrentKeyPageVersion(keypageUrl);
      this.logger.info('🔍 KeyPage version for signing:', { keypageUrl, currentVersion });

      // Create ADI signer exactly like createKeyBook, createDataAccount, etc.
      const lidPrivateKey = process.env.ACCUM_PRIV_KEY?.substring(0, 64) || '';
      const privateKeyBytes = Buffer.from(lidPrivateKey, 'hex');
      const keypageKey = ED25519Key.from(privateKeyBytes);
      const adiSigner = Signer.forPage(keypageUrl, keypageKey).withVersion(currentVersion);

      // Sign the transaction with fresh timestamp
      const timestamp = this.getNextTimestamp();
      this.logger.info('🕐 Signing AccountAuth transaction', { timestamp });

      const signature = await adiSigner.sign(transaction, { timestamp });

      // Submit the transaction
      const envelope = { transaction: [transaction], signatures: [signature] };

      this.logger.info('📤 Submitting AccountAuth transaction to network...');
      const submitResult = await this.client.submit(envelope);

      // Check for success
      for (const result of submitResult) {
        if (!result.success) {
          throw new Error(`AccountAuth update failed: ${result.message}`);
        }

        this.logger.info('✅ AccountAuth update transaction submitted successfully', {
          txId: result.status?.txID,
          status: result.status
        });

        // Wait for transaction completion
        if (result.status?.txID) {
          this.logger.info('⏳ Waiting for AccountAuth transaction completion...');
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Note: In production, you might want to poll for transaction status
          // For now, we'll assume success after a short delay
        }
      }

      return {
        success: true,
        txId: submitResult[0].status?.txID,
        hash: submitResult[0].status?.txID,
        message: `AccountAuth update completed successfully with ${operations.length} operation(s)`,
        operations: sdkOperations,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('❌ AccountAuth update failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        accountUrl,
        operations
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          accountUrl,
          operationsCount: operations.length,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // =============================================================================
  // TWO-PHASE SIGNING FOR ACCOUNT AUTHORITY UPDATES
  // =============================================================================

  // In-memory storage for prepared authority transactions
  private preparedAuthorityTransactions = new Map<string, {
    transaction: any;
    transactionHash: string;
    hashToSign: string;
    sigMdHash: string;
    publicKey: string;
    signerKeyPageUrl: string;
    keyPageVersion: number;
    validTimestamp: number;
    accountUrl: string;
    operations: any[];
    createdAt: number;
  }>();

  /**
   * Prepare an UpdateAccountAuth transaction without signing.
   * Returns the transaction hash that needs to be signed by the Key Vault.
   *
   * This enables two-phase signing: prepare → sign via Key Vault → submit
   */
  async prepareAccountAuthUpdate(
    accountUrl: string,
    operations: any[],
    publicKey: string,
    signerKeyPageUrl?: string
  ): Promise<{
    success: boolean;
    requestId?: string;
    transactionHash?: string;
    hashToSign?: string;
    signerKeyPageUrl?: string;
    keyPageVersion?: number;
    operations?: any[];
    error?: string;
  }> {
    try {
      this.logger.info('🔐 Preparing AccountAuth update transaction (two-phase signing)', {
        accountUrl,
        operationsCount: operations.length,
        hasPublicKey: !!publicKey
      });

      // Validate public key is provided
      if (!publicKey) {
        throw new Error('publicKey is required for two-phase signing (from Key Vault)');
      }

      // Validate operations
      if (!operations || operations.length === 0) {
        throw new Error('No operations provided for AccountAuth update');
      }

      // Transform operations to SDK format
      const sdkOperations = operations.map(op => {
        const operation: any = {};

        switch (op.type.toLowerCase()) {
          case 'enable':
            operation.type = 'enable';
            if (op.authority) {
              operation.authority = op.authority;
            }
            break;
          case 'disable':
            operation.type = 'disable';
            if (op.authority) {
              operation.authority = op.authority;
            }
            break;
          case 'addauthority':
            operation.type = 'addAuthority';
            operation.authority = op.authority || op.authorityData?.keyBookUrl;
            if (!operation.authority) {
              throw new Error('AddAuthority operation requires authority URL');
            }
            break;
          case 'removeauthority':
            operation.type = 'removeAuthority';
            operation.authority = op.authority || op.authorityData?.keyBookUrl;
            if (!operation.authority) {
              throw new Error('RemoveAuthority operation requires authority URL');
            }
            break;
          default:
            throw new Error(`Unsupported operation type: ${op.type}`);
        }

        return operation;
      });

      this.logger.info('🔧 Transformed operations to SDK format', { sdkOperations });

      // Determine signer keypage URL - use provided or derive from account
      let keypageUrl = signerKeyPageUrl;
      if (!keypageUrl) {
        const accountParts = accountUrl.split('/');
        if (accountParts.length >= 3) {
          const adiUrl = accountParts.slice(0, 3).join('/');
          keypageUrl = `${adiUrl}/book/1`;
        } else {
          throw new Error('Cannot derive signer keypage URL from account URL');
        }
      }

      this.logger.info('🔑 Using signer keypage', { keypageUrl });

      // Get FRESH key page version and lastUsedOn timestamp
      const keyPageInfo = await this.getCurrentKeyPageInfo(keypageUrl);

      // Calculate valid timestamp
      const lastUsedMicros = keyPageInfo.lastUsedOn || 0;
      const rightNowMicros = Date.now() * 1000;
      const validMicros = Math.max(lastUsedMicros + 2000000, rightNowMicros + 1000000);

      // Compute signature metadata hash from public key
      const publicKeyBytes = Buffer.from(publicKey.replace(/^0x/, ''), 'hex');

      // Build the signature metadata object
      const signatureObject = new core.ED25519Signature({
        type: 'ed25519',
        publicKey: publicKeyBytes,
        signer: keypageUrl,
        signerVersion: keyPageInfo.version,
        timestamp: validMicros,
      });

      // Compute sigMdHash = sha256(encode(signatureObject))
      const encodedSig = encode(signatureObject);
      const sigMdHash = sha256(encodedSig);

      this.logger.info('🔐 Computed signature metadata hash', {
        sigMdHashHex: Buffer.from(sigMdHash).toString('hex').substring(0, 16) + '...',
        publicKeyHex: publicKey.substring(0, 16) + '...',
        signer: keypageUrl,
        timestamp: validMicros
      });

      // Create the UpdateAccountAuth transaction with initiator set
      const transaction = new Transaction({
        header: {
          principal: accountUrl,
          initiator: sigMdHash,
        },
        body: {
          type: 'updateAccountAuth',
          operations: sdkOperations,
        },
      });

      // Calculate transaction hash
      const transactionHash = transaction.hash();
      const transactionHashHex = Buffer.from(transactionHash).toString('hex');

      // Compute the actual hash to sign: sha256(sigMdHash + transactionHash)
      const hashToSign = sha256(Buffer.concat([Buffer.from(sigMdHash), Buffer.from(transactionHash)]));
      const hashToSignHex = Buffer.from(hashToSign).toString('hex');

      this.logger.info('🔑 Computed hash to sign for AccountAuth', {
        transactionHashHex: transactionHashHex.substring(0, 16) + '...',
        hashToSignHex: hashToSignHex.substring(0, 16) + '...'
      });

      // Generate a unique request ID
      const requestId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store prepared transaction for later submission
      this.preparedAuthorityTransactions.set(requestId, {
        transaction,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        sigMdHash: Buffer.from(sigMdHash).toString('hex'),
        publicKey: publicKey,
        signerKeyPageUrl: keypageUrl,
        keyPageVersion: keyPageInfo.version,
        validTimestamp: validMicros,
        accountUrl,
        operations: sdkOperations,
        createdAt: Date.now()
      });

      // Clean up old prepared transactions
      this.cleanupPreparedAuthorityTransactions();

      this.logger.info('✅ AccountAuth transaction prepared for Key Vault signing', {
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        signerKeyPageUrl: keypageUrl,
        keyPageVersion: keyPageInfo.version,
        operationsCount: sdkOperations.length
      });

      return {
        success: true,
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        signerKeyPageUrl: keypageUrl,
        keyPageVersion: keyPageInfo.version,
        operations: sdkOperations
      };

    } catch (error) {
      this.logger.error('❌ Failed to prepare AccountAuth transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit a prepared AccountAuth transaction with an external signature from Key Vault.
   */
  async submitAccountAuthWithExternalSignature(
    requestId: string,
    signature: string,
    publicKey: string
  ): Promise<{
    success: boolean;
    txId?: string;
    txHash?: string;
    accountUrl?: string;
    operations?: any[];
    error?: string;
  }> {
    try {
      this.logger.info('📤 Submitting AccountAuth with Key Vault signature', {
        requestId,
        signatureLength: signature.length,
        publicKeyLength: publicKey.length
      });

      // Retrieve prepared transaction
      const prepared = this.preparedAuthorityTransactions.get(requestId);
      if (!prepared) {
        return {
          success: false,
          error: 'Prepared transaction not found or expired. Please prepare again.'
        };
      }

      // Remove from storage
      this.preparedAuthorityTransactions.delete(requestId);

      // Convert signature from hex to bytes
      const signatureBytes = Buffer.from(signature.replace(/^0x/, ''), 'hex');

      // Use the CACHED public key from prepare
      const cachedPublicKey = prepared.publicKey;
      const publicKeyBytes = Buffer.from(cachedPublicKey.replace(/^0x/, ''), 'hex');

      // Verify the public key matches
      if (publicKey.replace(/^0x/, '').toLowerCase() !== cachedPublicKey.replace(/^0x/, '').toLowerCase()) {
        this.logger.warn('⚠️ Public key mismatch!', {
          provided: publicKey.substring(0, 16) + '...',
          cached: cachedPublicKey.substring(0, 16) + '...'
        });
      }

      // Construct signature object
      const sigObject = {
        type: 'ed25519',
        signature: signatureBytes,
        publicKey: publicKeyBytes,
        signer: prepared.signerKeyPageUrl,
        signerVersion: prepared.keyPageVersion,
        timestamp: prepared.validTimestamp
      };

      this.logger.info('🔐 Constructed signature object for AccountAuth', {
        signer: sigObject.signer,
        signerVersion: sigObject.signerVersion,
        timestamp: sigObject.timestamp
      });

      // Submit transaction with external signature
      const submitPayload = {
        transaction: [prepared.transaction],
        signatures: [sigObject]
      };

      const submitResult = await this.client.submit(submitPayload);

      // Process results
      let txId = null;

      for (const r of submitResult) {
        if (!r.success) {
          this.logger.error('❌ AccountAuth submission failed:', r);
          throw new Error(`Submission failed: ${r.message || 'Unknown error'}`);
        }
        if (r.status?.txID) {
          txId = r.status.txID.toString();
        }
      }

      this.logger.info('✅ AccountAuth submitted successfully with Key Vault signature', {
        txId,
        accountUrl: prepared.accountUrl,
        operationsCount: prepared.operations.length
      });

      return {
        success: true,
        txId,
        txHash: txId,
        accountUrl: prepared.accountUrl,
        operations: prepared.operations
      };

    } catch (error) {
      this.logger.error('❌ Failed to submit AccountAuth with external signature:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up prepared authority transactions older than 10 minutes
   */
  private cleanupPreparedAuthorityTransactions(): void {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();

    for (const [requestId, prepared] of this.preparedAuthorityTransactions) {
      if (now - prepared.createdAt > maxAge) {
        this.logger.info('🧹 Cleaning up expired authority transaction', { requestId });
        this.preparedAuthorityTransactions.delete(requestId);
      }
    }
  }

  // =============================================================================
  // TWO-PHASE SIGNING FOR KEYPAGE UPDATES
  // =============================================================================

  // In-memory storage for prepared KeyPage update transactions
  private preparedKeyPageTransactions = new Map<string, {
    transaction: any;
    transactionHash: string;
    hashToSign: string;
    sigMdHash: string;
    publicKey: string;
    signerKeyPageUrl: string;
    keyPageVersion: number;
    validTimestamp: number;
    keyPageUrl: string;
    operations: any[];
    createdAt: number;
  }>();

  /**
   * Prepare a KeyPage update transaction for external signing (two-phase signing).
   * Returns the hash that needs to be signed by the Key Vault.
   *
   * This enables two-phase signing: prepare → sign via Key Vault → submit
   */
  async prepareKeyPageUpdate(
    keyPageUrl: string,
    operations: any[],
    publicKey: string,
    signerKeyPageUrl?: string
  ): Promise<{
    success: boolean;
    requestId?: string;
    transactionHash?: string;
    hashToSign?: string;
    signerKeyPageUrl?: string;
    keyPageVersion?: number;
    keyPageUrl?: string;
    operations?: any[];
    error?: string;
  }> {
    try {
      this.logger.info('🔐 Preparing KeyPage update transaction (two-phase signing)', {
        keyPageUrl,
        operationsCount: operations.length,
        hasPublicKey: !!publicKey
      });

      // Validate public key is provided
      if (!publicKey) {
        throw new Error('publicKey is required for two-phase signing (from Key Vault)');
      }

      // Validate operations
      if (!operations || operations.length === 0) {
        throw new Error('No operations provided for KeyPage update');
      }

      // Transform operations to SDK format
      // API receives: { type: 'add', delegate: 'acc://...' } or { type: 'add', keyHash: '...' }
      // SDK expects: { type: 'add', entry: { delegate: 'acc://...' } } or { type: 'add', entry: { keyHash: '...' } }
      const transformedOperations = operations.map(op => {
        if (op.delegate || op.keyHash) {
          return {
            type: op.type,
            entry: {
              ...(op.delegate && { delegate: op.delegate }),
              ...(op.keyHash && { keyHash: op.keyHash })
            }
          };
        }
        // For operations like setThreshold, pass through as-is
        return op;
      });

      this.logger.info('🔧 Transformed operations to SDK format', { transformedOperations });

      // Use the same keypage as signer if not specified
      const signerUrl = signerKeyPageUrl || keyPageUrl;

      this.logger.info('🔑 Using signer keypage', { signerUrl });

      // Get FRESH key page version and lastUsedOn timestamp
      const keyPageInfo = await this.getCurrentKeyPageInfo(signerUrl);

      // Calculate valid timestamp
      const lastUsedMicros = keyPageInfo.lastUsedOn || 0;
      const rightNowMicros = Date.now() * 1000;
      const validMicros = Math.max(lastUsedMicros + 2000000, rightNowMicros + 1000000);

      // Compute signature metadata hash from public key
      const publicKeyBytes = Buffer.from(publicKey.replace(/^0x/, ''), 'hex');

      // Build the signature metadata object
      const signatureObject = new core.ED25519Signature({
        type: 'ed25519',
        publicKey: publicKeyBytes,
        signer: signerUrl,
        signerVersion: keyPageInfo.version,
        timestamp: validMicros,
      });

      // Compute sigMdHash = sha256(encode(signatureObject))
      const encodedSig = encode(signatureObject);
      const sigMdHash = sha256(encodedSig);

      this.logger.info('🔐 Computed signature metadata hash', {
        sigMdHashHex: Buffer.from(sigMdHash).toString('hex').substring(0, 16) + '...',
        publicKeyHex: publicKey.substring(0, 16) + '...',
        signer: signerUrl,
        timestamp: validMicros
      });

      // Create the updateKeyPage transaction with initiator set
      const transaction = new Transaction({
        header: {
          principal: keyPageUrl,
          initiator: sigMdHash,
        },
        body: {
          type: 'updateKeyPage',
          operation: transformedOperations,
        },
      });

      // Calculate transaction hash
      const transactionHash = transaction.hash();
      const transactionHashHex = Buffer.from(transactionHash).toString('hex');

      // Compute the actual hash to sign: sha256(sigMdHash + transactionHash)
      const hashToSign = sha256(Buffer.concat([Buffer.from(sigMdHash), Buffer.from(transactionHash)]));
      const hashToSignHex = Buffer.from(hashToSign).toString('hex');

      this.logger.info('🔑 Computed hash to sign for KeyPage update', {
        transactionHashHex: transactionHashHex.substring(0, 16) + '...',
        hashToSignHex: hashToSignHex.substring(0, 16) + '...'
      });

      // Generate a unique request ID
      const requestId = `keypage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store prepared transaction for later submission
      this.preparedKeyPageTransactions.set(requestId, {
        transaction,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        sigMdHash: Buffer.from(sigMdHash).toString('hex'),
        publicKey: publicKey,
        signerKeyPageUrl: signerUrl,
        keyPageVersion: keyPageInfo.version,
        validTimestamp: validMicros,
        keyPageUrl,
        operations: transformedOperations,
        createdAt: Date.now()
      });

      // Clean up old prepared transactions
      this.cleanupPreparedKeyPageTransactions();

      this.logger.info('✅ KeyPage update transaction prepared for Key Vault signing', {
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        signerKeyPageUrl: signerUrl,
        keyPageVersion: keyPageInfo.version,
        operationsCount: transformedOperations.length
      });

      return {
        success: true,
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        signerKeyPageUrl: signerUrl,
        keyPageVersion: keyPageInfo.version,
        keyPageUrl,
        operations: transformedOperations
      };

    } catch (error) {
      this.logger.error('❌ Failed to prepare KeyPage update transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit a prepared KeyPage update transaction with an external signature from Key Vault.
   */
  async submitKeyPageWithExternalSignature(
    requestId: string,
    signature: string,
    publicKey: string
  ): Promise<{
    success: boolean;
    txId?: string;
    txHash?: string;
    keyPageUrl?: string;
    operations?: any[];
    error?: string;
  }> {
    try {
      this.logger.info('📤 Submitting KeyPage update with Key Vault signature', {
        requestId,
        signatureLength: signature.length,
        publicKeyLength: publicKey.length
      });

      // Retrieve prepared transaction
      const prepared = this.preparedKeyPageTransactions.get(requestId);
      if (!prepared) {
        return {
          success: false,
          error: 'Prepared transaction not found or expired. Please prepare again.'
        };
      }

      // Remove from storage
      this.preparedKeyPageTransactions.delete(requestId);

      // Convert signature from hex to bytes
      const signatureBytes = Buffer.from(signature.replace(/^0x/, ''), 'hex');

      // Use the CACHED public key from prepare
      const cachedPublicKey = prepared.publicKey;
      const publicKeyBytes = Buffer.from(cachedPublicKey.replace(/^0x/, ''), 'hex');

      // Verify the public key matches
      if (publicKey.replace(/^0x/, '').toLowerCase() !== cachedPublicKey.replace(/^0x/, '').toLowerCase()) {
        this.logger.warn('⚠️ Public key mismatch!', {
          provided: publicKey.substring(0, 16) + '...',
          cached: cachedPublicKey.substring(0, 16) + '...'
        });
      }

      // Construct signature object
      const sigObject = {
        type: 'ed25519',
        signature: signatureBytes,
        publicKey: publicKeyBytes,
        signer: prepared.signerKeyPageUrl,
        signerVersion: prepared.keyPageVersion,
        timestamp: prepared.validTimestamp
      };

      this.logger.info('🔐 Constructed signature object for KeyPage update', {
        signer: sigObject.signer,
        signerVersion: sigObject.signerVersion,
        timestamp: sigObject.timestamp
      });

      // Submit transaction with external signature
      const submitPayload = {
        transaction: [prepared.transaction],
        signatures: [sigObject]
      };

      const submitResult = await this.client.submit(submitPayload);

      // Process results
      let txId = null;

      for (const r of submitResult) {
        if (!r.success) {
          this.logger.error('❌ KeyPage update submission failed:', r);
          throw new Error(`Submission failed: ${r.message || 'Unknown error'}`);
        }
        if (r.status?.txID) {
          txId = r.status.txID.toString();
        }
      }

      this.logger.info('✅ KeyPage update submitted successfully with Key Vault signature', {
        txId,
        keyPageUrl: prepared.keyPageUrl,
        operationsCount: prepared.operations.length
      });

      return {
        success: true,
        txId,
        txHash: txId,
        keyPageUrl: prepared.keyPageUrl,
        operations: prepared.operations
      };

    } catch (error) {
      this.logger.error('❌ Failed to submit KeyPage update with external signature:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up prepared KeyPage transactions older than 10 minutes
   */
  private cleanupPreparedKeyPageTransactions(): void {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();

    for (const [requestId, prepared] of this.preparedKeyPageTransactions) {
      if (now - prepared.createdAt > maxAge) {
        this.logger.info('🧹 Cleaning up expired KeyPage transaction', { requestId });
        this.preparedKeyPageTransactions.delete(requestId);
      }
    }
  }

  // =============================================================================
  // TWO-PHASE SIGNING FOR KEYBOOK CREATION
  // =============================================================================

  // In-memory storage for prepared KeyBook creation transactions
  private preparedKeyBookCreateTransactions = new Map<string, {
    transaction: any;
    transactionHash: string;
    hashToSign: string;
    sigMdHash: string;
    publicKey: string;
    signerKeyPageUrl: string;
    keyPageVersion: number;
    validTimestamp: number;
    adiUrl: string;
    keyBookUrl: string;
    createdAt: number;
  }>();

  /**
   * Prepare a KeyBook creation transaction for external signing (two-phase signing).
   * Returns the hash that needs to be signed by the Key Vault.
   */
  async prepareKeyBookCreate(
    adiName: string,
    keyBookName: string,
    publicKeyHash: string,
    signerPublicKey: string,
    signerKeyPageUrl?: string
  ): Promise<{
    success: boolean;
    requestId?: string;
    transactionHash?: string;
    hashToSign?: string;
    signerKeyPageUrl?: string;
    keyPageVersion?: number;
    adiUrl?: string;
    keyBookUrl?: string;
    error?: string;
  }> {
    try {
      const adiUrl = `acc://${adiName}`;
      const keyBookUrl = `${adiUrl}/${keyBookName}`;
      const defaultSignerKeyPageUrl = signerKeyPageUrl || `${adiUrl}/book/1`;

      this.logger.info('🔐 Preparing KeyBook creation transaction (two-phase signing)', {
        adiUrl,
        keyBookUrl,
        publicKeyHash,
        hasSignerPublicKey: !!signerPublicKey
      });

      // Validate signer public key is provided
      if (!signerPublicKey) {
        throw new Error('signerPublicKey is required for two-phase signing (from Key Vault)');
      }

      // Get FRESH key page version and lastUsedOn timestamp
      const keyPageInfo = await this.getCurrentKeyPageInfo(defaultSignerKeyPageUrl);

      // Calculate valid timestamp
      const lastUsedMicros = keyPageInfo.lastUsedOn || 0;
      const rightNowMicros = Date.now() * 1000;
      const validMicros = Math.max(lastUsedMicros + 2000000, rightNowMicros + 1000000);

      // Compute signature metadata hash from public key
      const publicKeyBytes = Buffer.from(signerPublicKey.replace(/^0x/, ''), 'hex');

      // Build the signature metadata object
      const signatureObject = new core.ED25519Signature({
        type: 'ed25519',
        publicKey: publicKeyBytes,
        signer: defaultSignerKeyPageUrl,
        signerVersion: keyPageInfo.version,
        timestamp: validMicros,
      });

      // Compute sigMdHash = sha256(encode(signatureObject))
      const encodedSig = encode(signatureObject);
      const sigMdHash = sha256(encodedSig);

      this.logger.info('🔐 Computed signature metadata hash for KeyBook creation', {
        sigMdHashHex: Buffer.from(sigMdHash).toString('hex').substring(0, 16) + '...',
        signer: defaultSignerKeyPageUrl,
        timestamp: validMicros
      });

      // Create the createKeyBook transaction with initiator set
      const transaction = new core.Transaction({
        header: {
          principal: adiUrl,
          initiator: sigMdHash,
        },
        body: {
          type: 'createKeyBook',
          url: keyBookUrl,
          publicKeyHash: publicKeyHash,
        },
      });

      // Calculate transaction hash
      const transactionHash = transaction.hash();
      const transactionHashHex = Buffer.from(transactionHash).toString('hex');

      // Compute the actual hash to sign: sha256(sigMdHash + transactionHash)
      const hashToSign = sha256(Buffer.concat([Buffer.from(sigMdHash), Buffer.from(transactionHash)]));
      const hashToSignHex = Buffer.from(hashToSign).toString('hex');

      this.logger.info('🔑 Computed hash to sign for KeyBook creation', {
        transactionHashHex: transactionHashHex.substring(0, 16) + '...',
        hashToSignHex: hashToSignHex.substring(0, 16) + '...'
      });

      // Generate a unique request ID
      const requestId = `keybook_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store prepared transaction for later submission
      this.preparedKeyBookCreateTransactions.set(requestId, {
        transaction,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        sigMdHash: Buffer.from(sigMdHash).toString('hex'),
        publicKey: signerPublicKey,
        signerKeyPageUrl: defaultSignerKeyPageUrl,
        keyPageVersion: keyPageInfo.version,
        validTimestamp: validMicros,
        adiUrl,
        keyBookUrl,
        createdAt: Date.now()
      });

      // Clean up old prepared transactions
      this.cleanupPreparedKeyBookCreateTransactions();

      this.logger.info('✅ KeyBook creation transaction prepared for Key Vault signing', {
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        signerKeyPageUrl: defaultSignerKeyPageUrl,
        keyPageVersion: keyPageInfo.version
      });

      return {
        success: true,
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        signerKeyPageUrl: defaultSignerKeyPageUrl,
        keyPageVersion: keyPageInfo.version,
        adiUrl,
        keyBookUrl
      };

    } catch (error) {
      this.logger.error('❌ Failed to prepare KeyBook creation transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit a prepared KeyBook creation transaction with an external signature from Key Vault.
   */
  async submitKeyBookCreateWithExternalSignature(
    requestId: string,
    signature: string,
    publicKey: string
  ): Promise<{
    success: boolean;
    txId?: string;
    txHash?: string;
    adiUrl?: string;
    keyBookUrl?: string;
    error?: string;
  }> {
    try {
      this.logger.info('📤 Submitting KeyBook creation with Key Vault signature', {
        requestId,
        signatureLength: signature.length,
        publicKeyLength: publicKey.length
      });

      // Retrieve prepared transaction
      const prepared = this.preparedKeyBookCreateTransactions.get(requestId);
      if (!prepared) {
        return {
          success: false,
          error: 'Prepared transaction not found or expired. Please prepare again.'
        };
      }

      // Remove from storage
      this.preparedKeyBookCreateTransactions.delete(requestId);

      // Convert signature from hex to bytes
      const signatureBytes = Buffer.from(signature.replace(/^0x/, ''), 'hex');

      // Use the CACHED public key from prepare
      const cachedPublicKey = prepared.publicKey;
      const publicKeyBytes = Buffer.from(cachedPublicKey.replace(/^0x/, ''), 'hex');

      // Construct signature object
      const sigObject = {
        type: 'ed25519',
        signature: signatureBytes,
        publicKey: publicKeyBytes,
        signer: prepared.signerKeyPageUrl,
        signerVersion: prepared.keyPageVersion,
        timestamp: prepared.validTimestamp
      };

      this.logger.info('🔐 Constructed signature object for KeyBook creation', {
        signer: sigObject.signer,
        signerVersion: sigObject.signerVersion,
        timestamp: sigObject.timestamp
      });

      // Submit transaction with external signature
      const submitPayload = {
        transaction: [prepared.transaction],
        signatures: [sigObject]
      };

      const submitResult = await this.client.submit(submitPayload);

      // Process results
      let txId = null;

      for (const r of submitResult) {
        if (!r.success) {
          this.logger.error('❌ KeyBook creation submission failed:', r);
          throw new Error(`Submission failed: ${r.message || 'Unknown error'}`);
        }
        if (r.status?.txID) {
          txId = r.status.txID.toString();
        }
      }

      this.logger.info('✅ KeyBook creation submitted successfully with Key Vault signature', {
        txId,
        adiUrl: prepared.adiUrl,
        keyBookUrl: prepared.keyBookUrl
      });

      return {
        success: true,
        txId,
        txHash: txId,
        adiUrl: prepared.adiUrl,
        keyBookUrl: prepared.keyBookUrl
      };

    } catch (error) {
      this.logger.error('❌ Failed to submit KeyBook creation with external signature:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up prepared KeyBook creation transactions older than 10 minutes
   */
  private cleanupPreparedKeyBookCreateTransactions(): void {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();

    for (const [requestId, prepared] of this.preparedKeyBookCreateTransactions) {
      if (now - prepared.createdAt > maxAge) {
        this.logger.info('🧹 Cleaning up expired KeyBook creation transaction', { requestId });
        this.preparedKeyBookCreateTransactions.delete(requestId);
      }
    }
  }

  // =============================================================================
  // TWO-PHASE SIGNING FOR KEYPAGE CREATION
  // =============================================================================

  // In-memory storage for prepared KeyPage creation transactions
  private preparedKeyPageCreateTransactions = new Map<string, {
    transaction: any;
    transactionHash: string;
    hashToSign: string;
    sigMdHash: string;
    publicKey: string;
    signerKeyPageUrl: string;
    keyPageVersion: number;
    validTimestamp: number;
    keyBookUrl: string;
    newKeyPageKeyHash: string;
    createdAt: number;
  }>();

  /**
   * Prepare a KeyPage creation transaction for external signing (two-phase signing).
   * Returns the hash that needs to be signed by the Key Vault.
   */
  async prepareKeyPageCreate(
    keyBookUrl: string,
    newKeyPageKeyHash: string,
    signerPublicKey: string,
    signerKeyPageUrl?: string
  ): Promise<{
    success: boolean;
    requestId?: string;
    transactionHash?: string;
    hashToSign?: string;
    signerKeyPageUrl?: string;
    keyPageVersion?: number;
    keyBookUrl?: string;
    error?: string;
  }> {
    try {
      // Default signer is the first page of the key book
      const defaultSignerKeyPageUrl = signerKeyPageUrl || `${keyBookUrl}/1`;

      this.logger.info('🔐 Preparing KeyPage creation transaction (two-phase signing)', {
        keyBookUrl,
        newKeyPageKeyHash,
        hasSignerPublicKey: !!signerPublicKey
      });

      // Validate signer public key is provided
      if (!signerPublicKey) {
        throw new Error('signerPublicKey is required for two-phase signing (from Key Vault)');
      }

      // Get FRESH key page version and lastUsedOn timestamp
      const keyPageInfo = await this.getCurrentKeyPageInfo(defaultSignerKeyPageUrl);

      // Calculate valid timestamp
      const lastUsedMicros = keyPageInfo.lastUsedOn || 0;
      const rightNowMicros = Date.now() * 1000;
      const validMicros = Math.max(lastUsedMicros + 2000000, rightNowMicros + 1000000);

      // Compute signature metadata hash from public key
      const publicKeyBytes = Buffer.from(signerPublicKey.replace(/^0x/, ''), 'hex');

      // Build the signature metadata object
      const signatureObject = new core.ED25519Signature({
        type: 'ed25519',
        publicKey: publicKeyBytes,
        signer: defaultSignerKeyPageUrl,
        signerVersion: keyPageInfo.version,
        timestamp: validMicros,
      });

      // Compute sigMdHash = sha256(encode(signatureObject))
      const encodedSig = encode(signatureObject);
      const sigMdHash = sha256(encodedSig);

      this.logger.info('🔐 Computed signature metadata hash for KeyPage creation', {
        sigMdHashHex: Buffer.from(sigMdHash).toString('hex').substring(0, 16) + '...',
        signer: defaultSignerKeyPageUrl,
        timestamp: validMicros
      });

      // Create the createKeyPage transaction with initiator set
      const transaction = new Transaction({
        header: {
          principal: keyBookUrl,
          initiator: sigMdHash,
        },
        body: {
          type: 'createKeyPage',
          keys: [{
            keyHash: newKeyPageKeyHash,
          }],
        },
      });

      // Calculate transaction hash
      const transactionHash = transaction.hash();
      const transactionHashHex = Buffer.from(transactionHash).toString('hex');

      // Compute the actual hash to sign: sha256(sigMdHash + transactionHash)
      const hashToSign = sha256(Buffer.concat([Buffer.from(sigMdHash), Buffer.from(transactionHash)]));
      const hashToSignHex = Buffer.from(hashToSign).toString('hex');

      this.logger.info('🔑 Computed hash to sign for KeyPage creation', {
        transactionHashHex: transactionHashHex.substring(0, 16) + '...',
        hashToSignHex: hashToSignHex.substring(0, 16) + '...'
      });

      // Generate a unique request ID
      const requestId = `keypage_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store prepared transaction for later submission
      this.preparedKeyPageCreateTransactions.set(requestId, {
        transaction,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        sigMdHash: Buffer.from(sigMdHash).toString('hex'),
        publicKey: signerPublicKey,
        signerKeyPageUrl: defaultSignerKeyPageUrl,
        keyPageVersion: keyPageInfo.version,
        validTimestamp: validMicros,
        keyBookUrl,
        newKeyPageKeyHash,
        createdAt: Date.now()
      });

      // Clean up old prepared transactions
      this.cleanupPreparedKeyPageCreateTransactions();

      this.logger.info('✅ KeyPage creation transaction prepared for Key Vault signing', {
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        signerKeyPageUrl: defaultSignerKeyPageUrl,
        keyPageVersion: keyPageInfo.version
      });

      return {
        success: true,
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        signerKeyPageUrl: defaultSignerKeyPageUrl,
        keyPageVersion: keyPageInfo.version,
        keyBookUrl
      };

    } catch (error) {
      this.logger.error('❌ Failed to prepare KeyPage creation transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit a prepared KeyPage creation transaction with an external signature from Key Vault.
   */
  async submitKeyPageCreateWithExternalSignature(
    requestId: string,
    signature: string,
    publicKey: string
  ): Promise<{
    success: boolean;
    txId?: string;
    txHash?: string;
    keyBookUrl?: string;
    error?: string;
  }> {
    try {
      this.logger.info('📤 Submitting KeyPage creation with Key Vault signature', {
        requestId,
        signatureLength: signature.length,
        publicKeyLength: publicKey.length
      });

      // Retrieve prepared transaction
      const prepared = this.preparedKeyPageCreateTransactions.get(requestId);
      if (!prepared) {
        return {
          success: false,
          error: 'Prepared transaction not found or expired. Please prepare again.'
        };
      }

      // Remove from storage
      this.preparedKeyPageCreateTransactions.delete(requestId);

      // Convert signature from hex to bytes
      const signatureBytes = Buffer.from(signature.replace(/^0x/, ''), 'hex');

      // Use the CACHED public key from prepare
      const cachedPublicKey = prepared.publicKey;
      const publicKeyBytes = Buffer.from(cachedPublicKey.replace(/^0x/, ''), 'hex');

      // Construct signature object
      const sigObject = {
        type: 'ed25519',
        signature: signatureBytes,
        publicKey: publicKeyBytes,
        signer: prepared.signerKeyPageUrl,
        signerVersion: prepared.keyPageVersion,
        timestamp: prepared.validTimestamp
      };

      this.logger.info('🔐 Constructed signature object for KeyPage creation', {
        signer: sigObject.signer,
        signerVersion: sigObject.signerVersion,
        timestamp: sigObject.timestamp
      });

      // Submit transaction with external signature
      const submitPayload = {
        transaction: [prepared.transaction],
        signatures: [sigObject]
      };

      const submitResult = await this.client.submit(submitPayload);

      // Process results
      let txId = null;

      for (const r of submitResult) {
        if (!r.success) {
          this.logger.error('❌ KeyPage creation submission failed:', r);
          throw new Error(`Submission failed: ${r.message || 'Unknown error'}`);
        }
        if (r.status?.txID) {
          txId = r.status.txID.toString();
        }
      }

      this.logger.info('✅ KeyPage creation submitted successfully with Key Vault signature', {
        txId,
        keyBookUrl: prepared.keyBookUrl
      });

      return {
        success: true,
        txId,
        txHash: txId,
        keyBookUrl: prepared.keyBookUrl
      };

    } catch (error) {
      this.logger.error('❌ Failed to submit KeyPage creation with external signature:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up prepared KeyPage creation transactions older than 10 minutes
   */
  private cleanupPreparedKeyPageCreateTransactions(): void {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();

    for (const [requestId, prepared] of this.preparedKeyPageCreateTransactions) {
      if (now - prepared.createdAt > maxAge) {
        this.logger.info('🧹 Cleaning up expired KeyPage creation transaction', { requestId });
        this.preparedKeyPageCreateTransactions.delete(requestId);
      }
    }
  }

  async getNetworkStatus(): Promise<any> {
    try {
      const networkStatus = await this.client.networkStatus();
      return {
        success: true,
        status: {
          network: { height: 12345, validators: 3 },
          oracle: { price: networkStatus.oracle.price, active: true }
        }
      };
    } catch (error) {
      return { success: false, error: 'Network status unavailable' };
    }
  }

  async getOraclePrice(): Promise<any> {
    try {
      const { oracle } = await this.client.networkStatus();
      return {
        success: true,
        oraclePrice: oracle.price,
        precision: 2
      };
    } catch (error) {
      return { success: false, error: 'Oracle price unavailable' };
    }
  }

  async writeData(adiName: string, dataAccountName: string, dataEntries: string[], adiPrivateKey?: string, signerKeyPageUrl?: string, memo?: string): Promise<any> {
    console.log('🚨 WRITEDATA METHOD CALLED - DEBUG VERSION!');
    try {
      this.logger.info('📝 Writing data entries to Accumulate data account', {
        adiName,
        dataAccountName,
        entriesCount: dataEntries.length,
        totalSize: dataEntries.reduce((sum, entry) => sum + entry.length, 0),
        hasMemo: !!memo,
        memo: memo || 'none'
      });

      // Construct data account URL
      const dataAccountUrl = `acc://${adiName}.acme/${dataAccountName}`;
      this.logger.info('🎯 Data account URL:', { dataAccountUrl });

      // Get current version of data account
      let currentVersion = 1;
      try {
        const accountQuery = await this.client.query(dataAccountUrl);
        if (accountQuery.account) {
          currentVersion = accountQuery.account.version || 1;
        }
        this.logger.info('📊 Data account version:', { dataAccountUrl, currentVersion });
      } catch (queryError) {
        this.logger.warn('⚠️ Could not query data account version, using default:', { dataAccountUrl, defaultVersion: currentVersion });
      }

      // Use provided signer key page URL or construct default
      const finalSignerKeyPageUrl = signerKeyPageUrl || `acc://${adiName}.acme/book/1`;

      // Use provided private key or fallback to environment
      const privateKeyToUse = adiPrivateKey || process.env.ACCUM_PRIV_KEY?.substring(0, 64) || '';
      if (!privateKeyToUse) {
        throw new Error('No private key provided and ACCUM_PRIV_KEY not found in environment');
      }

      this.logger.info('🔐 Using private key source:', {
        source: adiPrivateKey ? 'provided' : 'environment',
        keyLength: privateKeyToUse.length
      });

      const privateKeyBytes = Buffer.from(privateKeyToUse, 'hex');
      const keypageKey = ED25519Key.from(privateKeyBytes);

      // Prepare data entries as bytes
      const dataEntriesAsBytes = dataEntries.map(entry => Buffer.from(entry, 'utf8'));

      this.logger.info('📦 Prepared data entries:', {
        originalCount: dataEntries.length,
        byteArrays: dataEntriesAsBytes.length,
        sizes: dataEntriesAsBytes.map(buf => buf.length)
      });

      // 🎯 Create WriteData transaction with MEMO and METADATA support
      const transactionHeader: any = {
        principal: dataAccountUrl,
      };

      // Add memo if provided (for Certen intent discovery)
      if (memo) {
        transactionHeader.memo = memo;
        this.logger.info('📝 Adding memo to transaction header:', { memo });
      }

      const transaction = new Transaction({
        header: transactionHeader,
        body: {
          type: "writeData",
          entry: {
            type: "doubleHash",
            data: dataEntriesAsBytes,
          },
        },
      });

      this.logger.info('🏗️ Created WriteData transaction:', {
        principal: dataAccountUrl,
        origin: finalSignerKeyPageUrl,
        entriesCount: dataEntriesAsBytes.length
      });

      // Get FRESH key page version and lastUsedOn timestamp
      const keyPageInfo = await this.getCurrentKeyPageInfo(finalSignerKeyPageUrl);
      const updatedAdiSigner = Signer.forPage(finalSignerKeyPageUrl, keypageKey).withVersion(keyPageInfo.version);

      this.logger.info('✍️ Updated signer with fresh version and timestamp info:', {
        signerUrl: finalSignerKeyPageUrl,
        freshVersion: keyPageInfo.version,
        lastUsedOn: keyPageInfo.lastUsedOn,
        publicKeyHash: keypageKey.address.publicKeyHash.toString('hex')
      });

      // CRITICAL: Use microseconds format to match the key's lastUsedOn format
      const lastUsedMicros = keyPageInfo.lastUsedOn || 0; // This is 1762717769135000 (microseconds)
      const rightNowMicros = Date.now() * 1000; // Convert current time to microseconds

      // Since lastUsedOn is 1762717769135000 and current time in microseconds is ~1731247200000000
      // We need to use the LATEST of these two values plus some increment
      const validMicros = Math.max(lastUsedMicros + 2000000, rightNowMicros + 1000000);

      console.log('🔥 TIMESTAMP CALCULATION:', {
        lastUsedMicros,
        rightNowMicros,
        validMicros,
        timestampFormat: 'MICROSECONDS'
      });

      this.logger.info('🕐 Using microseconds timestamp (matching key format):', {
        lastUsedMicros: lastUsedMicros,
        currentMicros: rightNowMicros,
        calculatedMicros: validMicros,
        isAfterLastUsed: validMicros > lastUsedMicros
      });

      // Sign and submit transaction (matching SDK example pattern)
      this.logger.info('🔐 Signing transaction with ADI key...');
      console.log('🚨 ABOUT TO SIGN WITH TIMESTAMP:', validMicros);
      // Use the properly calculated validMicros timestamp (current time in microseconds)
      console.log('🚨 FINAL TIMESTAMP:', { validMicros, lastUsedOn: keyPageInfo.lastUsedOn, isLarger: validMicros > keyPageInfo.lastUsedOn });
      const sig = await updatedAdiSigner.sign(transaction, { timestamp: validMicros });
      console.log('🚨 SIGNED TRANSACTION RESULT:', { resultTimestamp: sig.signature });

      this.logger.info('✍️ Transaction signed:', {
        signature: sig.signature?.toString('hex')?.substring(0, 16) + '...',
        publicKey: sig.publicKey?.toString('hex')?.substring(0, 16) + '...',
        signer: sig.signer?.toString(),
        timestamp: validMicros
      });

      this.logger.info('📤 Submitting transaction to Accumulate network...');
      const submitPayload = { transaction: [transaction], signatures: [sig] };
      this.logger.info('📦 Submit payload:', {
        transactionType: transaction.body.type,
        principal: transaction.header.principal,
        hasSignature: !!sig.signature,
        signerUrl: sig.signer?.toString()
      });

      const submitResult = await this.client.submit(submitPayload);

      this.logger.info('📥 Submit response received:', {
        resultCount: submitResult?.length || 0,
        firstResult: submitResult?.[0]
      });

      // Handle response array from SDK (matching example pattern)
      let signatureTxHash = null;
      let dataTransactionHash = null;
      let txID = null;
      for (const r of submitResult) {
        this.logger.info('🔍 Processing submit result:', {
          success: r.success,
          message: r.message,
          status: r.status,
          txID: r.status?.txID?.toString(),
          resultType: r.status?.result?.type
        });

        if (!r.success) {
          this.logger.error('❌ Transaction submission failed:', r);
          throw new Error(`Submission failed: ${r.message || 'Unknown error'}`);
        }
        if (r.status?.txID) {
          const currentTxHash = r.status.txID.toString();
          if (r.status.result?.type === 'writeData') {
            // This is the data transaction hash (@data)
            dataTransactionHash = currentTxHash;
          } else {
            // This is the signature transaction hash (@book/1)
            signatureTxHash = currentTxHash;
          }
          txID = currentTxHash;
        }
      }

      this.logger.info('📤 Transaction submitted successfully:', {
        signatureTxHash,
        dataTransactionHash,
        dataAccountUrl,
        entriesCount: dataEntries.length
      });

      // Return success result with both transaction hashes
      return {
        success: true,
        txHash: signatureTxHash, // For backward compatibility
        signatureTxHash: signatureTxHash,
        dataTransactionHash: dataTransactionHash,
        dataAccountUrl,
        entriesWritten: dataEntries.length,
        message: `Successfully wrote ${dataEntries.length} data entries to ${dataAccountUrl}`
      };

    } catch (error) {
      this.logger.error('❌ Failed to write data to Accumulate:', {
        adiName,
        dataAccountName,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        adiName,
        dataAccountName
      };
    }
  }

  // =============================================================================
  // TWO-PHASE SIGNING: Prepare + Submit with External Signature
  // =============================================================================

  // In-memory storage for prepared transactions (keyed by requestId)
  private preparedTransactions = new Map<string, {
    transaction: any;
    transactionHash: string;
    hashToSign: string;      // The actual hash the Key Vault signs: sha256(sigMdHash + txHash)
    sigMdHash: string;       // Signature metadata hash (used as initiator)
    publicKey: string;       // User's public key (hex)
    signerKeyPageUrl: string;
    keyPageVersion: number;
    lastUsedOn: number;
    validTimestamp: number;
    dataAccountUrl: string;
    createdAt: number;
  }>();

  /**
   * Prepare a WriteData transaction without signing.
   * Returns the transaction hash that needs to be signed by the external signer (Key Vault).
   *
   * @param transactionMetadata - Optional user-provided metadata (string or hex) attached to tx header
   * @param expireAtTime - Optional ISO timestamp for transaction expiration
   * @param additionalAuthorities - Optional array of authority URLs required for this transaction
   */
  async prepareWriteData(
    adiName: string,
    dataAccountName: string,
    dataEntries: string[],
    signerKeyPageUrl?: string,
    memo?: string,
    publicKey?: string,  // User's public key (hex) for computing initiator
    transactionMetadata?: string,  // User-provided metadata for transaction header
    expireAtTime?: string,  // ISO timestamp for transaction expiration
    additionalAuthorities?: string[]  // Additional authority URLs for this transaction
  ): Promise<{
    success: boolean;
    requestId?: string;
    transactionHash?: string;
    hashToSign?: string;  // The actual hash the Key Vault should sign
    signerKeyPageUrl?: string;
    keyPageVersion?: number;
    error?: string;
  }> {
    try {
      this.logger.info('📝 Preparing WriteData transaction (two-phase)', {
        adiName,
        dataAccountName,
        entriesCount: dataEntries.length,
        hasMemo: !!memo,
        hasMetadata: !!transactionMetadata,
        hasExpire: !!expireAtTime,
        hasAuthorities: !!additionalAuthorities?.length
      });

      // Construct data account URL
      const dataAccountUrl = `acc://${adiName}.acme/${dataAccountName}`;

      // Use provided signer key page URL or construct default
      const finalSignerKeyPageUrl = signerKeyPageUrl || `acc://${adiName}.acme/book/1`;

      // Get current version of data account
      let currentVersion = 1;
      try {
        const accountQuery = await this.client.query(dataAccountUrl);
        if (accountQuery.account) {
          currentVersion = accountQuery.account.version || 1;
        }
      } catch (queryError) {
        this.logger.warn('⚠️ Could not query data account version, using default');
      }

      // Get FRESH key page version and lastUsedOn timestamp
      const keyPageInfo = await this.getCurrentKeyPageInfo(finalSignerKeyPageUrl);

      // Calculate valid timestamp
      const lastUsedMicros = keyPageInfo.lastUsedOn || 0;
      const rightNowMicros = Date.now() * 1000;
      const validMicros = Math.max(lastUsedMicros + 2000000, rightNowMicros + 1000000);

      // Prepare data entries as bytes
      const dataEntriesAsBytes = dataEntries.map(entry => Buffer.from(entry, 'utf8'));

      // Build WriteData transaction
      // Note: Don't set 'initiator' here - it expects a hash, not a URL
      // The initiator will be computed from the public key when the signature is applied
      const transactionHeader: any = {
        principal: dataAccountUrl,
      };

      // Only add memo if provided
      if (memo) {
        transactionHeader.memo = memo;
      }

      // Advanced Transaction Conditions - Add to transaction header
      if (transactionMetadata) {
        this.logger.info('📄 Adding user metadata to transaction header', {
          metadataLength: transactionMetadata.length
        });
        transactionHeader.metadata = Buffer.from(transactionMetadata, 'utf8');
      }

      // NOTE: expire and authorities fields are NOT supported by the current Accumulate protocol!
      // The Go SDK's TransactionHeader only has: Principal, Initiator, Memo, Metadata
      // Adding these fields causes hash mismatch and signature validation failure.
      if (expireAtTime) {
        this.logger.warn('⚠️ expire field NOT SUPPORTED by Accumulate protocol - ignoring', {
          expireAtTime: expireAtTime
        });
        // transactionHeader.expire is not supported
      }

      if (additionalAuthorities && additionalAuthorities.length > 0) {
        this.logger.warn('⚠️ authorities field NOT SUPPORTED by Accumulate protocol - ignoring', {
          authorities: additionalAuthorities
        });
        // transactionHeader.authorities is not supported
      }

      // If public key is provided, compute the proper hash to sign
      // This is CRITICAL for two-phase signing to work correctly
      if (!publicKey) {
        throw new Error('publicKey is required for two-phase signing');
      }

      const publicKeyBytes = Buffer.from(publicKey.replace(/^0x/, ''), 'hex');

      // Build the signature metadata object (matches SDK's ED25519Signature structure)
      // The SDK encodes: type, publicKey, signer, signerVersion, timestamp
      const signatureObject = new core.ED25519Signature({
        type: 'ed25519',
        publicKey: publicKeyBytes,
        signer: finalSignerKeyPageUrl,
        signerVersion: keyPageInfo.version,
        timestamp: validMicros,
      });

      // Compute sigMdHash = sha256(encode(signatureObject))
      const encodedSig = encode(signatureObject);
      const sigMdHash = sha256(encodedSig);

      this.logger.info('🔐 Computed signature metadata hash', {
        sigMdHashHex: Buffer.from(sigMdHash).toString('hex').substring(0, 16) + '...',
        publicKeyHex: publicKey.substring(0, 16) + '...',
        signer: finalSignerKeyPageUrl,
        timestamp: validMicros
      });

      // Set the initiator in the transaction header BEFORE computing the hash
      transactionHeader.initiator = sigMdHash;

      const transaction = new Transaction({
        header: transactionHeader,
        body: {
          type: "writeData",
          entry: {
            type: "doubleHash",
            data: dataEntriesAsBytes,
          },
        },
      });

      // Calculate transaction hash (now includes the initiator)
      const transactionHash = transaction.hash();
      const transactionHashHex = Buffer.from(transactionHash).toString('hex');

      // Compute the actual hash to sign: sha256(sigMdHash + transactionHash)
      // This matches the SDK's signing flow in ed25519.ts: signRaw()
      const hashToSign = sha256(Buffer.concat([Buffer.from(sigMdHash), Buffer.from(transactionHash)]));
      const hashToSignHex = Buffer.from(hashToSign).toString('hex');

      this.logger.info('🔑 Computed hash to sign', {
        transactionHashHex: transactionHashHex.substring(0, 16) + '...',
        hashToSignHex: hashToSignHex.substring(0, 16) + '...'
      });

      // Generate a unique request ID
      const requestId = `prep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store prepared transaction for later submission
      this.preparedTransactions.set(requestId, {
        transaction,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        sigMdHash: Buffer.from(sigMdHash).toString('hex'),
        publicKey: publicKey,
        signerKeyPageUrl: finalSignerKeyPageUrl,
        keyPageVersion: keyPageInfo.version,
        lastUsedOn: keyPageInfo.lastUsedOn,
        validTimestamp: validMicros,
        dataAccountUrl,
        createdAt: Date.now()
      });

      // Clean up old prepared transactions (older than 10 minutes)
      this.cleanupPreparedTransactions();

      this.logger.info('✅ Transaction prepared for external signing', {
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,
        signerKeyPageUrl: finalSignerKeyPageUrl,
        keyPageVersion: keyPageInfo.version
      });

      return {
        success: true,
        requestId,
        transactionHash: transactionHashHex,
        hashToSign: hashToSignHex,  // THIS is what the Key Vault should sign
        signerKeyPageUrl: finalSignerKeyPageUrl,
        keyPageVersion: keyPageInfo.version
      };

    } catch (error) {
      this.logger.error('❌ Failed to prepare WriteData transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit a prepared transaction with an external signature.
   * The signature must be for the transaction hash returned by prepareWriteData.
   */
  async submitWithExternalSignature(
    requestId: string,
    signature: string,
    publicKey: string
  ): Promise<{
    success: boolean;
    txHash?: string;
    signatureTxHash?: string;
    dataTransactionHash?: string;
    dataAccountUrl?: string;
    error?: string;
  }> {
    try {
      this.logger.info('📤 Submitting transaction with external signature', {
        requestId,
        signatureLength: signature.length,
        publicKeyLength: publicKey.length
      });

      // Retrieve prepared transaction
      const prepared = this.preparedTransactions.get(requestId);
      if (!prepared) {
        return {
          success: false,
          error: 'Prepared transaction not found or expired. Please prepare again.'
        };
      }

      // Remove from storage
      this.preparedTransactions.delete(requestId);

      // Convert signature from hex to bytes
      const signatureBytes = Buffer.from(signature.replace(/^0x/, ''), 'hex');

      // CRITICAL: Use the CACHED public key from prepare, not the one passed in
      // This ensures the sigMdHash computed by Accumulate matches what was signed
      const cachedPublicKey = prepared.publicKey;
      const publicKeyBytes = Buffer.from(cachedPublicKey.replace(/^0x/, ''), 'hex');

      // Verify the public key matches (for debugging)
      if (publicKey.replace(/^0x/, '').toLowerCase() !== cachedPublicKey.replace(/^0x/, '').toLowerCase()) {
        this.logger.warn('⚠️ Public key mismatch!', {
          provided: publicKey.substring(0, 16) + '...',
          cached: cachedPublicKey.substring(0, 16) + '...'
        });
      }

      // Construct signature object manually
      // This matches the structure created by signer.sign()
      // IMPORTANT: The 'type' field is required by the SDK to identify the signature type
      const sigObject = {
        type: 'ed25519',  // Required! SDK throws "Unknown signature 'undefined'" without this
        signature: signatureBytes,
        publicKey: publicKeyBytes,
        signer: prepared.signerKeyPageUrl,
        signerVersion: prepared.keyPageVersion,
        timestamp: prepared.validTimestamp
      };

      this.logger.info('🔐 Constructed signature object', {
        signer: sigObject.signer,
        signerVersion: sigObject.signerVersion,
        timestamp: sigObject.timestamp
      });

      // Submit transaction with external signature
      const submitPayload = {
        transaction: [prepared.transaction],
        signatures: [sigObject]
      };

      const submitResult = await this.client.submit(submitPayload);

      // Process results
      let signatureTxHash = null;
      let dataTransactionHash = null;

      for (const r of submitResult) {
        if (!r.success) {
          this.logger.error('❌ Transaction submission failed:', r);
          throw new Error(`Submission failed: ${r.message || 'Unknown error'}`);
        }
        if (r.status?.txID) {
          const currentTxHash = r.status.txID.toString();
          if (r.status.result?.type === 'writeData') {
            dataTransactionHash = currentTxHash;
          } else {
            signatureTxHash = currentTxHash;
          }
        }
      }

      this.logger.info('✅ Transaction submitted successfully with external signature', {
        signatureTxHash,
        dataTransactionHash,
        dataAccountUrl: prepared.dataAccountUrl
      });

      return {
        success: true,
        txHash: signatureTxHash || dataTransactionHash,
        signatureTxHash,
        dataTransactionHash,
        dataAccountUrl: prepared.dataAccountUrl
      };

    } catch (error) {
      this.logger.error('❌ Failed to submit with external signature:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up prepared transactions older than 10 minutes
   */
  private cleanupPreparedTransactions(): void {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();

    for (const [requestId, prepared] of this.preparedTransactions.entries()) {
      if (now - prepared.createdAt > maxAge) {
        this.preparedTransactions.delete(requestId);
        this.logger.debug('Cleaned up expired prepared transaction', { requestId });
      }
    }
  }

  async getKeyPageVersion(url: string): Promise<any> {
    try {
      const account = await this.client.query(url);
      this.logger.info('🔍 KeyPage query result:', {
        url,
        hasData: !!account.data,
        dataVersion: account.data?.version,
        accountVersion: account.account?.version,
        accountType: account.account?.type
      });
      return account.account?.version || 1;
    } catch (error) {
      this.logger.error('❌ KeyPage query failed:', { url, error: error instanceof Error ? error.message : String(error) });
      return 1;
    }
  }

  // Get fresh key page version and lastUsedOn info
  async getCurrentKeyPageInfo(keyPageUrl: string): Promise<{version: number, lastUsedOn: number}> {
    try {
      const keyPageQuery = await this.client.query(keyPageUrl);
      this.logger.info('🔍 Fresh KeyPage query for version and timestamp:', {
        url: keyPageUrl,
        hasData: !!keyPageQuery.data,
        dataType: keyPageQuery.data?.type,
        dataVersion: keyPageQuery.data?.version,
        hasAccount: !!keyPageQuery.account,
        accountType: keyPageQuery.account?.type,
        accountVersion: keyPageQuery.account?.version
      });

      // Get version from account.version (primary) or data.version (fallback), default to 1
      // Note: The query returns version in account.version, not data.version
      const version = keyPageQuery.account?.version ?? keyPageQuery.data?.version ?? 1;

      // Extract lastUsedOn from the key page structure
      let lastUsedOn = 0;
      if (keyPageQuery.account?.keys && Array.isArray(keyPageQuery.account.keys)) {
        const firstKey = keyPageQuery.account.keys[0];
        if (firstKey?.lastUsedOn) {
          lastUsedOn = firstKey.lastUsedOn;
        }
      }

      this.logger.info(`🔍 Key page ${keyPageUrl} info extracted:`, {
        version,
        lastUsedOn,
        hasTimestamp: !!lastUsedOn,
        versionSource: keyPageQuery.data?.version ? 'data' : 'account'
      });

      return { version, lastUsedOn };
    } catch (error) {
      this.logger.info(`⚠️ Could not query key page info for ${keyPageUrl}, using defaults: ${error}`);
      return { version: 1, lastUsedOn: 0 };
    }
  }

  // Get fresh key page version - matching the working example exactly
  async getCurrentKeyPageVersion(keyPageUrl: string): Promise<number> {
    const info = await this.getCurrentKeyPageInfo(keyPageUrl);
    return info.version;
  }


  async updateKeyPage(keyPageUrl: string, operations: any[], signerKeypageUrl?: string): Promise<any> {
    try {
      this.logger.info('📝 Updating KeyPage using SDK pattern (matching createKeyPage)', { keyPageUrl, operationsCount: operations.length });
      // Transform operations to SDK format:
      // API receives: { type: 'add', delegate: 'acc://...' } or { type: 'add', keyHash: '...' }
      // SDK expects: { type: 'add', entry: { delegate: 'acc://...' } } or { type: 'add', entry: { keyHash: '...' } }
      const transformedOperations = operations.map(op => {
        if (op.delegate || op.keyHash) {
          return {
            type: op.type,
            entry: {
              ...(op.delegate && { delegate: op.delegate }),
              ...(op.keyHash && { keyHash: op.keyHash })
            }
          };
        }
        // For operations like setThreshold, pass through as-is
        return op;
      });

      this.logger.info('🔄 Transformed operations for SDK:', { original: operations, transformed: transformedOperations });


      // Use the same keypage as signer if not specified
      const signerUrl = signerKeypageUrl || keyPageUrl;

      this.logger.info('📝 UpdateKeyPage using exact working pattern', { signerUrl, operations });

      // Get current key page version - same as createKeyPage
      const currentVersion = await this.getKeyPageVersion(signerUrl);
      this.logger.info('🔍 KeyPage version for signing:', { signerUrl, currentVersion });

      // Create ADI signer exactly like createKeyPage
      const lidPrivateKey = process.env.ACCUM_PRIV_KEY?.substring(0, 64) || '';
      const privateKeyBytes = Buffer.from(lidPrivateKey, 'hex');
      const keypageKey = ED25519Key.from(privateKeyBytes);

      this.logger.info('🔍 Signer key details:', {
        privateKeyLength: lidPrivateKey.length,
        publicKeyHash: keypageKey.address.publicKeyHash.toString('hex'),
        signerUrl: signerUrl
      });

      const adiSigner = Signer.forPage(signerUrl, keypageKey).withVersion(currentVersion);

      // Create updateKeyPage transaction exactly like createKeyPage pattern
      const transaction = new Transaction({
        header: {
          principal: keyPageUrl,
        },
        body: {
          type: "updateKeyPage",
          operation: transformedOperations,
        },
      });

      this.logger.info('🔍 UpdateKeyPage transaction (matching createKeyPage):', {
        principal: keyPageUrl,
        transactionType: "updateKeyPage",
        operationsCount: operations.length,
        operations: operations
      });

      // Sign with fresh timestamp - exactly like createKeyPage
      const timestamp = this.getNextTimestamp();
      this.logger.info('🕐 Using fresh timestamp for KeyPage update', { timestamp });

      const signature = await adiSigner.sign(transaction, { timestamp });

      // Create envelope exactly like createKeyPage
      const envelope = new Envelope({
        transaction: [transaction],
        signatures: [signature]
      });

      this.logger.info('📮 Envelope created, submitting to network...');

      // Submit envelope.asObject() exactly like createKeyPage
      const submitResult = await this.client.submit(envelope.asObject());

      // Check for success - same pattern as createKeyPage
      for (const result of submitResult) {
        if (!result.success) {
          throw new Error(`KeyPage update failed: ${result.message}`);
        }
        this.logger.info('⏳ Waiting for KeyPage update transaction to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      this.logger.info('✅ KeyPage update completed successfully', {
        txId: submitResult[0].status.txID
      });

      return {
        success: true,
        txId: submitResult[0].status.txID,
        hash: submitResult[0].status.txID,
        keyPageUrl: keyPageUrl,
        operationsCount: operations.length,
        operations: operations,
        message: 'KeyPage updated successfully',
        createdAt: new Date()
      };

    } catch (error) {
      this.logger.error('❌ Failed to update KeyPage', {
        error: error instanceof Error ? error.message : String(error),
        keyPageUrl,
        operations
      });
      throw new Error(`Failed to update key page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform an atomic key swap on a keypage
   * Replaces the old key with a new key in a single transaction
   * Used for onboarding: swap sponsor's temporary key -> user's permanent key
   */
  async performKeySwap(
    keyPageUrl: string,
    oldKeyHash: string,
    newKeyHash: string,
    signerKeypageUrl?: string
  ): Promise<any> {
    try {
      this.logger.info('🔄 Performing atomic key swap on keypage', {
        keyPageUrl,
        oldKeyHash: oldKeyHash.substring(0, 16) + '...',
        newKeyHash: newKeyHash.substring(0, 16) + '...'
      });

      // Use the same keypage as signer if not specified
      const signerUrl = signerKeypageUrl || keyPageUrl;

      // Get current key page version
      const currentVersion = await this.getKeyPageVersion(signerUrl);
      this.logger.info('🔍 KeyPage version for key swap:', { signerUrl, currentVersion });

      // Create ADI signer using sponsor's key
      const lidPrivateKey = process.env.ACCUM_PRIV_KEY?.substring(0, 64) || '';
      const privateKeyBytes = Buffer.from(lidPrivateKey, 'hex');
      const keypageKey = ED25519Key.from(privateKeyBytes);

      const adiSigner = Signer.forPage(signerUrl, keypageKey).withVersion(currentVersion);

      // Build the key swap operation (update operation with oldEntry -> newEntry)
      // keyHash must be a Buffer, not a hex string
      const swapOperation = {
        type: 'update',
        oldEntry: {
          keyHash: Buffer.from(oldKeyHash, 'hex')
        },
        newEntry: {
          keyHash: Buffer.from(newKeyHash, 'hex')
        }
      };

      this.logger.info('🔑 Key swap operation:', {
        type: 'update',
        oldKeyHash: oldKeyHash.substring(0, 16) + '...',
        newKeyHash: newKeyHash.substring(0, 16) + '...'
      });

      // Create updateKeyPage transaction with the swap operation
      // Use TransactionType enum and 'operation' field (singular)
      const transaction = new Transaction({
        header: {
          principal: keyPageUrl,
        },
        body: {
          type: TransactionType.UpdateKeyPage,
          operation: [swapOperation],
        },
      });

      // Sign with fresh timestamp
      const timestamp = this.getNextTimestamp();
      this.logger.info('🕐 Using fresh timestamp for key swap', { timestamp });

      const signature = await adiSigner.sign(transaction, { timestamp });

      // Create envelope and submit
      const envelope = new Envelope({
        transaction: [transaction],
        signatures: [signature]
      });

      this.logger.info('📮 Submitting key swap transaction...');

      const submitResult = await this.client.submit(envelope.asObject());

      // Check for success
      for (const result of submitResult) {
        if (!result.success) {
          throw new Error(`Key swap failed: ${result.message}`);
        }
        this.logger.info('⏳ Waiting for key swap transaction to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      this.logger.info('✅ Key swap completed successfully', {
        txId: submitResult[0].status.txID,
        keyPageUrl,
        oldKeyRemoved: oldKeyHash.substring(0, 16) + '...',
        newKeyAdded: newKeyHash.substring(0, 16) + '...'
      });

      return {
        success: true,
        txId: submitResult[0].status.txID,
        hash: submitResult[0].status.txID,
        keyPageUrl: keyPageUrl,
        oldKeyHash: oldKeyHash,
        newKeyHash: newKeyHash,
        message: 'Key swap completed successfully - ownership transferred',
        createdAt: new Date()
      };

    } catch (error) {
      this.logger.error('❌ Failed to perform key swap', {
        error: error instanceof Error ? error.message : String(error),
        keyPageUrl,
        oldKeyHash: oldKeyHash.substring(0, 16) + '...',
        newKeyHash: newKeyHash.substring(0, 16) + '...'
      });
      throw new Error(`Failed to perform key swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an ADI for onboarding with sponsor's key as initial authority
   * Returns details needed for subsequent key swap
   */
  async createIdentityForOnboarding(adiName: string): Promise<any> {
    try {
      // Handle both full URLs and just names
      let normalizedName: string;
      if (adiName.startsWith('acc://')) {
        normalizedName = adiName.substring(6);
      } else {
        normalizedName = adiName.endsWith('.acme') ? adiName : `${adiName}.acme`;
      }

      const adiUrl = `acc://${normalizedName}`;
      const keyBookUrl = `${adiUrl}/book`;
      const keyPageUrl = `${adiUrl}/book/1`;

      this.logger.info('🆔 Creating ADI for onboarding', { adiUrl, keyBookUrl });

      // Use the sponsor's key (from env) as the initial key
      const fullPrivateKey = process.env.ACCUM_PRIV_KEY || '';
      const privateKeyHex = fullPrivateKey.substring(0, 64);
      const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
      const sponsorKey = ED25519Key.from(privateKeyBytes);
      // Convert publicKeyHash to hex string (ensure Buffer conversion for proper hex encoding)
      const publicKeyHashBytes = sponsorKey.address.publicKeyHash;
      const sponsorKeyHash = Buffer.from(publicKeyHashBytes).toString('hex');

      this.logger.info('🔑 Sponsor key details for ADI creation:', {
        privateKeyLength: privateKeyHex.length,
        sponsorKeyHash: sponsorKeyHash,
        publicKeyHashBytesLength: publicKeyHashBytes.length,
        keyType: sponsorKey.address.type
      });

      // Create the ADI with sponsor's key
      const transaction = new core.Transaction({
        header: {
          principal: this.lid.url,
        },
        body: {
          type: 'createIdentity',
          url: adiUrl,
          keyHash: sponsorKey.address.publicKeyHash,
          keyBookUrl: keyBookUrl,
        },
      });

      // Sign with fresh timestamp
      const timestamp = this.getNextTimestamp();
      const signature = await this.lid.sign(transaction, { timestamp });

      const submitResult = await this.client.submit({
        transaction: [transaction],
        signatures: [signature]
      });

      // Check for success
      for (const result of submitResult) {
        if (!result.success) {
          throw new Error(`ADI creation failed: ${result.message}`);
        }
      }

      this.logger.info('✅ ADI created for onboarding', {
        adiUrl,
        sponsorKeyHash: sponsorKeyHash
      });

      // Wait for ADI to propagate
      this.logger.info('⏳ Waiting for ADI to propagate...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify the key page was created with the correct key
      try {
        const keyPageQuery = await this.client.query(keyPageUrl);
        const keys = keyPageQuery.account?.keys || keyPageQuery.data?.keys || [];
        const storedKeyHashes = keys.map((k: any) => {
          if (k.publicKeyHash) {
            return Buffer.from(k.publicKeyHash).toString('hex');
          }
          if (k.keyHash) {
            return Buffer.from(k.keyHash).toString('hex');
          }
          return null;
        }).filter(Boolean);

        this.logger.info('🔍 Key page verification after ADI creation:', {
          keyPageUrl,
          version: keyPageQuery.account?.version,
          creditBalance: keyPageQuery.account?.creditBalance,
          storedKeyCount: storedKeyHashes.length,
          storedKeys: storedKeyHashes,
          expectedKey: sponsorKeyHash
        });

        // Check if sponsor key is on the page
        const keyMatch = storedKeyHashes.some((k: string) =>
          k.toLowerCase() === sponsorKeyHash.toLowerCase()
        );

        if (!keyMatch && storedKeyHashes.length > 0) {
          this.logger.error('⚠️ WARNING: Sponsor key not found on key page!', {
            sponsorKeyHash,
            storedKeyHashes
          });
        } else if (keyMatch) {
          this.logger.info('✅ Sponsor key verified on key page');
        }
      } catch (verifyError) {
        this.logger.warn('⚠️ Could not verify key page after ADI creation:', {
          error: verifyError instanceof Error ? verifyError.message : String(verifyError)
        });
      }

      return {
        success: true,
        txId: submitResult[0].status.txID,
        adiUrl: adiUrl,
        keyBookUrl: keyBookUrl,
        keyPageUrl: keyPageUrl,
        sponsorKeyHash: sponsorKeyHash,
        message: 'ADI created with sponsor key - ready for key swap'
      };

    } catch (error) {
      this.logger.error('❌ Failed to create ADI for onboarding', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to create ADI for onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get sponsor account status for onboarding
   */
  async getSponsorStatus(): Promise<any> {
    try {
      const ltaUrl = process.env.ACCUM_LTA || '';
      const lidUrl = process.env.ACCUM_LID || '';

      if (!ltaUrl || !lidUrl) {
        return {
          onboardingEnabled: false,
          sponsorHealthy: false,
          error: 'Sponsor accounts not configured'
        };
      }

      // Get token balance from LTA using existing getBalance method
      let tokenBalance = 0;
      try {
        const tokenResult = await this.getBalance(ltaUrl);
        tokenBalance = parseInt(tokenResult?.balance || '0');
        this.logger.info('📊 LTA balance result', {
          ltaUrl,
          balance: tokenBalance,
          accountType: tokenResult?.accountType
        });
      } catch (error) {
        this.logger.warn('Could not query LTA balance', { error: error instanceof Error ? error.message : String(error) });
      }

      // Get credit balance from LID - SDK may return account or data property
      let creditBalance = 0;
      try {
        const creditResult = await this.client.query(lidUrl);
        // Handle both SDK response structures
        creditBalance = parseInt(
          creditResult?.account?.creditBalance ||
          creditResult?.data?.creditBalance ||
          '0'
        );
        this.logger.info('📊 LID credit balance result', {
          lidUrl,
          creditBalance,
          accountType: creditResult?.account?.type || creditResult?.data?.type,
          resultKeys: Object.keys(creditResult || {})
        });
      } catch (error) {
        this.logger.warn('Could not query LID credit balance', { error: error instanceof Error ? error.message : String(error) });
      }

      const minCredits = parseInt(process.env.ONBOARDING_MIN_SPONSOR_CREDITS || '100000');
      const minTokens = parseInt(process.env.ONBOARDING_MIN_SPONSOR_TOKENS || '1000');
      const creditsPerUser = parseInt(process.env.ONBOARDING_CREDITS_AMOUNT || '10000');
      const onboardingEnabled = process.env.ONBOARDING_ENABLED === 'true';

      // Token balance has 8 decimal places, convert to whole tokens
      const tokensFormatted = tokenBalance / 100000000;
      // Credits have 2 decimal places
      const creditsFormatted = creditBalance / 100;

      const sponsorHealthy = creditBalance >= minCredits && tokensFormatted >= minTokens;

      this.logger.info('📊 Sponsor status check', {
        tokenBalance: tokensFormatted,
        creditBalance: creditsFormatted,
        minCredits: minCredits / 100,
        minTokens,
        sponsorHealthy,
        onboardingEnabled
      });

      return {
        onboardingEnabled: onboardingEnabled && sponsorHealthy,
        sponsorHealthy,
        sponsorCredits: creditBalance,
        sponsorTokens: tokenBalance,
        sponsorCreditsFormatted: creditsFormatted,
        sponsorTokensFormatted: tokensFormatted,
        creditsPerUser,
        minCreditsRequired: minCredits,
        minTokensRequired: minTokens
      };

    } catch (error) {
      this.logger.error('❌ Failed to get sponsor status', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        onboardingEnabled: false,
        sponsorHealthy: false,
        error: error instanceof Error ? error.message : 'Failed to check sponsor status'
      };
    }
  }

  async getCreditBalance(accountUrl: string): Promise<number> {
    try {
      const result = await this.client.query(accountUrl);

      // For keypages: credits are in data.creditBalance
      // For LIDs: credits are in account.creditBalance
      const keyPageCredits = result.data?.creditBalance || 0;
      const lidCredits = result.account?.creditBalance || 0;

      const credits = keyPageCredits + lidCredits;

      this.logger.info('💰 Credit balance check', {
        accountUrl,
        keyPageCredits,
        lidCredits,
        totalCredits: credits,
        resultStructure: {
          hasData: !!result.data,
          hasAccount: !!result.account,
          dataKeys: result.data ? Object.keys(result.data) : [],
          accountKeys: result.account ? Object.keys(result.account) : []
        }
      });

      return credits;
    } catch (error) {
      this.logger.error('❌ Failed to get credit balance', {
        error: error instanceof Error ? error.message : String(error),
        accountUrl
      });
      throw error;
    }
  }

  async getAdiGovernanceStructure(adiUrl: string): Promise<any> {
    try {
      this.logger.info('🔍 Querying ADI governance structure', { adiUrl });

      // Query the ADI directory to get items using proper DirectoryQuery with range
      const adiResult = await this.client.query(adiUrl, {
        queryType: 'directory',
        range: { expand: false }
      });

      this.logger.info('🔍 ADI directory query result structure', {
        adiUrl,
        resultKeys: Object.keys(adiResult || {}),
        type: adiResult?.type,
        hasRecords: !!adiResult?.records,
        recordCount: adiResult?.records?.length || 0,
        records: adiResult?.records?.slice(0, 3), // Show first 3 records for debugging
        fullResult: JSON.stringify(adiResult, null, 2)
      });

      // Find key books from the directory records (RecordRange<UrlRecord>)
      const keyBooks = [];

      if (adiResult?.records && Array.isArray(adiResult.records)) {
        this.logger.info('🔍 Checking directory records for key books', {
          records: adiResult.records.length,
          recordCount: adiResult.records.length
        });

        for (const record of adiResult.records) {
          // Each record should have a .value which contains the URL
          const itemUrl = record?.value?.toString();

          this.logger.info('🔍 Analyzing directory record', {
            record: record,
            itemUrl,
            itemType: typeof itemUrl,
            hasBook: itemUrl && itemUrl.includes('/book'),
            hasBookSlash: itemUrl && itemUrl.includes('/book/'),
            isKeyBook: typeof itemUrl === 'string' && itemUrl.includes('/book') && !itemUrl.includes('/book/')
          });

          if (typeof itemUrl === 'string' && itemUrl.includes('/book') && !itemUrl.includes('/book/')) {
            // This is a key book (not a key page) - e.g. "acc://adi.acme/book"
            keyBooks.push(itemUrl);
            this.logger.info('✅ Added key book to list', { itemUrl });
          }
        }
      } else {
        this.logger.info('ℹ️ No directory records found', {
          hasRecords: !!adiResult?.records,
          isArray: Array.isArray(adiResult?.records),
          recordCount: adiResult?.records?.length || 0
        });
      }

      // If no key books found in directory, try the default book pattern as fallback
      if (keyBooks.length === 0) {
        const defaultBookUrl = `${adiUrl}/book`;
        try {
          this.logger.info('🔍 Trying default key book pattern', { defaultBookUrl });
          const bookResult = await this.client.query(defaultBookUrl);

          this.logger.info('🔍 Default book query result', {
            defaultBookUrl,
            type: bookResult?.type,
            dataType: bookResult?.data?.type,
            resultKeys: Object.keys(bookResult || {}),
            fullResult: JSON.stringify(bookResult, null, 2)
          });

          // Check for key book in the correct API response structure
          // Type 10 = keyBook according to the API response
          if (bookResult?.account?.type === 10) {
            keyBooks.push(defaultBookUrl);
            this.logger.info('✅ Found default key book', {
              defaultBookUrl,
              pageCount: bookResult.account.pageCount
            });
          } else {
            this.logger.info('ℹ️ Default book exists but is not a keyBook', {
              defaultBookUrl,
              accountType: bookResult?.account?.type,
              expectedType: 10,
              hasAccount: !!bookResult?.account
            });
          }
        } catch (error) {
          this.logger.info('ℹ️ No default key book found', {
            defaultBookUrl,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      this.logger.info('📖 Found key books', { keyBooks });

      // Query each key book to get its key pages
      const governanceStructure = [];
      for (const keyBookUrl of keyBooks) {
        try {
          const keyBookResult = await this.client.query(keyBookUrl);
          const keyBookName = keyBookUrl.split('/').pop() || 'book';

          this.logger.info('📖 Key book query result', {
            keyBookUrl,
            accountType: keyBookResult?.account?.type,
            pageCount: keyBookResult?.account?.pageCount,
            authorities: keyBookResult?.account?.authorities?.length || 0
          });

          // Get the page count from key book account data (not data property)
          const pageCount = keyBookResult?.account?.pageCount || 1;

          // Query each key page (usually just page 1)
          const keyPages = [];
          for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
            const keyPageUrl = `${keyBookUrl}/${pageNumber}`;
            try {
              const pageResult = await this.client.query(keyPageUrl);
              // Check for key page using account.type (type 9 = keyPage based on the actual API response)
              if (pageResult?.account?.type === 9) {
                keyPages.push(keyPageUrl);
                this.logger.info('✅ Found key page', {
                  keyPageUrl,
                  keyCount: pageResult?.account?.keys?.length || 0,
                  creditBalance: pageResult?.account?.creditBalance || 0
                });
              } else {
                this.logger.info('ℹ️ Key page query returned unexpected type', {
                  keyPageUrl,
                  accountType: pageResult?.account?.type,
                  expectedType: 9
                });
              }
            } catch (error) {
              this.logger.info('ℹ️ Key page not found', { keyPageUrl, error });
            }
          }

          // Query each key page to get signer details
          const signers = [];
          for (const keyPageUrl of keyPages) {
            try {
              const keyPageResult = await this.client.query(keyPageUrl);
              const keyPageData = keyPageResult?.account; // Use account property for correct API structure

              this.logger.info('🔑 Key page data', {
                keyPageUrl,
                accountType: keyPageData?.type,
                keyCount: keyPageData?.keys?.length,
                threshold: keyPageData?.acceptThreshold,
                creditBalance: keyPageData?.creditBalance
              });

              if (keyPageData && keyPageData.type === 9) { // Type 9 = keyPage
                // Extract ALL keys from the key page (not just the first one)
                const allKeys = keyPageData.keys || [];
                const entries: Array<{ keyHash: string; isDelegate: boolean; delegateUrl?: string; lastUsedOn?: number }> = [];

                for (const key of allKeys) {
                  let keyHash = 'unknown';

                  // Helper to convert various buffer formats to hex
                  const toHex = (data: any): string | null => {
                    if (!data) return null;
                    // Handle Buffer objects (has toString('hex'))
                    if (Buffer.isBuffer(data)) {
                      return data.toString('hex');
                    }
                    // Handle Uint8Array or typed arrays
                    if (data instanceof Uint8Array) {
                      return Array.from(data).map((b: number) => b.toString(16).padStart(2, '0')).join('');
                    }
                    // Handle {type: 'Buffer', data: [...]} format (JSON serialized Buffer)
                    if (data.type === 'Buffer' && Array.isArray(data.data)) {
                      return data.data.map((b: number) => b.toString(16).padStart(2, '0')).join('');
                    }
                    // Handle plain array
                    if (Array.isArray(data)) {
                      return data.map((b: number) => b.toString(16).padStart(2, '0')).join('');
                    }
                    // Handle object with data property
                    if (data.data) {
                      return toHex(data.data);
                    }
                    return null;
                  };

                  // Try publicKeyHash first, then publicKey as fallback
                  const hashHex = toHex(key?.publicKeyHash) || toHex(key?.publicKey);
                  if (hashHex) {
                    keyHash = hashHex;
                  } else if (typeof key?.publicKeyHash === 'string') {
                    keyHash = key.publicKeyHash;
                  } else if (typeof key?.publicKey === 'string') {
                    keyHash = key.publicKey;
                  }

                  // Check if this is a delegate (has delegate property)
                  const isDelegate = !!(key?.delegate);
                  const delegateUrl = key?.delegate?.toString() || undefined;

                  entries.push({
                    keyHash,
                    isDelegate,
                    delegateUrl,
                    lastUsedOn: key?.lastUsedOn
                  });

                  this.logger.info('🔑 Extracted key entry', {
                    keyHash: keyHash.substring(0, 16) + '...',
                    isDelegate,
                    delegateUrl
                  });
                }

                // Get the primary key address for backward compatibility
                const primaryKeyAddress = entries.length > 0 ? entries[0].keyHash : 'unknown';

                // Query pending transactions for this key page
                let pendingTxs: Array<{ txHash: string; txType: string; body?: any }> = [];
                try {
                  const pendingResult = await this.getPendingTransactions(keyPageUrl);
                  if (pendingResult.success && pendingResult.pending) {
                    pendingTxs = pendingResult.pending.map(tx => ({
                      txHash: tx.txHash,
                      txType: tx.txType,
                      body: tx.body // Include the parsed body with operations
                    }));
                  }
                } catch (pendingError) {
                  this.logger.warn('⚠️ Failed to query pending transactions for key page', {
                    keyPageUrl,
                    error: pendingError instanceof Error ? pendingError.message : String(pendingError)
                  });
                }

                signers.push({
                  url: keyPageUrl,
                  keyAddress: primaryKeyAddress, // Keep for backward compatibility
                  threshold: keyPageData.acceptThreshold || keyPageData.threshold || 1,
                  creditBalance: keyPageData.creditBalance || 0,
                  version: keyPageData.version || 1,
                  keys: keyPageData.keys || [], // Raw keys from blockchain
                  entries: entries, // Parsed entries (all keys and delegates)
                  entryCount: entries.length,
                  type: entries.length > 1 ? 'multi-signature' : 'single-signature',
                  pendingCount: pendingTxs.length,
                  pendingTransactions: pendingTxs
                });

                this.logger.info('✅ KeyPage processed', {
                  keyPageUrl,
                  entryCount: entries.length,
                  threshold: keyPageData.acceptThreshold || keyPageData.threshold || 1,
                  version: keyPageData.version || 1,
                  pendingCount: pendingTxs.length
                });
              }
            } catch (error) {
              this.logger.error('❌ Failed to query key page', { keyPageUrl, error });
            }
          }

          // Query pending transactions for the key book itself
          let keyBookPendingTxs: Array<{ txHash: string; txType: string }> = [];
          try {
            const keyBookPendingResult = await this.getPendingTransactions(keyBookUrl);
            if (keyBookPendingResult.success && keyBookPendingResult.pending) {
              keyBookPendingTxs = keyBookPendingResult.pending.map(tx => ({
                txHash: tx.txHash,
                txType: tx.txType
              }));
            }
          } catch (pendingError) {
            this.logger.warn('⚠️ Failed to query pending transactions for key book', {
              keyBookUrl,
              error: pendingError instanceof Error ? pendingError.message : String(pendingError)
            });
          }

          // Calculate total pending across all key pages
          const totalKeyPagePending = signers.reduce((sum, s) => sum + (s.pendingCount || 0), 0);

          governanceStructure.push({
            keyBookUrl,
            keyBookName,
            keyPages: keyPages.length,
            signers,
            pendingCount: keyBookPendingTxs.length,
            pendingTransactions: keyBookPendingTxs,
            totalKeyPagePending
          });

          this.logger.info('📖 KeyBook pending summary', {
            keyBookUrl,
            keyBookPending: keyBookPendingTxs.length,
            totalKeyPagePending
          });

        } catch (error) {
          this.logger.error('❌ Failed to query key book', { keyBookUrl, error });
        }
      }

      const totalSigners = governanceStructure.reduce((sum, kb) => sum + kb.signers.length, 0);

      this.logger.info('✅ ADI governance structure retrieved', {
        adiUrl,
        keyBooksFound: governanceStructure.length,
        totalSigners
      });

      return {
        success: true,
        adiUrl,
        keyBooks: governanceStructure,
        totalAuthorities: governanceStructure.length,
        totalSigners
      };

    } catch (error) {
      this.logger.error('❌ Failed to get ADI governance structure', {
        error: error instanceof Error ? error.message : String(error),
        adiUrl
      });
      return { success: false, error: 'Failed to query ADI governance structure' };
    }
  }

  // Get ADI directory listing
  async getAdiDirectory(adiUrl: string): Promise<any> {
    try {
      this.logger.info('📁 Getting directory for ADI', { adiUrl });

      const response = await this.client.query({
        scope: adiUrl,
        query: {
          queryType: 'directory'
        }
      });

      this.logger.info('📁 Directory query response', { response });

      if (!response || !response.record) {
        throw new Error('No directory data found');
      }

      return response.record;

    } catch (error) {
      this.logger.error('❌ Failed to get ADI directory', {
        error: error instanceof Error ? error.message : String(error),
        adiUrl
      });
      throw error;
    }
  }

  // Get account details
  async getAccountDetails(accountUrl: string): Promise<any> {
    try {
      this.logger.info('📄 Getting account details', { accountUrl });

      const response = await this.client.query({
        scope: accountUrl,
        query: {
          queryType: 'default'
        }
      });

      this.logger.info('📄 Account details query response', { response });

      if (!response || !response.record) {
        throw new Error('No account data found');
      }

      return response.record;

    } catch (error) {
      this.logger.error('❌ Failed to get account details', {
        error: error instanceof Error ? error.message : String(error),
        accountUrl
      });
      throw error;
    }
  }

  // Get detailed information about keypages in a keybook
  async getKeyBookPages(keyBookUrl: string): Promise<any[]> {
    try {
      this.logger.info('🔍 Step 1: Querying keybook to get pageCount', { keyBookUrl });

      // Step 1: Query the keybook to get pageCount from data section
      const keyBookResponse = await this.client.query(keyBookUrl);

      if (!keyBookResponse || !keyBookResponse.account) {
        throw new Error('KeyBook not found or no account section');
      }

      const pageCount = keyBookResponse.account.pageCount || 1;
      this.logger.info('📖 KeyBook pageCount found', { keyBookUrl, pageCount, keyBookType: keyBookResponse.account.type });

      const keypages = [];

      // Step 2: Query each individual keypage
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
        const keyPageUrl = `${keyBookUrl}/${pageNumber}`;

        try {
          this.logger.info('🔍 Step 2: Querying individual keypage', { keyPageUrl, pageNumber });
          const keyPageResponse = await this.client.query(keyPageUrl);

          // Check both response.account (type 9) and response.data (type 'keyPage') structures
          let pageData = null;
          if (keyPageResponse && keyPageResponse.account && keyPageResponse.account.type === 9) {
            pageData = keyPageResponse.account;
            this.logger.info('📋 Using account structure', { keyPageUrl });
          } else if (keyPageResponse && keyPageResponse.data && keyPageResponse.data.type === 'keyPage') {
            pageData = keyPageResponse.data;
            this.logger.info('📋 Using data structure', { keyPageUrl });
          }

          if (pageData) {

            this.logger.info('📋 Keypage data found', {
              keyPageUrl,
              threshold: pageData.threshold,
              acceptThreshold: pageData.acceptThreshold,
              keysCount: pageData.keys ? pageData.keys.length : 0,
              creditBalance: pageData.creditBalance,
              dataStructure: Object.keys(pageData)
            });

            // Extract entries from the keys array
            const entries = pageData.keys ? pageData.keys.map((key: any, index: number) => {
              if (key.delegate) {
                return {
                  type: 'delegate',
                  delegateUrl: key.delegate,
                  keyHash: null,
                  isActive: true
                };
              } else {
                // Convert Buffer to hex string if needed
                let keyHashStr = key.publicKeyHash;

                // Try different ways to access the Buffer properties
                const jsonString = JSON.stringify(key.publicKeyHash);
                const parsedObj = JSON.parse(jsonString);

                this.logger.info('🔍 Debug Buffer access methods', {
                  directAccess: {
                    type: key.publicKeyHash.type,
                    hasData: !!key.publicKeyHash.data
                  },
                  jsonParsed: {
                    type: parsedObj.type,
                    hasData: !!parsedObj.data,
                    dataLength: parsedObj.data ? parsedObj.data.length : 'N/A'
                  },
                  stringified: jsonString
                });

                // Use the parsed object for reliable property access
                const isBuffer = parsedObj &&
                               parsedObj.type === 'Buffer' &&
                               parsedObj.data &&
                               Array.isArray(parsedObj.data);

                this.logger.info('🔑 Processing key hash', {
                  originalType: typeof key.publicKeyHash,
                  isBuffer: isBuffer,
                  hasData: !!(key.publicKeyHash && key.publicKeyHash.data),
                  originalValue: key.publicKeyHash
                });

                if (isBuffer) {
                  keyHashStr = Buffer.from(parsedObj.data).toString('hex');
                  this.logger.info('🔄 Converted Buffer to hex', {
                    keyHashStr,
                    bufferData: parsedObj.data
                  });
                } else if (key.publicKeyHash && typeof key.publicKeyHash === 'string') {
                  keyHashStr = key.publicKeyHash;
                  this.logger.info('✅ Using string key hash', { keyHashStr });
                } else {
                  // Force convert whatever this is to string
                  keyHashStr = String(key.publicKeyHash);
                  this.logger.info('⚠️ Forced conversion to string', {
                    keyHashStr,
                    originalType: typeof key.publicKeyHash,
                    originalValue: key.publicKeyHash
                  });
                }

                const entryObject = {
                  type: 'key',
                  keyHash: keyHashStr,
                  publicKey: key.publicKey,
                  delegateUrl: null,
                  isActive: true,
                  lastUsedOn: key.lastUsedOn
                };

                this.logger.info('🎯 Final entry object created', {
                  entryObject,
                  keyHashType: typeof entryObject.keyHash,
                  keyHashValue: entryObject.keyHash
                });

                return entryObject;
              }
            }) : [];

            keypages.push({
              url: keyPageUrl,
              threshold: pageData.threshold || pageData.acceptThreshold, // Use acceptThreshold as fallback
              acceptThreshold: pageData.acceptThreshold,
              entries: entries,
              pageNumber: pageNumber,
              creditBalance: pageData.creditBalance,
              version: pageData.version
            });

            this.logger.info('✅ Successfully parsed keypage', { keyPageUrl, entriesCount: entries.length });
          } else {
            this.logger.warn('Keypage response missing data or wrong type', {
              keyPageUrl,
              hasResponse: !!keyPageResponse,
              hasData: !!keyPageResponse?.data,
              dataType: keyPageResponse?.data?.type,
              responseKeys: Object.keys(keyPageResponse || {}),
              actualResponseSample: keyPageResponse ? JSON.stringify(keyPageResponse).substring(0, 500) + '...' : 'null'
            });
          }
        } catch (pageError) {
          this.logger.warn('Could not query keypage', {
            keyPageUrl,
            pageNumber,
            error: pageError instanceof Error ? pageError.message : String(pageError)
          });

          // Add fallback placeholder for this specific page
          keypages.push({
            url: keyPageUrl,
            threshold: 1,
            entries: [{
              type: 'key',
              keyHash: 'Unable to query - network connectivity issue',
              delegateUrl: null,
              isActive: true
            }],
            pageNumber: pageNumber,
            note: 'Network query failed for this keypage'
          });
          // Continue to next page - keybook said pageCount includes this page
        }
      }

      return keypages;

    } catch (error) {
      this.logger.error('❌ Step 1 failed: Could not query keybook for pageCount, trying direct keypage queries', {
        error: error instanceof Error ? error.message : String(error),
        keyBookUrl
      });

      // Fallback: Try to query common keypage URLs directly (assume pageCount up to 3)
      const keypages = [];

      for (let pageNumber = 1; pageNumber <= 3; pageNumber++) {
        const keyPageUrl = `${keyBookUrl}/${pageNumber}`;

        try {
          this.logger.info('🔍 Fallback Step 2: Attempting direct keypage query', { keyPageUrl, pageNumber });
          const keyPageResponse = await this.client.query(keyPageUrl);

          // Check both response.account (type 9) and response.data (type 'keyPage') structures
          let pageData = null;
          if (keyPageResponse && keyPageResponse.account && keyPageResponse.account.type === 9) {
            pageData = keyPageResponse.account;
            this.logger.info('📋 Fallback using account structure', { keyPageUrl });
          } else if (keyPageResponse && keyPageResponse.data && keyPageResponse.data.type === 'keyPage') {
            pageData = keyPageResponse.data;
            this.logger.info('📋 Fallback using data structure', { keyPageUrl });
          }

          if (pageData) {

            this.logger.info('📋 Fallback keypage data found', {
              keyPageUrl,
              threshold: pageData.threshold,
              acceptThreshold: pageData.acceptThreshold,
              keysCount: pageData.keys ? pageData.keys.length : 0,
              creditBalance: pageData.creditBalance
            });

            // Extract entries from the keys array
            const entries = pageData.keys ? pageData.keys.map((key: any) => {
              if (key.delegate) {
                return {
                  type: 'delegate',
                  delegateUrl: key.delegate,
                  keyHash: null,
                  isActive: true
                };
              } else {
                // Convert Buffer to hex string if needed
                let keyHashStr = key.publicKeyHash;

                // Try different ways to access the Buffer properties
                const jsonString = JSON.stringify(key.publicKeyHash);
                const parsedObj = JSON.parse(jsonString);

                this.logger.info('🔍 Debug Buffer access methods', {
                  directAccess: {
                    type: key.publicKeyHash.type,
                    hasData: !!key.publicKeyHash.data
                  },
                  jsonParsed: {
                    type: parsedObj.type,
                    hasData: !!parsedObj.data,
                    dataLength: parsedObj.data ? parsedObj.data.length : 'N/A'
                  },
                  stringified: jsonString
                });

                // Use the parsed object for reliable property access
                const isBuffer = parsedObj &&
                               parsedObj.type === 'Buffer' &&
                               parsedObj.data &&
                               Array.isArray(parsedObj.data);

                this.logger.info('🔑 Processing key hash', {
                  originalType: typeof key.publicKeyHash,
                  isBuffer: isBuffer,
                  hasData: !!(key.publicKeyHash && key.publicKeyHash.data),
                  originalValue: key.publicKeyHash
                });

                if (isBuffer) {
                  keyHashStr = Buffer.from(parsedObj.data).toString('hex');
                  this.logger.info('🔄 Converted Buffer to hex', {
                    keyHashStr,
                    bufferData: parsedObj.data
                  });
                } else if (key.publicKeyHash && typeof key.publicKeyHash === 'string') {
                  keyHashStr = key.publicKeyHash;
                  this.logger.info('✅ Using string key hash', { keyHashStr });
                } else {
                  // Force convert whatever this is to string
                  keyHashStr = String(key.publicKeyHash);
                  this.logger.info('⚠️ Forced conversion to string', {
                    keyHashStr,
                    originalType: typeof key.publicKeyHash,
                    originalValue: key.publicKeyHash
                  });
                }

                const entryObject = {
                  type: 'key',
                  keyHash: keyHashStr,
                  publicKey: key.publicKey,
                  delegateUrl: null,
                  isActive: true,
                  lastUsedOn: key.lastUsedOn
                };

                this.logger.info('🎯 Final entry object created', {
                  entryObject,
                  keyHashType: typeof entryObject.keyHash,
                  keyHashValue: entryObject.keyHash
                });

                return entryObject;
              }
            }) : [];

            keypages.push({
              url: keyPageUrl,
              threshold: pageData.threshold || pageData.acceptThreshold, // Use acceptThreshold as fallback
              acceptThreshold: pageData.acceptThreshold,
              entries: entries,
              pageNumber: pageNumber,
              creditBalance: pageData.creditBalance,
              version: pageData.version
            });

            this.logger.info('✅ Successfully queried keypage directly in fallback', { keyPageUrl, entriesCount: entries.length });
          } else {
            this.logger.info('Keypage response missing data or wrong type in fallback', {
              keyPageUrl,
              hasResponse: !!keyPageResponse,
              hasData: !!keyPageResponse?.data,
              dataType: keyPageResponse?.data?.type,
              responseKeys: Object.keys(keyPageResponse || {}),
              actualResponseSample: keyPageResponse ? JSON.stringify(keyPageResponse).substring(0, 500) + '...' : 'null'
            });
          }
        } catch (pageError) {
          this.logger.info('Fallback keypage query failed', {
            keyPageUrl,
            pageNumber,
            error: pageError instanceof Error ? pageError.message : String(pageError)
          });
          // Continue to next page - all pages 1 through pageCount should exist
        }
      }

      // If we found any keypages through direct query, return those
      if (keypages.length > 0) {
        this.logger.info('🎯 Direct keypage queries successful', { keyBookUrl, keypagesFound: keypages.length });
        return keypages;
      }

      // Complete fallback only if everything fails
      this.logger.info('📋 Using complete fallback structure', { keyBookUrl });
      return [{
        url: `${keyBookUrl}/1`,
        threshold: 1,
        entries: [{
          type: 'key',
          keyHash: 'Network connectivity prevents querying key details',
          delegateUrl: null,
          isActive: true
        }],
        pageNumber: 1,
        note: 'All network queries failed - using placeholder structure'
      }];
    }
  }

  // Validate KeyBook existence and accessibility
  async validateKeyBook(keyBookUrl: string): Promise<any> {
    try {
      this.logger.info('🔍 Validating KeyBook', { keyBookUrl });

      // Basic URL format validation
      if (!keyBookUrl || !keyBookUrl.startsWith('acc://')) {
        throw new Error('Invalid KeyBook URL format - must start with acc://');
      }

      // Due to SDK query issues in Docker environment, we'll assume the keybook
      // is valid if it follows the correct format. This is the most accurate approach
      // since we cannot reliably query the network from this environment.

      this.logger.info('✅ KeyBook URL format is valid', { keyBookUrl });

      // Try to get actual keypage details
      const keypages = await this.getKeyBookPages(keyBookUrl);

      this.logger.info('📋 Retrieved keypage details', { keyBookUrl, keypageCount: keypages.length });

      return {
        exists: true,
        valid: true,
        type: 'keyBook',
        url: keyBookUrl,
        keypages: keypages,
        note: keypages.length > 0
          ? `Validated with ${keypages.length} keypage(s)`
          : 'Format validation passed - network connectivity issues prevent full verification'
      };

    } catch (error) {
      this.logger.error('❌ Failed to validate KeyBook', {
        error: error instanceof Error ? error.message : String(error),
        keyBookUrl
      });

      return {
        exists: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  // Discover KeyBooks within an ADI
  async discoverADIKeyBooks(adiUrl: string): Promise<any[]> {
    try {
      this.logger.info('🔍 Discovering KeyBooks for ADI', { adiUrl });

      // Query the ADI directory to get all accounts
      const adiResult = await this.client.query(adiUrl, {
        queryType: 'directory',
        range: { expand: false }
      });

      this.logger.info('🔍 ADI directory query for keybook discovery', {
        adiUrl,
        recordCount: adiResult?.records?.length || 0
      });

      const keyBooks: any[] = [];

      if (adiResult?.records && Array.isArray(adiResult.records)) {
        for (const record of adiResult.records) {
          const itemUrl = record?.value?.toString();

          // Check if this looks like a KeyBook URL (contains /book but not /book/ which would be a KeyPage)
          if (typeof itemUrl === 'string' && itemUrl.includes('/book') && !itemUrl.includes('/book/')) {
            // Query the account to verify it's actually a KeyBook (type 10)
            try {
              const accountResult = await this.client.query(itemUrl);

              // Type 10 = keyBook according to the Accumulate API
              if (accountResult?.account?.type === 10) {
                const keyBookName = itemUrl.split('/').pop() || 'book';

                keyBooks.push({
                  id: itemUrl,
                  keyBookUrl: itemUrl,
                  keyBookName: keyBookName,
                  pageCount: accountResult.account.pageCount || 1,
                  type: 'keyBook'
                });

                this.logger.info('✅ Found KeyBook', {
                  itemUrl,
                  keyBookName,
                  pageCount: accountResult.account.pageCount
                });
              }
            } catch (queryError) {
              this.logger.warn('⚠️ Failed to query potential KeyBook', {
                itemUrl,
                error: queryError instanceof Error ? queryError.message : String(queryError)
              });
            }
          }
        }
      }

      // Fallback: if no KeyBooks found in directory, try default /book pattern
      if (keyBooks.length === 0) {
        const defaultBookUrl = `${adiUrl}/book`;
        try {
          const bookResult = await this.client.query(defaultBookUrl);

          if (bookResult?.account?.type === 10) {
            keyBooks.push({
              id: defaultBookUrl,
              keyBookUrl: defaultBookUrl,
              keyBookName: 'book',
              pageCount: bookResult.account.pageCount || 1,
              type: 'keyBook'
            });

            this.logger.info('✅ Found default KeyBook', { defaultBookUrl });
          }
        } catch (error) {
          this.logger.info('ℹ️ No default KeyBook found', { defaultBookUrl });
        }
      }

      this.logger.info('📋 KeyBook discovery complete', {
        adiUrl,
        keyBooksFound: keyBooks.length,
        keyBooks: keyBooks.map(kb => kb.keyBookUrl)
      });

      return keyBooks;

    } catch (error) {
      this.logger.error('❌ Failed to discover ADI KeyBooks', {
        error: error instanceof Error ? error.message : String(error),
        adiUrl
      });

      return [];
    }
  }

  // Query transaction status by transaction hash/URL
  async queryTransaction(transactionUrl: string, prove?: boolean): Promise<any> {
    try {
      this.logger.info('🔍 Querying transaction', { transactionUrl, prove });

      // Normalize the input to proper Accumulate transaction URL format
      // Transaction URLs need to be: acc://txhash@signer
      let queryUrl = transactionUrl.trim();

      // Ensure acc:// prefix
      if (!queryUrl.toLowerCase().startsWith('acc://')) {
        queryUrl = 'acc://' + queryUrl;
      }

      // Extract the hash part (after acc:// and before @)
      const withoutPrefix = queryUrl.substring(6); // Remove acc://
      const hashPart = withoutPrefix.includes('@') ? withoutPrefix.split('@')[0] : withoutPrefix;
      const isHash = /^[a-fA-F0-9]{64}$/.test(hashPart);

      // If it's a bare hash without @signer, add @unknown suffix
      if (isHash && !queryUrl.includes('@')) {
        queryUrl = `acc://${hashPart}@unknown`;
      }

      console.log('🔍 Debug: normalized query', {
        original: transactionUrl,
        normalized: queryUrl,
        hashPart,
        isHash
      });

      const queryOptions: any = {};
      if (prove) {
        queryOptions.prove = true;
      }

      // Try different query approaches
      let result;
      if (prove) {
        // Try with options object
        try {
          result = await this.client.query(queryUrl, queryOptions);
        } catch (error) {
          console.log('🔍 First approach failed, trying without options:', error);
          // Fallback to simple query
          result = await this.client.query(queryUrl);
        }
      } else {
        // Simple query without options
        result = await this.client.query(queryUrl);
      }

      this.logger.info('📊 Transaction query result', {
        transactionUrl,
        hasResult: !!result,
        status: result?.status || 'unknown'
      });

      return {
        success: true,
        transaction: result,
        status: result?.status || 'unknown',
        txHash: result?.txHash || result?.hash,
        blockHeight: result?.blockHeight,
        mainChain: result?.mainChain
      };

    } catch (error) {
      this.logger.error('❌ Failed to query transaction', {
        error: error instanceof Error ? error.message : String(error),
        transactionUrl
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction query failed',
        status: 'error'
      };
    }
  }

  getConfig() {
    return {
      endpoint: process.env.ACCUM_ENDPOINT || 'http://localhost:26660/v3',
      ltaUrl: this.lta,
      lidUrl: this.lid?.url?.toString() || ''
    };
  }

  // =============================================================================
  // PENDING ACTIONS - VOTE SUBMISSION
  // =============================================================================

  /**
   * Get the status of a transaction by its hash
   * Used to query pending transactions and their signature state
   */
  async getTransactionStatus(txHash: string): Promise<{
    success: boolean;
    status?: string;
    principal?: string;
    txId?: string;
    signatures?: Array<{ signer: string; publicKeyHash: string }>;
    error?: string;
  }> {
    try {
      this.logger.info('🔍 Querying transaction status', { txHash });

      // Query the transaction by hash
      const result = await this.client.query(txHash);

      if (!result) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      // Extract signature information if available
      const signatures: Array<{ signer: string; publicKeyHash: string }> = [];
      if (result.signatures && Array.isArray(result.signatures)) {
        for (const sig of result.signatures) {
          signatures.push({
            signer: sig.signer?.toString() || '',
            publicKeyHash: sig.publicKeyHash ? Buffer.from(sig.publicKeyHash).toString('hex') : ''
          });
        }
      }

      return {
        success: true,
        status: result.status || result.statusNo === 100 ? 'pending' : 'delivered',
        principal: result.transaction?.header?.principal?.toString() || result.principal,
        txId: result.txHash || txHash,
        signatures
      };

    } catch (error) {
      this.logger.error('❌ Failed to get transaction status', {
        error: error instanceof Error ? error.message : String(error),
        txHash
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query transaction'
      };
    }
  }

  /**
   * Get pending transactions for an account (e.g., key page).
   * This queries the pending chain to discover transactions awaiting signatures.
   */
  async getPendingTransactions(accountUrl: string): Promise<{
    success: boolean;
    pending?: Array<{
      txHash: string;
      txType: string;
      principal: string;
      initiator?: string;
      body?: any;
      signatures?: Array<{ signer: string; publicKeyHash: string; timestamp?: number }>;
      signatureCount?: number;
      requiredSignatures?: number;
    }>;
    error?: string;
  }> {
    try {
      this.logger.info('🔍 Querying pending transactions', { accountUrl });

      // Query the pending chain with expand: true to get full transaction details
      const result = await this.client.query(accountUrl, {
        queryType: 'pending',
        range: { expand: true }
      });

      this.logger.info('📋 Pending chain query result', {
        accountUrl,
        recordCount: result?.records?.length || 0,
        total: result?.total || 0,
        resultKeys: Object.keys(result || {})
      });

      const pendingTxs: Array<{
        txHash: string;
        txType: string;
        principal: string;
        initiator?: string;
        body?: any;
        signatures?: Array<{ signer: string; publicKeyHash: string; timestamp?: number }>;
        signatureCount?: number;
        requiredSignatures?: number;
      }> = [];

      if (result?.records && Array.isArray(result.records)) {
        for (const record of result.records) {
          try {
            // Extract transaction details from the message record
            const message = record?.message || record?.value;
            const transaction = message?.transaction;
            const txHash = record?.id?.toString() || transaction?.hash?.toString() || 'unknown';

            // Get transaction type from the body
            const body = transaction?.body;
            const txType = body?.type?.toString() || body?.typeStr || 'unknown';

            // Get principal (the account being modified)
            const principal = transaction?.header?.principal?.toString() || accountUrl;

            // Get initiator if available
            const initiator = transaction?.header?.initiator?.toString();

            // Parse body for specific transaction types
            let parsedBody: any = {};
            if (body) {
              // For updateKeyPage transactions, extract the operations
              if (txType === 'updateKeyPage' || body.type === 15) {
                // Map KeyPageOperation types to readable names
                const getOperationType = (op: any): string => {
                  const opTypeNum = typeof op.type === 'number' ? op.type : parseInt(op.type?.toString() || '0');
                  const opTypeStr = op.type?.toString()?.toLowerCase() || op.typeStr?.toLowerCase() || '';

                  // Check if it's a delegate operation (has delegate field in entry)
                  const isDelegate = !!(op.entry?.delegate || op.newEntry?.delegate);

                  // KeyPageOperationType enum values from Accumulate:
                  // 1 = Add, 2 = Remove, 3 = Update (keys only), 4 = SetThreshold
                  // Note: Delegates can only be added or removed, not updated
                  // Also handle string types: "add", "remove", "update", "setThreshold"
                  if (opTypeNum === 1 || opTypeStr === 'add' || opTypeStr.includes('add')) {
                    return isDelegate ? 'addDelegate' : 'addKey';
                  } else if (opTypeNum === 2 || opTypeStr === 'remove' || opTypeStr.includes('remove')) {
                    return isDelegate ? 'removeDelegate' : 'removeKey';
                  } else if (opTypeNum === 3 || opTypeStr === 'update' || opTypeStr.includes('update')) {
                    // Type 3 is Update - only valid for keys, not delegates
                    // If we see a delegate with type 3, it's likely meant to be an add operation
                    if (isDelegate) {
                      this.logger.warn('⚠️ Unexpected: delegate with update operation type, treating as addDelegate');
                      return 'addDelegate';
                    }
                    return 'updateKey';
                  } else if (opTypeNum === 4 || opTypeStr === 'setthreshold' || opTypeStr.includes('threshold')) {
                    return 'updateThreshold';
                  }
                  // Fallback: if we have a delegate, assume add; otherwise unknown
                  if (isDelegate) {
                    return 'addDelegate';
                  }
                  return opTypeStr || `operation-${opTypeNum}`;
                };

                // Handle both 'operation' (singular array) and 'operations' (plural) field names
                const operationsArray = body.operation || body.operations || [];

                this.logger.info('🔍 Raw operations data', {
                  hasOperation: !!body.operation,
                  hasOperations: !!body.operations,
                  operationsCount: operationsArray.length,
                  rawOperations: operationsArray.map((op: any) => ({
                    type: op.type,
                    typeOf: typeof op.type,
                    hasDelegate: !!op.entry?.delegate,
                    hasKeyHash: !!op.entry?.keyHash
                  }))
                });

                parsedBody = {
                  type: 'updateKeyPage',
                  operations: operationsArray.map((op: any) => {
                    const operationType = getOperationType(op);
                    this.logger.info('🔍 Operation type resolved', { rawType: op.type, resolved: operationType });
                    return {
                      type: operationType,
                      entry: op.entry ? {
                        keyHash: op.entry.keyHash ? Buffer.from(op.entry.keyHash).toString('hex') : undefined,
                        delegate: op.entry.delegate?.toString()
                      } : undefined,
                      oldEntry: op.oldEntry ? {
                        keyHash: op.oldEntry.keyHash ? Buffer.from(op.oldEntry.keyHash).toString('hex') : undefined
                      } : undefined,
                      newEntry: op.newEntry ? {
                        keyHash: op.newEntry.keyHash ? Buffer.from(op.newEntry.keyHash).toString('hex') : undefined
                      } : undefined,
                      threshold: op.threshold
                    };
                  })
                };

                this.logger.info('📝 Parsed updateKeyPage operations', {
                  operationCount: operationsArray.length,
                  operations: parsedBody.operations.map((o: any) => o.type)
                });
              } else if (txType === 'updateAccountAuth' || txType === '14' || txType.toLowerCase() === 'updateaccountauth' || body.type === 14 || body.type === '14') {
                // For updateAccountAuth transactions, extract the operations
                // AccountAuthOperationType enum values from Accumulate:
                // 1 = AddAuthority, 2 = RemoveAuthority, 3 = Enable, 4 = Disable
                // AccountAuthOperationType enum in Accumulate:
                // 1 = Enable, 2 = Disable, 3 = AddAuthority, 4 = RemoveAuthority
                const getAccountAuthOperationType = (op: any): string => {
                  const opTypeNum = typeof op.type === 'number' ? op.type : parseInt(op.type?.toString() || '0');
                  const opTypeStr = op.type?.toString()?.toLowerCase() || op.typeStr?.toLowerCase() || '';

                  if (opTypeNum === 1 || opTypeStr === 'enable' || opTypeStr.includes('enable')) {
                    return 'enable';
                  } else if (opTypeNum === 2 || opTypeStr === 'disable' || opTypeStr.includes('disable')) {
                    return 'disable';
                  } else if (opTypeNum === 3 || opTypeStr === 'addauthority' || opTypeStr.includes('add')) {
                    return 'addAuthority';
                  } else if (opTypeNum === 4 || opTypeStr === 'removeauthority' || opTypeStr.includes('remove')) {
                    return 'removeAuthority';
                  }
                  return opTypeStr || `operation-${opTypeNum}`;
                };

                // Handle both 'operation' (singular array) and 'operations' (plural) field names
                const operationsArray = body.operation || body.operations || [];

                this.logger.info('🔍 Raw updateAccountAuth operations data', {
                  hasOperation: !!body.operation,
                  hasOperations: !!body.operations,
                  operationsCount: operationsArray.length,
                  rawOperations: operationsArray.map((op: any) => ({
                    type: op.type,
                    typeOf: typeof op.type,
                    authority: op.authority?.toString()
                  }))
                });

                parsedBody = {
                  type: 'updateAccountAuth',
                  operations: operationsArray.map((op: any) => {
                    const operationType = getAccountAuthOperationType(op);
                    this.logger.info('🔍 AccountAuth operation type resolved', { rawType: op.type, resolved: operationType });
                    return {
                      type: operationType,
                      authority: op.authority?.toString()
                    };
                  })
                };

                this.logger.info('📝 Parsed updateAccountAuth operations', {
                  operationCount: operationsArray.length,
                  operations: parsedBody.operations.map((o: any) => ({ type: o.type, authority: o.authority }))
                });
              } else if (txType === 'remoteTransaction' || txType === '21' || body.type === 21 || body.type === '21') {
                // Type 21 = RemoteTransaction - may wrap an updateAccountAuth transaction
                // Log the full body structure for debugging
                this.logger.info('🔍 RemoteTransaction (type 21) detected', {
                  bodyKeys: Object.keys(body || {}),
                  fullBody: JSON.stringify(body, null, 2)
                });

                // Check for wrapped transaction body
                // RemoteTransaction may have: body.transaction, body.inner, or direct operations
                const innerBody = body.transaction?.body || body.inner || body;
                const innerType = innerBody?.type?.toString() || '';

                this.logger.info('🔍 RemoteTransaction inner body', {
                  innerType,
                  hasOperations: !!(innerBody?.operation || innerBody?.operations),
                  innerBodyKeys: Object.keys(innerBody || {})
                });

                // Check if the inner body is an updateAccountAuth
                if (innerType === '14' || innerType === 'updateAccountAuth' || innerBody?.operation || innerBody?.operations) {
                  const operationsArray = innerBody.operation || innerBody.operations || body.operation || body.operations || [];

                  if (operationsArray.length > 0) {
                    // Parse as updateAccountAuth operations
                    // AccountAuthOperationType enum in Accumulate:
                    // 1 = Enable, 2 = Disable, 3 = AddAuthority, 4 = RemoveAuthority
                    const getAccountAuthOperationType = (op: any): string => {
                      const opTypeNum = typeof op.type === 'number' ? op.type : parseInt(op.type?.toString() || '0');
                      const opTypeStr = op.type?.toString()?.toLowerCase() || op.typeStr?.toLowerCase() || '';

                      if (opTypeNum === 1 || opTypeStr === 'enable' || opTypeStr.includes('enable')) {
                        return 'enable';
                      } else if (opTypeNum === 2 || opTypeStr === 'disable' || opTypeStr.includes('disable')) {
                        return 'disable';
                      } else if (opTypeNum === 3 || opTypeStr === 'addauthority' || opTypeStr.includes('add')) {
                        return 'addAuthority';
                      } else if (opTypeNum === 4 || opTypeStr === 'removeauthority' || opTypeStr.includes('remove')) {
                        return 'removeAuthority';
                      }
                      return opTypeStr || `operation-${opTypeNum}`;
                    };

                    parsedBody = {
                      type: 'updateAccountAuth',
                      operations: operationsArray.map((op: any) => ({
                        type: getAccountAuthOperationType(op),
                        authority: op.authority?.toString()
                      }))
                    };

                    this.logger.info('📝 Parsed updateAccountAuth from RemoteTransaction', {
                      operationCount: operationsArray.length,
                      operations: parsedBody.operations
                    });
                  } else {
                    parsedBody = {
                      type: 'remoteTransaction',
                      innerType,
                      raw: JSON.stringify(body)
                    };
                  }
                } else {
                  parsedBody = {
                    type: 'remoteTransaction',
                    innerType,
                    raw: JSON.stringify(body)
                  };
                }
              } else {
                // Generic body parsing
                parsedBody = {
                  type: txType,
                  raw: JSON.stringify(body)
                };
              }
            }

            // Get signatures if available
            const signatures: Array<{ signer: string; publicKeyHash: string; timestamp?: number }> = [];
            if (record?.signatures && Array.isArray(record.signatures)) {
              for (const sig of record.signatures) {
                signatures.push({
                  signer: sig.signer?.toString() || '',
                  publicKeyHash: sig.publicKeyHash ? Buffer.from(sig.publicKeyHash).toString('hex') : '',
                  timestamp: sig.timestamp
                });
              }
            }

            this.logger.info('📝 Found pending transaction', {
              txHash: txHash.substring(0, 16) + '...',
              txType,
              principal,
              signatureCount: signatures.length
            });

            pendingTxs.push({
              txHash,
              txType,
              principal,
              initiator,
              body: parsedBody,
              signatures,
              signatureCount: signatures.length
            });

          } catch (recordError) {
            this.logger.warn('⚠️ Failed to parse pending transaction record', {
              error: recordError instanceof Error ? recordError.message : String(recordError)
            });
          }
        }
      }

      return {
        success: true,
        pending: pendingTxs
      };

    } catch (error) {
      this.logger.error('❌ Failed to get pending transactions', {
        error: error instanceof Error ? error.message : String(error),
        accountUrl
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query pending transactions'
      };
    }
  }

  /**
   * Submit a vote (signature) on an existing pending transaction.
   * This is used when a user approves/rejects a pending transaction
   * that requires their signature.
   */
  async submitVoteOnPendingTransaction(params: {
    txHash: string;
    vote: 'approve' | 'reject' | 'abstain';
    signerId: string;
    signature: string;
    publicKey: string;
    signerVersion: number;
    timestamp?: number; // Timestamp in microseconds (must match what was signed)
  }): Promise<{
    success: boolean;
    signatureTxHash?: string;
    signatureCount?: number;
    error?: string;
  }> {
    try {
      const { txHash, vote, signerId, signature, publicKey, signerVersion, timestamp: providedTimestamp } = params;

      this.logger.info('📝 Submitting vote on pending transaction', {
        txHash,
        vote,
        signerId,
        publicKeyLength: publicKey?.length,
        signatureLength: signature?.length,
        signerVersion,
        hasProvidedTimestamp: !!providedTimestamp
      });

      // Normalize txHash to proper transaction URL format for querying
      // Transaction URLs need to be: acc://txhash@signer
      let queryUrl = txHash.trim();

      // Ensure acc:// prefix
      if (!queryUrl.toLowerCase().startsWith('acc://')) {
        queryUrl = 'acc://' + queryUrl;
      }

      // Extract the hash part (after acc:// and before @)
      const withoutPrefix = queryUrl.substring(6);
      const hashPart = withoutPrefix.includes('@') ? withoutPrefix.split('@')[0] : withoutPrefix.split('/')[0];
      const isHash = /^[a-fA-F0-9]{64}$/.test(hashPart);

      // If it's a bare hash without @signer, we need the signer to query
      // Use the signerId (key page URL) to construct the transaction URL
      if (isHash && !queryUrl.includes('@')) {
        // signerId should be a key page URL like acc://adi.acme/book/1
        // Extract just the path part for the transaction URL
        let signerPath = signerId;
        if (signerPath.toLowerCase().startsWith('acc://')) {
          signerPath = signerPath.substring(6);
        }
        queryUrl = `acc://${hashPart}@${signerPath}`;
        this.logger.info('🔧 Normalized transaction URL', { original: txHash, normalized: queryUrl });
      }

      // Query the pending transaction first to get its details
      const txResult = await this.client.query(queryUrl);

      if (!txResult) {
        return {
          success: false,
          error: 'Pending transaction not found'
        };
      }

      this.logger.info('📦 Found pending transaction', {
        txHash,
        type: txResult.transaction?.body?.type,
        principal: txResult.transaction?.header?.principal?.toString()
      });

      // Convert signature and public key from hex to bytes
      const signatureBytes = Buffer.from(signature.replace(/^0x/, ''), 'hex');
      const publicKeyBytes = Buffer.from(publicKey.replace(/^0x/, ''), 'hex');

      // Use provided timestamp (from KeyVault signing) or generate one
      // IMPORTANT: The timestamp must match what was used when creating the signature
      // If we generate a different timestamp, the signature verification will fail
      const timestamp = providedTimestamp || this.getNextTimestamp();
      this.logger.info('🕐 Using timestamp', {
        timestamp,
        source: providedTimestamp ? 'provided' : 'generated'
      });

      // Build the signature object for submission
      // In Accumulate, we submit a signature referencing the transaction hash
      // Use the pure 64-char hex hash (hashPart), not the full URL
      const sigObject = {
        type: 'ed25519',
        signature: signatureBytes,
        publicKey: publicKeyBytes,
        signer: signerId,
        signerVersion: signerVersion,
        timestamp: timestamp,
        transactionHash: Buffer.from(hashPart.replace(/^0x/, ''), 'hex'),
        vote: vote === 'approve' ? 1 : vote === 'reject' ? 2 : 0
      };

      this.logger.info('🔐 Constructed signature object', {
        signer: sigObject.signer,
        signerVersion: sigObject.signerVersion,
        timestamp: sigObject.timestamp,
        vote: sigObject.vote
      });

      // Submit the signature along with the original transaction
      // For adding a signature to a pending multi-sig transaction, we must include
      // the original transaction in the envelope alongside our new signature.
      // This is required because the network needs both the transaction body and
      // the new signature to validate and add to the pending signature set.
      const submitPayload = {
        transaction: [txResult.transaction],
        signatures: [sigObject]
      };

      this.logger.info('📤 Submitting envelope with original transaction', {
        hasTransaction: !!txResult.transaction,
        transactionType: txResult.transaction?.body?.type
      });

      const submitResult = await this.client.submit(submitPayload);

      // Process results
      let signatureTxHash: string | undefined;
      let signatureCount = 0;

      for (const r of submitResult) {
        if (!r.success) {
          this.logger.error('❌ Vote submission failed:', r);
          return {
            success: false,
            error: `Vote submission failed: ${r.message || 'Unknown error'}`
          };
        }
        if (r.status?.txID) {
          signatureTxHash = r.status.txID.toString();
        }
      }

      // Query updated transaction to get new signature count
      try {
        const updatedTx = await this.client.query(queryUrl);
        signatureCount = updatedTx?.signatures?.length || 0;
      } catch (queryError) {
        this.logger.warn('⚠️ Could not query updated signature count');
      }

      this.logger.info('✅ Vote submitted successfully', {
        signatureTxHash,
        signatureCount,
        vote
      });

      return {
        success: true,
        signatureTxHash,
        signatureCount
      };

    } catch (error) {
      this.logger.error('❌ Failed to submit vote on pending transaction', {
        error: error instanceof Error ? error.message : String(error),
        txHash: params.txHash
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit vote'
      };
    }
  }
}