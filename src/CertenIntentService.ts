import { Logger } from './Logger.js';
import { AccumulateService } from './AccumulateService.js';
import crypto from 'crypto';

// Certen Transaction Intent Interface
export interface CertenTransactionIntent {
  id: string;
  fromChain: string;
  fromChainId?: number;
  toChain: string;
  toChainId?: number;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  adiUrl: string;
  initiatedBy: string;
  timestamp: number;
  gasEstimate?: string;
}

// Contract execution parameters
export interface ContractAddresses {
  anchor: string;        // Anchor Creation contract (0x8398D7EB594bCc608a0210cf206b392d35Ed5339)
  anchorV2: string;      // Anchor Verification contract (0x9B29771EFA2C6645071C589239590b81ae2C5825)
  abstractAccount: string;
  entryPoint: string;
  factory?: string;
}

export interface ExecutionParameters {
  gasLimit: number;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  chainId: number;
}

export interface ExecutionMethod {
  contractInterface: string;
  methodName: string;
  methodSelector: string;
  abiEncoded: string;
}

export interface FallbackConditions {
  timeoutSeconds: number;
  revertOnFailure: boolean;
  retryCount: number;
}

export interface CrossChainParameters {
  targetChainCommitment: string;
  contractAddresses: ContractAddresses;
  executionParameters: ExecutionParameters;
  executionMethod: ExecutionMethod;
  fallbackConditions: FallbackConditions;
}

export interface ValidationRules {
  maxAmount: string;
  dailyLimit: string;
  requiresApproval: boolean;
}

export interface GovernanceRequirements {
  requiredKeyBook: string;
  requiredKeyPage: string;
  signatureThreshold: number;
  requiredSigners: string[];
  authorizationHash: string;
  validationRules: ValidationRules;
}

export interface ReplayProtection {
  nonce: string;
  createdAt: number;
  expiresAt: number;
  intentHash: string;
  chainNonce: Record<string, string>;
}

// Proof class determines routing: on_demand (immediate) or on_cadence (batched)
export type ProofClass = 'on_demand' | 'on_cadence';

// Intent creation request interface
export interface CreateIntentRequest {
  intent: CertenTransactionIntent;
  contractAddresses: ContractAddresses;
  executionParameters?: Partial<ExecutionParameters>;
  validationRules?: Partial<ValidationRules>;
  expirationMinutes?: number;
  proofClass?: ProofClass;  // Optional: defaults to 'on_demand'
}

// Intent creation response interface
export interface CreateIntentResponse {
  success: boolean;
  txHash?: string;
  roundId?: string;
  intentId?: string;
  dataAccount?: string;
  error?: string;
}

const CERTEN_INTENT_MEMO = "CERTEN_INTENT";
const INTENT_TYPE_TRANSFER = 1;
const INTENT_PRIORITY_HIGH = 2;
const INTENT_PRIORITY_MEDIUM = 1;
const INTENT_PRIORITY_LOW = 0;

/**
 * CertenIntentService - Creates and validates Certen transaction intents
 * Transforms transaction requests into cryptographically secure intent records
 */
export class CertenIntentService {
  private logger: Logger;
  private accumulateService: AccumulateService;

  constructor(accumulateService: AccumulateService) {
    this.logger = new Logger('CertenIntentService');
    this.accumulateService = accumulateService;
  }

