import { Logger } from './Logger.js';
import { AccumulateService } from './AccumulateService.js';
import crypto from 'crypto';

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

/** Convert a human-readable amount to base units for the given chain decimals */
function convertToBaseUnits(amount: string, decimals: number): string {
  const amountStr = amount.toString();
  const [integerPart, decimalPart = ''] = amountStr.split('.');
  const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
  const baseUnitsString = integerPart + paddedDecimal;
  return BigInt(baseUnitsString).toString();
}

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

// Execution mode for multi-leg intents
export type ExecutionMode = 'sequential' | 'parallel' | 'atomic';

// Single leg definition for multi-leg intents
export interface IntentLeg {
  legId: string;
  role: 'source' | 'destination' | 'payment' | 'swap';
  chain: string;
  chainId: number;
  fromAddress: string;
  toAddress: string;
  amount: string;
  amountWei?: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  sequenceOrder?: number;
  dependsOnLegs?: string[];
  maxRetries?: number;
  priority?: number;
}

// Multi-leg transaction intent interface
export interface MultiLegTransactionIntent {
  id: string;
  legs: IntentLeg[];
  adiUrl: string;
  initiatedBy: string;
  timestamp: number;
  executionMode?: ExecutionMode;
  description?: string;
}

// Intent creation request interface
export interface CreateIntentRequest {
  intent: CertenTransactionIntent;
  contractAddresses: ContractAddresses;
  executionParameters?: Partial<ExecutionParameters>;
  validationRules?: Partial<ValidationRules>;
  expirationMinutes?: number;
  proofClass?: ProofClass;  // Optional: defaults to 'on_demand'
}