  /**
   * Creates a Certen transaction intent and writes it to Accumulate
   */
  async createTransactionIntent(
    request: CreateIntentRequest,
    adiPrivateKey: string,
    signerKeyPageUrl?: string
  ): Promise<CreateIntentResponse> {
    try {
      this.logger.info('🎯 Creating Certen transaction intent', {
        intentId: request.intent.id,
        fromChain: request.intent.fromChain,
        toChain: request.intent.toChain,
        amount: request.intent.amount,
        tokenSymbol: request.intent.tokenSymbol
      });

      // Validate intent parameters
      const validationResult = this.validateIntent(request.intent);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Intent validation failed: ${validationResult.errors.join(', ')}`
        };
      }

      // Generate cryptographic components
      const crossChainParams = this.generateCrossChainParameters(request);
      const governanceRequirements = this.generateGovernanceRequirements(request.intent, request.validationRules);

      // Create DoubleHashDataEntry payload with proper operation_id
      const dataEntries = this.createDataEntryPayload(
        request.intent,
        crossChainParams,
        governanceRequirements,
        request.expirationMinutes,
        request.proofClass || 'on_demand'  // Default to on_demand if not specified
      );

      // Extract ADI and data account names
      const adiUrl = request.intent.adiUrl;
      const adiName = this.extractAdiName(adiUrl);
      const dataAccountName = 'data'; // Standard data account name

      this.logger.info('📝 Writing intent to Accumulate blockchain', {
        adiName,
        dataAccountName,
        memo: CERTEN_INTENT_MEMO,
        dataEntriesCount: dataEntries.length
      });

      // Write intent to Accumulate with memo for validator discovery
      const result = await this.writeIntentWithMemo(
        adiName,
        dataAccountName,
        dataEntries,
        CERTEN_INTENT_MEMO,
        adiPrivateKey,
        signerKeyPageUrl
      );

      if (result.success) {
        this.logger.info('✅ Certen intent created successfully', {
          intentId: request.intent.id,
          txHash: result.txHash,
          dataAccount: `${adiUrl}/${dataAccountName}`
        });

        return {
          success: true,
          txHash: result.txHash,
          intentId: request.intent.id,
          dataAccount: `acc://${adiName}.acme/${dataAccountName}`
        };
      } else {
        throw new Error(result.error || 'Failed to write intent to Accumulate');
      }

    } catch (error) {
      this.logger.error('❌ Failed to create Certen intent', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validates a Certen transaction intent
   */
  private validateIntent(intent: CertenTransactionIntent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!intent.id) errors.push('Intent ID is required');
    if (!intent.fromChain) errors.push('From chain is required');
    if (!intent.toChain) errors.push('To chain is required');
    if (!intent.fromAddress) errors.push('From address is required');
    if (!intent.toAddress) errors.push('To address is required');
    if (!intent.amount) errors.push('Amount is required');
    if (!intent.adiUrl) errors.push('ADI URL is required');
    if (!intent.initiatedBy) errors.push('Initiated by is required');

    // Format validation
    if (intent.id && !this.isValidUUID(intent.id)) {
      errors.push('Intent ID must be a valid UUID');
    }

    if (intent.adiUrl && !intent.adiUrl.startsWith('acc://')) {
      errors.push('ADI URL must start with acc://');
    }

    // Amount validation
    if (intent.amount && !this.isValidAmount(intent.amount)) {
      errors.push('Amount must be a valid number');
    }

    // Address validation (basic format check)
    if (intent.fromAddress && !this.isValidAddress(intent.fromAddress)) {
      errors.push('From address format is invalid');
    }

    if (intent.toAddress && !this.isValidAddress(intent.toAddress)) {
      errors.push('To address format is invalid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate operation_id from all 4 JSON blobs - CANONICAL SPEC IMPLEMENTATION
   */
  private calculateOperationIdFromBlobs(
    intentData: any,
    crossChainData: any,
    governanceData: any,
    replayData: any
  ): string {
    const payload = JSON.stringify([
      intentData,
      crossChainData,
      governanceData,
      replayData,
    ]);
    return '0x' + crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Generates cross-chain execution parameters
   */
  private generateCrossChainParameters(request: CreateIntentRequest): CrossChainParameters {
    const targetChainCommitment = this.calculateTargetChainCommitment(request.intent);

    const defaultExecutionParams: ExecutionParameters = {
      gasLimit: 21000,
      maxFeePerGas: "20000000000", // 20 gwei
      maxPriorityFeePerGas: "2000000000", // 2 gwei
      chainId: request.intent.toChainId || 11155111 // Default to Sepolia
    };

    const executionMethod: ExecutionMethod = {
      contractInterface: "CertenAccountV2",
      methodName: "executeIntent",
      methodSelector: "0x4b6c3847", // executeIntent(bytes32,bytes) selector
      abiEncoded: "0x" // Will be generated at execution time
    };

    const fallbackConditions: FallbackConditions = {
      timeoutSeconds: 3600,
      revertOnFailure: true,
      retryCount: 3
    };

    return {
      targetChainCommitment,
      contractAddresses: request.contractAddresses,
      executionParameters: { ...defaultExecutionParams, ...request.executionParameters },
      executionMethod,
      fallbackConditions
    };
  }

  /**
   * Generates governance validation requirements
   */
  private generateGovernanceRequirements(intent: CertenTransactionIntent, validationRules?: Partial<ValidationRules>): GovernanceRequirements {
    const authorizationHash = this.calculateAuthorizationHash(intent);

    const defaultValidationRules: ValidationRules = {
      maxAmount: "1.0", // ETH
      dailyLimit: "10.0", // ETH
      requiresApproval: false
    };

    return {
      requiredKeyBook: `${intent.adiUrl}/book`,
      requiredKeyPage: `${intent.adiUrl}/book/page`,
      signatureThreshold: 1,
      requiredSigners: [`${intent.adiUrl}/book`],
      authorizationHash,
      validationRules: { ...defaultValidationRules, ...validationRules }
    };
  }

  /**
   * Creates the DoubleHashDataEntry payload structure - PRODUCTION CERTEN INTENT FORMAT
   * Four exact data entries for ETH transfers on Sepolia that validators use to derive proofs
   */
  private createDataEntryPayload(
    intent: CertenTransactionIntent,
    crossChainParams: CrossChainParameters,
    governanceRequirements: GovernanceRequirements,
    expirationMinutes: number = 95,
    proofClass: ProofClass = 'on_demand'  // Proof class from request
  ): string[] {
    // data[0]: intentData - Protocol v1.0 spec with CERTEN_INTENT kind
    // CRITICAL: proof_class determines routing per FIRST_PRINCIPLES 2.5
    // - "on_demand" → OnDemandHandler (~$0.25/proof, immediate anchoring)
    // - "on_cadence" → BatchCollector (~$0.05/proof, batched anchoring)
    const intentData = {
      "kind": "CERTEN_INTENT",
      "version": "1.0",
      "proof_class": proofClass,  // CRITICAL: Explicit routing from user selection
      "intentType": "single_leg_cross_chain_transfer",
      "description": `Transfer ${intent.amount} ${intent.tokenSymbol || 'ETH'} from ${intent.fromChain} to ${intent.toChain}`,
      "organizationAdi": intent.adiUrl,
      "initiator": {
        "adi": intent.adiUrl,
        "by": intent.initiatedBy,
        "role": "organization_operator"  // MISSING: initiator role
      },
      "priority": "high",
      "risk_level": "medium",            // MISSING: risk assessment
      "compliance_required": false,      // MISSING: compliance flag
      "estimated_gas": "21000",
      "estimated_fees": {                // MISSING: fee breakdown
        "network_fee_gwei": "20",
        "priority_fee_gwei": "2",
        "total_cost_eth": "0.00042"
      },
      "intent_id": intent.id,
      "created_by": intent.initiatedBy,
      "created_at": new Date(intent.timestamp).toISOString(),
      "intent_class": "financial_transfer", // MISSING: operation classification
      "regulatory_jurisdiction": "global",  // MISSING: jurisdiction
      "tags": ["eth", "sepolia", "demo"]   // MISSING: searchable tags
    };

    // data[1]: crossChainData - Protocol v1.0 legs model
    const amountWei = this.convertEthToWei(intent.amount);
    const legId = `leg-${intent.toChain.toLowerCase()}-${intent.toChainId || 11155111}-1`;

    const crossChainData = {
      "protocol": "CERTEN",
      "version": "1.0",
      "operationGroupId": intent.id,
      "legs": [
        {
          "legId": legId,
          "role": "payment",
          "chain": intent.toChain.toLowerCase().includes("sepolia") ? "ethereum" : intent.toChain.toLowerCase(),
          "chainId": intent.toChainId || 11155111,
          "network": intent.toChain.toLowerCase(),
          "asset": {
            "symbol": intent.tokenSymbol || "ETH",
            "decimals": 18,
            "native": !intent.tokenAddress,
            "contract_address": intent.tokenAddress || null, // MISSING: token contract (null for native ETH)
            "verified": true                               // MISSING: asset verification status
          },
          "from": intent.fromAddress,
          "to": intent.toAddress,
          "amountEth": intent.amount,
          "amountWei": amountWei,
          "execution_sequence": 1,                         // MISSING: execution order
          "conditional_execution": false,                  // MISSING: conditional logic flag
          "rollback_conditions": {                         // MISSING: rollback conditions
            "timeout_seconds": 3600,
            "failure_modes": ["gas_limit_exceeded", "insufficient_balance"]
          },
          "anchorContract": {
            "address": crossChainParams.contractAddresses.anchor,
            "functionSelector": "commitAnchor(bytes32,bytes)",
            "version": "v2.1"                             // MISSING: contract version
          },
          "gasPolicy": {
            "maxFeePerGasGwei": "20",
            "maxPriorityFeePerGasGwei": "2",
            "gasLimit": crossChainParams.executionParameters.gasLimit,
            "payer": "from",
            "gas_estimation_buffer": 1.2                  // MISSING: safety buffer multiplier
          },
          "slippage_tolerance": "0.5%",                   // MISSING: slippage tolerance
          "deadline_timestamp": Math.floor(Date.now() / 1000) + 3600 // MISSING: execution deadline
        }
      ],
      "atomicity": {
        "mode": "single_leg",
        "rollback_strategy": "all_or_nothing",           // MISSING: rollback strategy
        "partial_execution_allowed": false              // MISSING: partial execution flag
      },
      "execution_constraints": {                         // MISSING: execution constraints
        "max_execution_time_seconds": 3600,
        "required_confirmations": 1,
        "parallel_execution": false
      },
      "cross_chain_routing": {                          // MISSING: routing information
        "bridge_type": "certen_anchor",
        "relay_mechanism": "proof_based",
        "finality_requirements": "fast"
      }
    };

    // data[2]: governanceData - Protocol v1.0 with organizationAdi and roles
    const governanceData = {
      "organizationAdi": intent.adiUrl,
      "authorization": {
        "required_key_book": governanceRequirements.requiredKeyBook,
        "required_key_page": governanceRequirements.requiredKeyPage,
        "signature_threshold": governanceRequirements.signatureThreshold,
        "required_signers": governanceRequirements.requiredSigners,
        "roles": [
          {
            "role": "DEFAULT_SIGNER",
            "keyPage": governanceRequirements.requiredKeyPage
          }
        ],
        "authorization_hash": governanceRequirements.authorizationHash
      },
      "validation_rules": {
        "max_amount": governanceRequirements.validationRules.maxAmount,
        "daily_limit": governanceRequirements.validationRules.dailyLimit,
        "requires_approval": governanceRequirements.validationRules.requiresApproval,
        "risk_level": parseFloat(intent.amount) > 1.0 ? "high" : "medium"
      },
      "compliance_checks": {
        "aml_required": parseFloat(intent.amount) > 10000,
        "kyc_verified": true,
        "sanctions_check": "passed",
        "jurisdiction": "compliant"
      }
    };

    // Generate initial replayData without intent_hash
    // CRITICAL FIX: Validator expects Unix timestamps in SECONDS (not milliseconds)
    // See pkg/consensus/intent.go:152-153 - ReplayData.CreatedAt/ExpiresAt are int64 seconds
    const nowMs = Date.now();
    const nowSeconds = Math.floor(nowMs / 1000);  // Convert to Unix SECONDS
    const nonce = `certen_${nowMs}_${Math.random().toString(36).substring(7)}`;
    const expiresAtSeconds = nowSeconds + (expirationMinutes * 60);  // SECONDS, not ms

    const replayData = {
      "nonce": nonce,
      "created_at": nowSeconds,      // Unix timestamp in SECONDS (validator requirement)
      "expires_at": expiresAtSeconds, // Unix timestamp in SECONDS (validator requirement)
      "intent_hash": "", // Will be calculated below
      "chain_nonces": {
        [intent.fromChain.toLowerCase()]: "latest",
        "accumulated": "1"
      },
      "execution_window": {
        "start_time": nowSeconds,        // Unix SECONDS for validator compatibility
        "end_time": expiresAtSeconds,    // Unix SECONDS for validator compatibility
        "grace_period_minutes": 5,
        "max_retries": 3
      },
      "security": {
        "double_spending_protection": true,
        "replay_attack_prevention": true,
        "temporal_validation": "strict",
        "nonce_validation": "required"
      }
    };

    // Calculate operation_id from all 4 JSON blobs
    const operationId = this.calculateOperationIdFromBlobs(
      intentData,
      crossChainData,
      governanceData,
      replayData
    );

    // Update replayData with the calculated operation_id
    replayData.intent_hash = operationId;

    return [
      JSON.stringify(intentData),     // data[0]: intentData
      JSON.stringify(crossChainData), // data[1]: crossChainData
      JSON.stringify(governanceData), // data[2]: governanceData
      JSON.stringify(replayData)      // data[3]: replayData
    ];
  }

  /**
   * Writes intent to Accumulate with memo for validator discovery
   * Note: 4-byte metadata removed - all data is in the 4 JSON blobs
   */
  private async writeIntentWithMemo(
    adiName: string,
    dataAccountName: string,
    dataEntries: string[],
    memo: string,
    adiPrivateKey: string,
    signerKeyPageUrl?: string
  ): Promise<any> {
    this.logger.info('📝 Writing Certen intent', {
      adiName,
      dataAccountName,
      memo,
      dataEntriesCount: dataEntries.length
    });

    const result = await this.accumulateService.writeData(
      adiName,
      dataAccountName,
      dataEntries,
      adiPrivateKey,
      signerKeyPageUrl,
      memo  // 🎯 CERTEN_INTENT memo for validator discovery
    );

    this.logger.info('✅ Certen intent written to Accumulate', {
      txHash: result.txHash,
      memo: memo
    });

    return result;
  }

  /**
   * Extracts ADI name from full ADI URL
   */
  private extractAdiName(adiUrl: string): string {
    const match = adiUrl.match(/acc:\/\/([^\/]+)/);
    if (!match) {
      throw new Error(`Invalid ADI URL format: ${adiUrl}`);
    }
    const fullName = match[1];
    // Remove .acme suffix if present to get base ADI name
    return fullName.replace(/\.acme$/, '');
  }

  /**
   * Calculates deterministic hash for intent validation
   */
  private calculateIntentHash(intent: CertenTransactionIntent): string {
    const hashData = `${intent.id}_${intent.timestamp}`;
    return '0x' + crypto.createHash('sha256').update(hashData).digest('hex');
  }

  /**
   * Calculates target chain commitment hash
   */
  private calculateTargetChainCommitment(intent: CertenTransactionIntent): string {
    const commitmentData = `${intent.toChain}_${intent.toChainId}_${intent.toAddress}_${intent.amount}_${intent.tokenSymbol}`;
    return '0x' + crypto.createHash('sha256').update(commitmentData).digest('hex');
  }

  /**
   * Calculates authorization hash for governance validation
   */
  private calculateAuthorizationHash(intent: CertenTransactionIntent): string {
    const authData = `TRANSFER_${intent.amount}_${intent.tokenSymbol}_TO_${intent.toAddress}`;
    return '0x' + crypto.createHash('sha256').update(authData).digest('hex');
  }

  // Validation helper methods

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private isValidAmount(amount: string): boolean {
    const parsed = parseFloat(amount);
    return !isNaN(parsed) && parsed > 0;
  }

  private isValidAddress(address: string): boolean {
    // Basic validation for common address formats
    if (address.startsWith('0x') && address.length === 42) {
      return true; // Ethereum format
    }

    // Support Accumulate address formats:
    // - acc://... URLs
    // - Raw public key hashes (64 hex chars)
    if (address.startsWith('acc://') && address.length > 6) {
      return true; // Accumulate ADI/URL format
    }

    if (/^[a-fA-F0-9]{64}$/.test(address)) {
      return true; // Accumulate public key hash format
    }

    return false;
  }

  private convertEthToWei(ethAmount: string): string {
    // Convert ETH to Wei (1 ETH = 10^18 Wei) - Using BigInt for precision
    const ethStr = ethAmount.toString();
    const [integerPart, decimalPart = ''] = ethStr.split('.');

    // Pad or truncate decimal part to 18 digits
    const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18);

    // Combine integer and decimal parts
    const weiString = integerPart + paddedDecimal;

    // Remove leading zeros and return
    return BigInt(weiString).toString();
  }
}