// Multi-leg intent creation request interface
export interface CreateMultiLegIntentRequest {
  intent: MultiLegTransactionIntent;
  contractAddresses: ContractAddresses;
  executionParameters?: Partial<ExecutionParameters>;
  validationRules?: Partial<ValidationRules>;
  expirationMinutes?: number;
  proofClass?: ProofClass;
  executionMode?: ExecutionMode;
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
   * Creates a multi-leg Certen transaction intent and writes it to Accumulate
   * Supports 1-N legs targeting same or different chains
   */
  async createMultiLegTransactionIntent(
    request: CreateMultiLegIntentRequest,
    adiPrivateKey: string,
    signerKeyPageUrl?: string
  ): Promise<CreateIntentResponse> {
    try {
      this.logger.info('🎯 Creating multi-leg Certen transaction intent', {
        intentId: request.intent.id,
        legCount: request.intent.legs.length,
        executionMode: request.executionMode || 'sequential'
      });

      // Validate multi-leg intent
      const validationResult = this.validateMultiLegIntent(request.intent);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Multi-leg intent validation failed: ${validationResult.errors.join(', ')}`
        };
      }

      // Generate multi-leg data entries
      const dataEntries = this.createMultiLegDataEntryPayload(
        request.intent,
        request.contractAddresses,
        request.validationRules,
        request.expirationMinutes,
        request.proofClass || 'on_demand',
        request.executionMode || 'sequential'
      );

      // Extract ADI and data account names
      const adiUrl = request.intent.adiUrl;
      const adiName = this.extractAdiName(adiUrl);
      const dataAccountName = 'data';

      this.logger.info('📝 Writing multi-leg intent to Accumulate blockchain', {
        adiName,
        dataAccountName,
        memo: CERTEN_INTENT_MEMO,
        dataEntriesCount: dataEntries.length,
        legCount: request.intent.legs.length
      });

      // Write intent to Accumulate
      const result = await this.writeIntentWithMemo(
        adiName,
        dataAccountName,
        dataEntries,
        CERTEN_INTENT_MEMO,
        adiPrivateKey,
        signerKeyPageUrl
      );

      if (result.success) {
        this.logger.info('✅ Multi-leg Certen intent created successfully', {
          intentId: request.intent.id,
          txHash: result.txHash,
          legCount: request.intent.legs.length,
          dataAccount: `${adiUrl}/${dataAccountName}`
        });

        return {
          success: true,
          txHash: result.txHash,
          intentId: request.intent.id,
          dataAccount: `acc://${adiName}.acme/${dataAccountName}`
        };
      } else {
        throw new Error(result.error || 'Failed to write multi-leg intent to Accumulate');
      }

    } catch (error) {
      this.logger.error('❌ Failed to create multi-leg Certen intent', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validates a multi-leg Certen transaction intent
   */
  private validateMultiLegIntent(intent: MultiLegTransactionIntent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!intent.id) errors.push('Intent ID is required');
    if (!intent.adiUrl) errors.push('ADI URL is required');
    if (!intent.initiatedBy) errors.push('Initiated by is required');
    if (!intent.legs || intent.legs.length === 0) errors.push('At least one leg is required');

    // Format validation
    if (intent.id && !this.isValidUUID(intent.id)) {
      errors.push('Intent ID must be a valid UUID');
    }

    if (intent.adiUrl && !intent.adiUrl.startsWith('acc://')) {
      errors.push('ADI URL must start with acc://');
    }

    // Validate each leg
    if (intent.legs) {
      intent.legs.forEach((leg, index) => {
        if (!leg.legId) errors.push(`Leg ${index}: legId is required`);
        if (!leg.chain) errors.push(`Leg ${index}: chain is required`);
        if (!leg.fromAddress) errors.push(`Leg ${index}: fromAddress is required`);
        if (!leg.toAddress) errors.push(`Leg ${index}: toAddress is required`);
        if (!leg.amount) errors.push(`Leg ${index}: amount is required`);

        if (leg.amount && !this.isValidAmount(leg.amount)) {
          errors.push(`Leg ${index}: amount must be a valid number`);
        }

        if (leg.fromAddress && !this.isValidAddress(leg.fromAddress)) {
          errors.push(`Leg ${index}: fromAddress format is invalid`);
        }

        if (leg.toAddress && !this.isValidAddress(leg.toAddress)) {
          errors.push(`Leg ${index}: toAddress format is invalid`);
        }
      });

      // Validate leg dependencies
      const legIds = new Set(intent.legs.map(l => l.legId));
      intent.legs.forEach((leg, index) => {
        if (leg.dependsOnLegs) {
          for (const depId of leg.dependsOnLegs) {
            if (!legIds.has(depId)) {
              errors.push(`Leg ${index}: depends on unknown leg ${depId}`);
            }
            if (depId === leg.legId) {
              errors.push(`Leg ${index}: cannot depend on itself`);
            }
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Creates the DoubleHashDataEntry payload for multi-leg intents
   * Uses version 2.0 format with multiple legs in crossChainData
   */
  private createMultiLegDataEntryPayload(
    intent: MultiLegTransactionIntent,
    contractAddresses: ContractAddresses,
    validationRules?: Partial<ValidationRules>,
    expirationMinutes: number = 95,
    proofClass: ProofClass = 'on_demand',
    executionMode: ExecutionMode = 'sequential'
  ): string[] {
    // data[0]: intentData - Protocol v2.0 for multi-leg
    const intentData = {
      "kind": "CERTEN_INTENT",
      "version": "2.0",  // Multi-leg version
      "proof_class": proofClass,
      "intentType": intent.legs.length === 1 ? "single_leg_cross_chain_transfer" : "multi_leg_cross_chain_transfer",
      "description": intent.description || `Multi-leg transfer with ${intent.legs.length} legs`,
      "organizationAdi": intent.adiUrl,
      "initiator": {
        "adi": intent.adiUrl,
        "by": intent.initiatedBy,
        "role": "organization_operator"
      },
      "priority": "high",
      "risk_level": "medium",
      "compliance_required": false,
      "leg_count": intent.legs.length,
      "execution_mode": executionMode,
      "intent_id": intent.id,
      "created_by": intent.initiatedBy,
      "created_at": new Date(intent.timestamp).toISOString(),
      "intent_class": "financial_transfer",
      "regulatory_jurisdiction": "global",
      "tags": ["multi-leg", executionMode]
    };

    // data[1]: crossChainData - Protocol v2.0 with multiple legs
    const legs = intent.legs.map((leg, index) => ({
      "legId": leg.legId,
      "role": leg.role || "destination",
      "chain": leg.chain.toLowerCase(),
      "chainId": leg.chainId,
      "network": leg.chain.toLowerCase(),
      "asset": {
        "symbol": leg.tokenSymbol || getChainSymbol(leg.chain),
        "decimals": getChainDecimals(leg.chain),
        "native": !leg.tokenAddress,
        "contract_address": leg.tokenAddress || null,
        "verified": true
      },
      "from": leg.fromAddress,
      "to": leg.toAddress,
      "amountEth": leg.amount,
      "amountWei": leg.amountWei || convertToBaseUnits(leg.amount, getChainDecimals(leg.chain)),
      "sequence_order": leg.sequenceOrder ?? index,
      "depends_on_legs": leg.dependsOnLegs || [],
      "max_retries": leg.maxRetries || 3,
      "priority": leg.priority || 0,
      "execution_sequence": index + 1,
      "conditional_execution": (leg.dependsOnLegs?.length ?? 0) > 0,
      "rollback_conditions": {
        "timeout_seconds": 3600,
        "failure_modes": ["gas_limit_exceeded", "insufficient_balance"]
      },
      "anchorContract": {
        "address": contractAddresses.anchor,
        "functionSelector": "createAnchorWithLegs(bytes32,bytes32,bytes32,uint8,(bytes32,uint8,address,address,uint256,bytes32)[])",
        "version": "v4.0"  // V4 for multi-leg support
      },
      "gasPolicy": {
        "maxFeePerGasGwei": "20",
        "maxPriorityFeePerGasGwei": "2",
        "gasLimit": 300000,
        "payer": "from",
        "gas_estimation_buffer": 1.2
      },
      "slippage_tolerance": "0.5%",
      "deadline_timestamp": Math.floor(Date.now() / 1000) + 3600
    }));

    // Build leg dependencies for crossChainData
    const legDependencies = intent.legs
      .filter(leg => leg.dependsOnLegs && leg.dependsOnLegs.length > 0)
      .map(leg => ({
        legId: leg.legId,
        dependsOn: leg.dependsOnLegs,
        condition: "success"
      }));

    const crossChainData = {
      "protocol": "CERTEN",
      "version": "2.0",  // Multi-leg version
      "operationGroupId": intent.id,
      "legs": legs,
      "execution_mode": executionMode,
      "leg_dependencies": legDependencies,
      "rollback_policy": {
        "mode": executionMode === 'atomic' ? "rollback_all" : "continue_on_failure",
        "partial_execution_allowed": executionMode !== 'atomic'
      },
      "timeout_policy": {
        "per_leg_timeout_seconds": 3600,
        "total_timeout_seconds": 3600 * intent.legs.length,
        "grace_period_seconds": 300
      },
      "atomicity": {
        "mode": executionMode === 'atomic' ? "all_or_nothing" : "best_effort",
        "rollback_strategy": executionMode === 'atomic' ? "all_or_nothing" : "partial_allowed",
        "partial_execution_allowed": executionMode !== 'atomic'
      },
      "execution_constraints": {
        "mode": executionMode,
        "max_execution_time_seconds": 3600 * intent.legs.length,
        "required_confirmations": 1,
        "parallel_execution": executionMode === 'parallel'
      },
      "cross_chain_routing": {
        "bridge_type": "certen_anchor_v4",
        "relay_mechanism": "proof_based",
        "finality_requirements": "fast"
      }
    };

    // data[2]: governanceData
    const governanceData = {
      "organizationAdi": intent.adiUrl,
      "authorization": {
        "required_key_book": `${intent.adiUrl}/book`,
        "required_key_page": `${intent.adiUrl}/book/page`,
        "signature_threshold": 1,
        "required_signers": [`${intent.adiUrl}/book`],
        "roles": [
          {
            "role": "DEFAULT_SIGNER",
            "keyPage": `${intent.adiUrl}/book/page`
          }
        ],
        "authorization_hash": this.calculateMultiLegAuthorizationHash(intent)
      },
      "validation_rules": {
        "max_amount": validationRules?.maxAmount || "10.0",
        "daily_limit": validationRules?.dailyLimit || "100.0",
        "requires_approval": validationRules?.requiresApproval || false,
        "risk_level": "medium"
      },
      "compliance_checks": {
        "aml_required": false,
        "kyc_verified": true,
        "sanctions_check": "passed",
        "jurisdiction": "compliant"
      }
    };

    // data[3]: replayData
    const nowMs = Date.now();
    const nowSeconds = Math.floor(nowMs / 1000);
    const nonce = `certen_multileg_${nowMs}_${Math.random().toString(36).substring(7)}`;
    const expiresAtSeconds = nowSeconds + (expirationMinutes * 60);

    const replayData = {
      "nonce": nonce,
      "created_at": nowSeconds,
      "expires_at": expiresAtSeconds,
      "intent_hash": "",
      "chain_nonces": this.buildChainNonces(intent.legs),
      "execution_window": {
        "start_time": nowSeconds,
        "end_time": expiresAtSeconds,
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
      JSON.stringify(intentData),
      JSON.stringify(crossChainData),
      JSON.stringify(governanceData),
      JSON.stringify(replayData)
    ];
  }

  /**
   * Builds chain nonces for all unique chains in legs
   */
  private buildChainNonces(legs: IntentLeg[]): Record<string, string> {
    const nonces: Record<string, string> = { "accumulated": "1" };
    const seenChains = new Set<string>();

    for (const leg of legs) {
      const chainKey = leg.chain.toLowerCase();
      if (!seenChains.has(chainKey)) {
        nonces[chainKey] = "latest";
        seenChains.add(chainKey);
      }
    }

    return nonces;
  }

  /**
   * Calculates authorization hash for multi-leg intent
   */
  private calculateMultiLegAuthorizationHash(intent: MultiLegTransactionIntent): string {
    const authData = intent.legs.map(leg =>
      `TRANSFER_${leg.amount}_${leg.tokenSymbol || 'ETH'}_TO_${leg.toAddress}`
    ).join('|');
    return '0x' + crypto.createHash('sha256').update(authData).digest('hex');
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
      gasLimit: 300000, // Must cover SSTORE in commitAnchor + BLS verification
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
    const chainDecimals = getChainDecimals(intent.toChain);
    const amountWei = convertToBaseUnits(intent.amount, chainDecimals);
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
            "symbol": intent.tokenSymbol || getChainSymbol(intent.toChain),
            "decimals": chainDecimals,
            "native": !intent.tokenAddress,
            "contract_address": intent.tokenAddress || null,
            "verified": true
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

  // ==========================================================================
  // TWO-PHASE SIGNING METHODS (for Key Vault external signing)
  // ==========================================================================

  /**
   * Prepare response interface for two-phase signing
   */
  // Note: PrepareMultiLegIntentResponse is defined below

  /**
   * Prepares a multi-leg Certen transaction intent for external signing (Phase 1)
   * Returns the hash to sign via Key Vault - does NOT sign or submit
   *
   * @param request - The multi-leg intent request
   * @param publicKey - The public key from Key Vault (required for hash computation)
   * @param signerKeyPageUrl - Optional signer key page URL
   * @returns PrepareMultiLegIntentResponse with hashToSign for Key Vault signing
   */
  async prepareMultiLegTransactionIntent(
    request: CreateMultiLegIntentRequest,
    publicKey: string,
    signerKeyPageUrl?: string
  ): Promise<PrepareMultiLegIntentResponse> {
    try {
      this.logger.info('🎯 Preparing multi-leg Certen transaction intent (Two-Phase Signing)', {
        intentId: request.intent.id,
        legCount: request.intent.legs.length,
        executionMode: request.executionMode || 'sequential',
        hasPublicKey: !!publicKey
      });

      // Validate public key is provided (required for two-phase signing)
      if (!publicKey) {
        return {
          success: false,
          error: 'publicKey is required for two-phase signing (from Key Vault)'
        };
      }

      // Validate multi-leg intent
      const validationResult = this.validateMultiLegIntent(request.intent);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Multi-leg intent validation failed: ${validationResult.errors.join(', ')}`
        };
      }

      // Generate multi-leg data entries (same as createMultiLegTransactionIntent)
      const dataEntries = this.createMultiLegDataEntryPayload(
        request.intent,
        request.contractAddresses,
        request.validationRules,
        request.expirationMinutes,
        request.proofClass || 'on_demand',
        request.executionMode || 'sequential'
      );

      // Extract ADI and data account names
      const adiUrl = request.intent.adiUrl;
      const adiName = this.extractAdiName(adiUrl);
      const dataAccountName = 'data';

      this.logger.info('📝 Preparing multi-leg intent for external signing', {
        adiName,
        dataAccountName,
        memo: CERTEN_INTENT_MEMO,
        dataEntriesCount: dataEntries.length,
        legCount: request.intent.legs.length
      });

      // Prepare transaction without signing - pass publicKey for proper hash computation
      const result = await this.accumulateService.prepareWriteData(
        adiName,
        dataAccountName,
        dataEntries,
        signerKeyPageUrl,
        CERTEN_INTENT_MEMO,
        publicKey  // Required for computing initiator and proper hash to sign
      );

      if (result.success) {
        this.logger.info('✅ Multi-leg intent prepared for signing', {
          requestId: result.requestId,
          transactionHash: result.transactionHash,
          hashToSign: result.hashToSign,
          legCount: request.intent.legs.length
        });

        return {
          success: true,
          requestId: result.requestId,
          transactionHash: result.transactionHash,
          hashToSign: result.hashToSign,  // THIS is what Key Vault should sign!
          signerKeyPageUrl: result.signerKeyPageUrl,
          keyPageVersion: result.keyPageVersion,
          intentId: request.intent.id,
          legCount: request.intent.legs.length,
          executionMode: request.executionMode || 'sequential',
          dataAccount: `acc://${adiName}.acme/${dataAccountName}`,
          message: 'Multi-leg intent prepared. Sign the hashToSign with Key Vault and call /api/v2/intents/submit-signed'
        };
      } else {
        throw new Error(result.error || 'Failed to prepare multi-leg intent');
      }

    } catch (error) {
      this.logger.error('❌ Failed to prepare multi-leg Certen intent', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submits a prepared multi-leg intent with external signature (Phase 2)
   *
   * @param requestId - The request ID from prepareMultiLegTransactionIntent
   * @param signature - The signature from Key Vault
   * @param publicKey - The public key from Key Vault
   * @returns CreateIntentResponse with txHash
   */
  async submitMultiLegWithExternalSignature(
    requestId: string,
    signature: string,
    publicKey: string
  ): Promise<CreateIntentResponse> {
    try {
      this.logger.info('📤 Submitting multi-leg intent with external signature (Two-Phase Signing)', {
        requestId,
        hasSignature: !!signature,
        hasPublicKey: !!publicKey
      });

      // Validate required fields
      if (!requestId) {
        return {
          success: false,
          error: 'requestId is required (from /api/v2/intents/prepare)'
        };
      }

      if (!signature) {
        return {
          success: false,
          error: 'signature is required (from Key Vault)'
        };
      }

      if (!publicKey) {
        return {
          success: false,
          error: 'publicKey is required (from Key Vault)'
        };
      }

      // Submit with external signature
      const result = await this.accumulateService.submitWithExternalSignature(
        requestId,
        signature,
        publicKey
      );

      if (result.success) {
        this.logger.info('✅ Multi-leg intent submitted with Key Vault signature', {
          txHash: result.txHash,
          signatureTxHash: result.signatureTxHash,
          dataTransactionHash: result.dataTransactionHash
        });

        return {
          success: true,
          txHash: result.txHash,
          roundId: result.signatureTxHash,
          dataAccount: result.dataAccountUrl
        };
      } else {
        throw new Error(result.error || 'Failed to submit multi-leg intent');
      }

    } catch (error) {
      this.logger.error('❌ Failed to submit multi-leg intent with external signature', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export prepare response interface
export interface PrepareMultiLegIntentResponse {
  success: boolean;
  requestId?: string;
  transactionHash?: string;
  hashToSign?: string;
  signerKeyPageUrl?: string;
  keyPageVersion?: number;
  intentId?: string;
  legCount?: number;
  executionMode?: string;
  dataAccount?: string;
  message?: string;
  error?: string;
}