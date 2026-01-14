import { AccountAuthOperationType, AccountType, BookType, BookTypeArgs, DataEntryType, ExecutorVersion, ExecutorVersionArgs, KeyPageOperationType, NetworkMaintenanceOperationType, PartitionType, PartitionTypeArgs, SignatureType, TransactionType, TransactionTypeArgs, VoteType, VoteTypeArgs } from "./enums_gen.js";
import { Account, AccountArgs, AccountAuthOperation, AccountAuthOperationArgs, DataEntry, DataEntryArgs, KeyPageOperation, KeyPageOperationArgs, NetworkMaintenanceOperation, NetworkMaintenanceOperationArgs, Signature, SignatureArgs, TransactionBody, TransactionBodyArgs } from "./unions_gen.js";
import { AccumulateTxID as TxID, TxIDArgs } from "../address/txid.js";
import { AccumulateURL as URL, URLArgs } from "../address/url.js";
import * as errors2 from "../errors/index.js";
import type { Fee, FeeArgs, AllowedTransactions, AllowedTransactionsArgs, AnchorBody, AnchorBodyArgs, Signer, SignerArgs, TransactionResult, TransactionResultArgs } from "./index.js";
import * as merkle from "../merkle/index.js";
import { ChainType, ChainTypeArgs } from "../merkle/index.js";
import { TransactionBase } from "./base.js";
export type ADIArgs = {
    url?: URLArgs;
    authorities?: (AuthorityEntry | AuthorityEntryArgs | undefined)[];
};
export type ADIArgsWithType = ADIArgs & {
    type: AccountType.Identity | "identity";
};
export declare class ADI {
    readonly type = AccountType.Identity;
    url?: URL;
    authorities?: (AuthorityEntry | undefined)[];
    constructor(args: ADIArgs);
    copy(): ADI;
    asObject(): ADIArgsWithType;
}
export type AccountAuthArgs = {
    authorities?: (AuthorityEntry | AuthorityEntryArgs | undefined)[];
};
export declare class AccountAuth {
    authorities?: (AuthorityEntry | undefined)[];
    constructor(args: AccountAuthArgs);
    copy(): AccountAuth;
    asObject(): AccountAuthArgs;
}
export type AccumulateDataEntryArgs = {
    data?: (Uint8Array | string | undefined)[];
};
export type AccumulateDataEntryArgsWithType = AccumulateDataEntryArgs & {
    type: DataEntryType.Accumulate | "accumulate";
};
export declare class AccumulateDataEntry {
    readonly type = DataEntryType.Accumulate;
    data?: (Uint8Array | undefined)[];
    constructor(args: AccumulateDataEntryArgs);
    copy(): AccumulateDataEntry;
    asObject(): AccumulateDataEntryArgsWithType;
}
export type AcmeFaucetArgs = {
    url?: URLArgs;
};
export type AcmeFaucetArgsWithType = AcmeFaucetArgs & {
    type: TransactionType.AcmeFaucet | "acmeFaucet";
};
export declare class AcmeFaucet {
    readonly type = TransactionType.AcmeFaucet;
    url?: URL;
    constructor(args: AcmeFaucetArgs);
    copy(): AcmeFaucet;
    asObject(): AcmeFaucetArgsWithType;
}
export type AcmeOracleArgs = {
    price?: number;
};
export declare class AcmeOracle {
    price?: number;
    constructor(args: AcmeOracleArgs);
    copy(): AcmeOracle;
    asObject(): AcmeOracleArgs;
}
export type ActivateProtocolVersionArgs = {
    version?: ExecutorVersionArgs;
};
export type ActivateProtocolVersionArgsWithType = ActivateProtocolVersionArgs & {
    type: TransactionType.ActivateProtocolVersion | "activateProtocolVersion";
};
export declare class ActivateProtocolVersion {
    readonly type = TransactionType.ActivateProtocolVersion;
    version?: ExecutorVersion;
    constructor(args: ActivateProtocolVersionArgs);
    copy(): ActivateProtocolVersion;
    asObject(): ActivateProtocolVersionArgsWithType;
}
export type AddAccountAuthorityOperationArgs = {
    authority?: URLArgs;
};
export type AddAccountAuthorityOperationArgsWithType = AddAccountAuthorityOperationArgs & {
    type: AccountAuthOperationType.AddAuthority | "addAuthority";
};
export declare class AddAccountAuthorityOperation {
    readonly type = AccountAuthOperationType.AddAuthority;
    authority?: URL;
    constructor(args: AddAccountAuthorityOperationArgs);
    copy(): AddAccountAuthorityOperation;
    asObject(): AddAccountAuthorityOperationArgsWithType;
}
export type AddCreditsArgs = {
    recipient?: URLArgs;
    amount?: bigint | string | number;
    oracle?: number;
};
export type AddCreditsArgsWithType = AddCreditsArgs & {
    type: TransactionType.AddCredits | "addCredits";
};
export declare class AddCredits {
    readonly type = TransactionType.AddCredits;
    recipient?: URL;
    amount?: bigint;
    oracle?: number;
    constructor(args: AddCreditsArgs);
    copy(): AddCredits;
    asObject(): AddCreditsArgsWithType;
}
export type AddCreditsResultArgs = {
    amount?: bigint | string | number;
    credits?: number;
    oracle?: number;
};
export type AddCreditsResultArgsWithType = AddCreditsResultArgs & {
    type: TransactionType.AddCredits | "addCredits";
};
export declare class AddCreditsResult {
    readonly type = TransactionType.AddCredits;
    amount?: bigint;
    credits?: number;
    oracle?: number;
    constructor(args: AddCreditsResultArgs);
    copy(): AddCreditsResult;
    asObject(): AddCreditsResultArgsWithType;
}
export type AddKeyOperationArgs = {
    entry?: KeySpecParams | KeySpecParamsArgs;
};
export type AddKeyOperationArgsWithType = AddKeyOperationArgs & {
    type: KeyPageOperationType.Add | "add";
};
export declare class AddKeyOperation {
    readonly type = KeyPageOperationType.Add;
    entry?: KeySpecParams;
    constructor(args: AddKeyOperationArgs);
    copy(): AddKeyOperation;
    asObject(): AddKeyOperationArgsWithType;
}
export type AnchorLedgerArgs = {
    url?: URLArgs;
    minorBlockSequenceNumber?: number;
    majorBlockIndex?: number;
    majorBlockTime?: Date | string;
    pendingMajorBlockAnchors?: (URLArgs | undefined)[];
    sequence?: (PartitionSyntheticLedger | PartitionSyntheticLedgerArgs | undefined)[];
};
export type AnchorLedgerArgsWithType = AnchorLedgerArgs & {
    type: AccountType.AnchorLedger | "anchorLedger";
};
export declare class AnchorLedger {
    readonly type = AccountType.AnchorLedger;
    url?: URL;
    minorBlockSequenceNumber?: number;
    majorBlockIndex?: number;
    majorBlockTime?: Date;
    pendingMajorBlockAnchors?: (URL | undefined)[];
    sequence?: (PartitionSyntheticLedger | undefined)[];
    constructor(args: AnchorLedgerArgs);
    copy(): AnchorLedger;
    asObject(): AnchorLedgerArgsWithType;
}
export type AnchorMetadataArgs = {
    name?: string;
    type?: ChainTypeArgs;
    account?: URLArgs;
    index?: number;
    sourceIndex?: number;
    sourceBlock?: number;
    entry?: Uint8Array | string;
};
export declare class AnchorMetadata {
    name?: string;
    type?: ChainType;
    account?: URL;
    index?: number;
    sourceIndex?: number;
    sourceBlock?: number;
    entry?: Uint8Array;
    constructor(args: AnchorMetadataArgs);
    copy(): AnchorMetadata;
    asObject(): AnchorMetadataArgs;
}
export type AnnotatedReceiptArgs = {
    receipt?: merkle.Receipt | merkle.ReceiptArgs;
    anchor?: AnchorMetadata | AnchorMetadataArgs;
};
export declare class AnnotatedReceipt {
    receipt?: merkle.Receipt;
    anchor?: AnchorMetadata;
    constructor(args: AnnotatedReceiptArgs);
    copy(): AnnotatedReceipt;
    asObject(): AnnotatedReceiptArgs;
}
export type AuthorityEntryArgs = {
    url?: URLArgs;
    disabled?: boolean;
};
export declare class AuthorityEntry {
    url?: URL;
    disabled?: boolean;
    constructor(args: AuthorityEntryArgs);
    copy(): AuthorityEntry;
    asObject(): AuthorityEntryArgs;
}
export type AuthoritySignatureArgs = {
    origin?: URLArgs;
    authority?: URLArgs;
    vote?: VoteTypeArgs;
    txID?: TxIDArgs;
    cause?: TxIDArgs;
    delegator?: (URLArgs | undefined)[];
    memo?: string;
};
export type AuthoritySignatureArgsWithType = AuthoritySignatureArgs & {
    type: SignatureType.Authority | "authority";
};
export declare class AuthoritySignature {
    readonly type = SignatureType.Authority;
    origin?: URL;
    authority?: URL;
    vote?: VoteType;
    txID?: TxID;
    cause?: TxID;
    delegator?: (URL | undefined)[];
    memo?: string;
    constructor(args: AuthoritySignatureArgs);
    copy(): AuthoritySignature;
    asObject(): AuthoritySignatureArgsWithType;
}
export type BTCLegacySignatureArgs = {
    publicKey?: Uint8Array | string;
    signature?: Uint8Array | string;
    signer?: URLArgs;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteTypeArgs;
    transactionHash?: Uint8Array | string;
    memo?: string;
    data?: Uint8Array | string;
};
export type BTCLegacySignatureArgsWithType = BTCLegacySignatureArgs & {
    type: SignatureType.BTCLegacy | "btclegacy";
};
export declare class BTCLegacySignature {
    readonly type = SignatureType.BTCLegacy;
    publicKey?: Uint8Array;
    signature?: Uint8Array;
    signer?: URL;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteType;
    transactionHash?: Uint8Array;
    memo?: string;
    data?: Uint8Array;
    constructor(args: BTCLegacySignatureArgs);
    copy(): BTCLegacySignature;
    asObject(): BTCLegacySignatureArgsWithType;
}
export type BTCSignatureArgs = {
    publicKey?: Uint8Array | string;
    signature?: Uint8Array | string;
    signer?: URLArgs;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteTypeArgs;
    transactionHash?: Uint8Array | string;
    memo?: string;
    data?: Uint8Array | string;
};
export type BTCSignatureArgsWithType = BTCSignatureArgs & {
    type: SignatureType.BTC | "btc";
};
export declare class BTCSignature {
    readonly type = SignatureType.BTC;
    publicKey?: Uint8Array;
    signature?: Uint8Array;
    signer?: URL;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteType;
    transactionHash?: Uint8Array;
    memo?: string;
    data?: Uint8Array;
    constructor(args: BTCSignatureArgs);
    copy(): BTCSignature;
    asObject(): BTCSignatureArgsWithType;
}
export type BlockEntryArgs = {
    account?: URLArgs;
    chain?: string;
    index?: number;
};
export declare class BlockEntry {
    account?: URL;
    chain?: string;
    index?: number;
    constructor(args: BlockEntryArgs);
    copy(): BlockEntry;
    asObject(): BlockEntryArgs;
}
export type BlockLedgerArgs = {
    url?: URLArgs;
    index?: number;
    time?: Date | string;
    entries?: (BlockEntry | BlockEntryArgs | undefined)[];
};
export type BlockLedgerArgsWithType = BlockLedgerArgs & {
    type: AccountType.BlockLedger | "blockLedger";
};
export declare class BlockLedger {
    readonly type = AccountType.BlockLedger;
    url?: URL;
    index?: number;
    time?: Date;
    entries?: (BlockEntry | undefined)[];
    constructor(args: BlockLedgerArgs);
    copy(): BlockLedger;
    asObject(): BlockLedgerArgsWithType;
}
export type BlockValidatorAnchorArgs = {
    source?: URLArgs;
    majorBlockIndex?: number;
    minorBlockIndex?: number;
    rootChainIndex?: number;
    rootChainAnchor?: Uint8Array | string;
    stateTreeAnchor?: Uint8Array | string;
    acmeBurnt?: bigint | string | number;
};
export type BlockValidatorAnchorArgsWithType = BlockValidatorAnchorArgs & {
    type: TransactionType.BlockValidatorAnchor | "blockValidatorAnchor";
};
export declare class BlockValidatorAnchor {
    readonly type = TransactionType.BlockValidatorAnchor;
    source?: URL;
    majorBlockIndex?: number;
    minorBlockIndex?: number;
    rootChainIndex?: number;
    rootChainAnchor?: Uint8Array;
    stateTreeAnchor?: Uint8Array;
    acmeBurnt?: bigint;
    constructor(args: BlockValidatorAnchorArgs);
    copy(): BlockValidatorAnchor;
    asObject(): BlockValidatorAnchorArgsWithType;
}
export type BurnCreditsArgs = {
    amount?: number;
};
export type BurnCreditsArgsWithType = BurnCreditsArgs & {
    type: TransactionType.BurnCredits | "burnCredits";
};
export declare class BurnCredits {
    readonly type = TransactionType.BurnCredits;
    amount?: number;
    constructor(args: BurnCreditsArgs);
    copy(): BurnCredits;
    asObject(): BurnCreditsArgsWithType;
}
export type BurnTokensArgs = {
    amount?: bigint | string | number;
};
export type BurnTokensArgsWithType = BurnTokensArgs & {
    type: TransactionType.BurnTokens | "burnTokens";
};
export declare class BurnTokens {
    readonly type = TransactionType.BurnTokens;
    amount?: bigint;
    constructor(args: BurnTokensArgs);
    copy(): BurnTokens;
    asObject(): BurnTokensArgsWithType;
}
export type ChainMetadataArgs = {
    name?: string;
    type?: ChainTypeArgs;
};
export declare class ChainMetadata {
    name?: string;
    type?: ChainType;
    constructor(args: ChainMetadataArgs);
    copy(): ChainMetadata;
    asObject(): ChainMetadataArgs;
}
export type ChainParamsArgs = {
    data?: Uint8Array | string;
    isUpdate?: boolean;
};
export declare class ChainParams {
    data?: Uint8Array;
    isUpdate?: boolean;
    constructor(args: ChainParamsArgs);
    copy(): ChainParams;
    asObject(): ChainParamsArgs;
}
export type CreateDataAccountArgs = {
    url?: URLArgs;
    authorities?: (URLArgs | undefined)[];
};
export type CreateDataAccountArgsWithType = CreateDataAccountArgs & {
    type: TransactionType.CreateDataAccount | "createDataAccount";
};
export declare class CreateDataAccount {
    readonly type = TransactionType.CreateDataAccount;
    url?: URL;
    authorities?: (URL | undefined)[];
    constructor(args: CreateDataAccountArgs);
    copy(): CreateDataAccount;
    asObject(): CreateDataAccountArgsWithType;
}
export type CreateIdentityArgs = {
    url?: URLArgs;
    keyHash?: Uint8Array | string;
    keyBookUrl?: URLArgs;
    authorities?: (URLArgs | undefined)[];
};
export type CreateIdentityArgsWithType = CreateIdentityArgs & {
    type: TransactionType.CreateIdentity | "createIdentity";
};
export declare class CreateIdentity {
    readonly type = TransactionType.CreateIdentity;
    url?: URL;
    keyHash?: Uint8Array;
    keyBookUrl?: URL;
    authorities?: (URL | undefined)[];
    constructor(args: CreateIdentityArgs);
    copy(): CreateIdentity;
    asObject(): CreateIdentityArgsWithType;
}
export type CreateKeyBookArgs = {
    url?: URLArgs;
    publicKeyHash?: Uint8Array | string;
    authorities?: (URLArgs | undefined)[];
};
export type CreateKeyBookArgsWithType = CreateKeyBookArgs & {
    type: TransactionType.CreateKeyBook | "createKeyBook";
};
export declare class CreateKeyBook {
    readonly type = TransactionType.CreateKeyBook;
    url?: URL;
    publicKeyHash?: Uint8Array;
    authorities?: (URL | undefined)[];
    constructor(args: CreateKeyBookArgs);
    copy(): CreateKeyBook;
    asObject(): CreateKeyBookArgsWithType;
}
export type CreateKeyPageArgs = {
    keys?: (KeySpecParams | KeySpecParamsArgs | undefined)[];
};
export type CreateKeyPageArgsWithType = CreateKeyPageArgs & {
    type: TransactionType.CreateKeyPage | "createKeyPage";
};
export declare class CreateKeyPage {
    readonly type = TransactionType.CreateKeyPage;
    keys?: (KeySpecParams | undefined)[];
    constructor(args: CreateKeyPageArgs);
    copy(): CreateKeyPage;
    asObject(): CreateKeyPageArgsWithType;
}
export type CreateLiteTokenAccountArgs = {};
export type CreateLiteTokenAccountArgsWithType = {
    type: TransactionType.CreateLiteTokenAccount | "createLiteTokenAccount";
};
export declare class CreateLiteTokenAccount {
    readonly type = TransactionType.CreateLiteTokenAccount;
    constructor(_: CreateLiteTokenAccountArgs);
    copy(): CreateLiteTokenAccount;
    asObject(): CreateLiteTokenAccountArgsWithType;
}
export type CreateTokenArgs = {
    url?: URLArgs;
    symbol?: string;
    precision?: number;
    properties?: URLArgs;
    supplyLimit?: bigint | string | number;
    authorities?: (URLArgs | undefined)[];
};
export type CreateTokenArgsWithType = CreateTokenArgs & {
    type: TransactionType.CreateToken | "createToken";
};
export declare class CreateToken {
    readonly type = TransactionType.CreateToken;
    url?: URL;
    symbol?: string;
    precision?: number;
    properties?: URL;
    supplyLimit?: bigint;
    authorities?: (URL | undefined)[];
    constructor(args: CreateTokenArgs);
    copy(): CreateToken;
    asObject(): CreateTokenArgsWithType;
}
export type CreateTokenAccountArgs = {
    url?: URLArgs;
    tokenUrl?: URLArgs;
    authorities?: (URLArgs | undefined)[];
    proof?: TokenIssuerProof | TokenIssuerProofArgs;
};
export type CreateTokenAccountArgsWithType = CreateTokenAccountArgs & {
    type: TransactionType.CreateTokenAccount | "createTokenAccount";
};
export declare class CreateTokenAccount {
    readonly type = TransactionType.CreateTokenAccount;
    url?: URL;
    tokenUrl?: URL;
    authorities?: (URL | undefined)[];
    proof?: TokenIssuerProof;
    constructor(args: CreateTokenAccountArgs);
    copy(): CreateTokenAccount;
    asObject(): CreateTokenAccountArgsWithType;
}
export type CreditRecipientArgs = {
    url?: URLArgs;
    amount?: number;
};
export declare class CreditRecipient {
    url?: URL;
    amount?: number;
    constructor(args: CreditRecipientArgs);
    copy(): CreditRecipient;
    asObject(): CreditRecipientArgs;
}
export type DataAccountArgs = {
    url?: URLArgs;
    authorities?: (AuthorityEntry | AuthorityEntryArgs | undefined)[];
    entry?: DataEntry | DataEntryArgs;
};
export type DataAccountArgsWithType = DataAccountArgs & {
    type: AccountType.DataAccount | "dataAccount";
};
export declare class DataAccount {
    readonly type = AccountType.DataAccount;
    url?: URL;
    authorities?: (AuthorityEntry | undefined)[];
    entry?: DataEntry;
    constructor(args: DataAccountArgs);
    copy(): DataAccount;
    asObject(): DataAccountArgsWithType;
}
export type DelegatedSignatureArgs = {
    signature?: Signature | SignatureArgs;
    delegator?: URLArgs;
};
export type DelegatedSignatureArgsWithType = DelegatedSignatureArgs & {
    type: SignatureType.Delegated | "delegated";
};
export declare class DelegatedSignature {
    readonly type = SignatureType.Delegated;
    signature?: Signature;
    delegator?: URL;
    constructor(args: DelegatedSignatureArgs);
    copy(): DelegatedSignature;
    asObject(): DelegatedSignatureArgsWithType;
}
export type DirectoryAnchorArgs = {
    source?: URLArgs;
    majorBlockIndex?: number;
    minorBlockIndex?: number;
    rootChainIndex?: number;
    rootChainAnchor?: Uint8Array | string;
    stateTreeAnchor?: Uint8Array | string;
    updates?: (NetworkAccountUpdate | NetworkAccountUpdateArgs | undefined)[];
    receipts?: (PartitionAnchorReceipt | PartitionAnchorReceiptArgs | undefined)[];
    makeMajorBlock?: number;
    makeMajorBlockTime?: Date | string;
};
export type DirectoryAnchorArgsWithType = DirectoryAnchorArgs & {
    type: TransactionType.DirectoryAnchor | "directoryAnchor";
};
export declare class DirectoryAnchor {
    readonly type = TransactionType.DirectoryAnchor;
    source?: URL;
    majorBlockIndex?: number;
    minorBlockIndex?: number;
    rootChainIndex?: number;
    rootChainAnchor?: Uint8Array;
    stateTreeAnchor?: Uint8Array;
    updates?: (NetworkAccountUpdate | undefined)[];
    receipts?: (PartitionAnchorReceipt | undefined)[];
    makeMajorBlock?: number;
    makeMajorBlockTime?: Date;
    constructor(args: DirectoryAnchorArgs);
    copy(): DirectoryAnchor;
    asObject(): DirectoryAnchorArgsWithType;
}
export type DisableAccountAuthOperationArgs = {
    authority?: URLArgs;
};
export type DisableAccountAuthOperationArgsWithType = DisableAccountAuthOperationArgs & {
    type: AccountAuthOperationType.Disable | "disable";
};
export declare class DisableAccountAuthOperation {
    readonly type = AccountAuthOperationType.Disable;
    authority?: URL;
    constructor(args: DisableAccountAuthOperationArgs);
    copy(): DisableAccountAuthOperation;
    asObject(): DisableAccountAuthOperationArgsWithType;
}
export type DoubleHashDataEntryArgs = {
    data?: (Uint8Array | string | undefined)[];
};
export type DoubleHashDataEntryArgsWithType = DoubleHashDataEntryArgs & {
    type: DataEntryType.DoubleHash | "doubleHash";
};
export declare class DoubleHashDataEntry {
    readonly type = DataEntryType.DoubleHash;
    data?: (Uint8Array | undefined)[];
    constructor(args: DoubleHashDataEntryArgs);
    copy(): DoubleHashDataEntry;
    asObject(): DoubleHashDataEntryArgsWithType;
}
export type ED25519SignatureArgs = {
    publicKey?: Uint8Array | string;
    signature?: Uint8Array | string;
    signer?: URLArgs;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteTypeArgs;
    transactionHash?: Uint8Array | string;
    memo?: string;
    data?: Uint8Array | string;
};
export type ED25519SignatureArgsWithType = ED25519SignatureArgs & {
    type: SignatureType.ED25519 | "ed25519";
};
export declare class ED25519Signature {
    readonly type = SignatureType.ED25519;
    publicKey?: Uint8Array;
    signature?: Uint8Array;
    signer?: URL;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteType;
    transactionHash?: Uint8Array;
    memo?: string;
    data?: Uint8Array;
    constructor(args: ED25519SignatureArgs);
    copy(): ED25519Signature;
    asObject(): ED25519SignatureArgsWithType;
}
export type ETHSignatureArgs = {
    publicKey?: Uint8Array | string;
    signature?: Uint8Array | string;
    signer?: URLArgs;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteTypeArgs;
    transactionHash?: Uint8Array | string;
    memo?: string;
    data?: Uint8Array | string;
};
export type ETHSignatureArgsWithType = ETHSignatureArgs & {
    type: SignatureType.ETH | "eth";
};
export declare class ETHSignature {
    readonly type = SignatureType.ETH;
    publicKey?: Uint8Array;
    signature?: Uint8Array;
    signer?: URL;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteType;
    transactionHash?: Uint8Array;
    memo?: string;
    data?: Uint8Array;
    constructor(args: ETHSignatureArgs);
    copy(): ETHSignature;
    asObject(): ETHSignatureArgsWithType;
}
export type EcdsaSha256SignatureArgs = {
    publicKey?: Uint8Array | string;
    signature?: Uint8Array | string;
    signer?: URLArgs;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteTypeArgs;
    transactionHash?: Uint8Array | string;
    memo?: string;
    data?: Uint8Array | string;
};
export type EcdsaSha256SignatureArgsWithType = EcdsaSha256SignatureArgs & {
    type: SignatureType.EcdsaSha256 | "ecdsaSha256";
};
export declare class EcdsaSha256Signature {
    readonly type = SignatureType.EcdsaSha256;
    publicKey?: Uint8Array;
    signature?: Uint8Array;
    signer?: URL;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteType;
    transactionHash?: Uint8Array;
    memo?: string;
    data?: Uint8Array;
    constructor(args: EcdsaSha256SignatureArgs);
    copy(): EcdsaSha256Signature;
    asObject(): EcdsaSha256SignatureArgsWithType;
}
export type EmptyResultArgs = {};
export type EmptyResultArgsWithType = {
    type: TransactionType.Unknown | "unknown";
};
export declare class EmptyResult {
    readonly type = TransactionType.Unknown;
    constructor(_: EmptyResultArgs);
    copy(): EmptyResult;
    asObject(): EmptyResultArgsWithType;
}
export type EnableAccountAuthOperationArgs = {
    authority?: URLArgs;
};
export type EnableAccountAuthOperationArgsWithType = EnableAccountAuthOperationArgs & {
    type: AccountAuthOperationType.Enable | "enable";
};
export declare class EnableAccountAuthOperation {
    readonly type = AccountAuthOperationType.Enable;
    authority?: URL;
    constructor(args: EnableAccountAuthOperationArgs);
    copy(): EnableAccountAuthOperation;
    asObject(): EnableAccountAuthOperationArgsWithType;
}
export type ExpireOptionsArgs = {
    atTime?: Date | string;
};
export declare class ExpireOptions {
    atTime?: Date;
    constructor(args: ExpireOptionsArgs);
    copy(): ExpireOptions;
    asObject(): ExpireOptionsArgs;
}
export type FactomDataEntryArgs = {
    accountId?: Uint8Array | string;
    data?: Uint8Array | string;
    extIds?: (Uint8Array | string | undefined)[];
};
export declare class FactomDataEntry {
    accountId?: Uint8Array;
    data?: Uint8Array;
    extIds?: (Uint8Array | undefined)[];
    constructor(args: FactomDataEntryArgs);
    copy(): FactomDataEntry;
    asObject(): FactomDataEntryArgs;
}
export type FactomDataEntryWrapperArgs = {
    accountId?: Uint8Array | string;
    data?: Uint8Array | string;
    extIds?: (Uint8Array | string | undefined)[];
};
export type FactomDataEntryWrapperArgsWithType = FactomDataEntryWrapperArgs & {
    type: DataEntryType.Factom | "factom";
};
export declare class FactomDataEntryWrapper {
    readonly type = DataEntryType.Factom;
    accountId?: Uint8Array;
    data?: Uint8Array;
    extIds?: (Uint8Array | undefined)[];
    constructor(args: FactomDataEntryWrapperArgs);
    copy(): FactomDataEntryWrapper;
    asObject(): FactomDataEntryWrapperArgsWithType;
}
export type FeeScheduleArgs = {
    createIdentitySliding?: (FeeArgs | undefined)[];
    createSubIdentity?: FeeArgs;
    bareIdentityDiscount?: FeeArgs;
};
export declare class FeeSchedule {
    createIdentitySliding?: (Fee | undefined)[];
    createSubIdentity?: Fee;
    bareIdentityDiscount?: Fee;
    constructor(args: FeeScheduleArgs);
    copy(): FeeSchedule;
    asObject(): FeeScheduleArgs;
}
export type HoldUntilOptionsArgs = {
    minorBlock?: number;
};
export declare class HoldUntilOptions {
    minorBlock?: number;
    constructor(args: HoldUntilOptionsArgs);
    copy(): HoldUntilOptions;
    asObject(): HoldUntilOptionsArgs;
}
export type IndexEntryArgs = {
    source?: number;
    anchor?: number;
    blockIndex?: number;
    blockTime?: Date | string;
    rootIndexIndex?: number;
};
export declare class IndexEntry {
    source?: number;
    anchor?: number;
    blockIndex?: number;
    blockTime?: Date;
    rootIndexIndex?: number;
    constructor(args: IndexEntryArgs);
    copy(): IndexEntry;
    asObject(): IndexEntryArgs;
}
export type InternalSignatureArgs = {
    cause?: Uint8Array | string;
    transactionHash?: Uint8Array | string;
};
export type InternalSignatureArgsWithType = InternalSignatureArgs & {
    type: SignatureType.Internal | "internal";
};
export declare class InternalSignature {
    readonly type = SignatureType.Internal;
    cause?: Uint8Array;
    transactionHash?: Uint8Array;
    constructor(args: InternalSignatureArgs);
    copy(): InternalSignature;
    asObject(): InternalSignatureArgsWithType;
}
export type IssueTokensArgs = {
    recipient?: URLArgs;
    amount?: bigint | string | number;
    to?: (TokenRecipient | TokenRecipientArgs | undefined)[];
};
export type IssueTokensArgsWithType = IssueTokensArgs & {
    type: TransactionType.IssueTokens | "issueTokens";
};
export declare class IssueTokens {
    readonly type = TransactionType.IssueTokens;
    recipient?: URL;
    amount?: bigint;
    to?: (TokenRecipient | undefined)[];
    constructor(args: IssueTokensArgs);
    copy(): IssueTokens;
    asObject(): IssueTokensArgsWithType;
}
export type KeyBookArgs = {
    url?: URLArgs;
    bookType?: BookTypeArgs;
    authorities?: (AuthorityEntry | AuthorityEntryArgs | undefined)[];
    pageCount?: number;
};
export type KeyBookArgsWithType = KeyBookArgs & {
    type: AccountType.KeyBook | "keyBook";
};
export declare class KeyBook {
    readonly type = AccountType.KeyBook;
    url?: URL;
    bookType?: BookType;
    authorities?: (AuthorityEntry | undefined)[];
    pageCount?: number;
    constructor(args: KeyBookArgs);
    copy(): KeyBook;
    asObject(): KeyBookArgsWithType;
}
export type KeyPageArgs = {
    url?: URLArgs;
    creditBalance?: number;
    acceptThreshold?: number;
    rejectThreshold?: number;
    responseThreshold?: number;
    blockThreshold?: number;
    version?: number;
    keys?: (KeySpec | KeySpecArgs | undefined)[];
    transactionBlacklist?: AllowedTransactionsArgs;
};
export type KeyPageArgsWithType = KeyPageArgs & {
    type: AccountType.KeyPage | "keyPage";
};
export declare class KeyPage {
    readonly type = AccountType.KeyPage;
    url?: URL;
    creditBalance?: number;
    acceptThreshold?: number;
    rejectThreshold?: number;
    responseThreshold?: number;
    blockThreshold?: number;
    version?: number;
    keys?: (KeySpec | undefined)[];
    transactionBlacklist?: AllowedTransactions;
    constructor(args: KeyPageArgs);
    copy(): KeyPage;
    asObject(): KeyPageArgsWithType;
}
export type KeySpecArgs = {
    publicKeyHash?: Uint8Array | string;
    lastUsedOn?: number;
    delegate?: URLArgs;
};
export declare class KeySpec {
    publicKeyHash?: Uint8Array;
    lastUsedOn?: number;
    delegate?: URL;
    constructor(args: KeySpecArgs);
    copy(): KeySpec;
    asObject(): KeySpecArgs;
}
export type KeySpecParamsArgs = {
    keyHash?: Uint8Array | string;
    delegate?: URLArgs;
};
export declare class KeySpecParams {
    keyHash?: Uint8Array;
    delegate?: URL;
    constructor(args: KeySpecParamsArgs);
    copy(): KeySpecParams;
    asObject(): KeySpecParamsArgs;
}
export type LegacyED25519SignatureArgs = {
    timestamp?: number;
    publicKey?: Uint8Array | string;
    signature?: Uint8Array | string;
    signer?: URLArgs;
    signerVersion?: number;
    vote?: VoteTypeArgs;
    transactionHash?: Uint8Array | string;
};
export type LegacyED25519SignatureArgsWithType = LegacyED25519SignatureArgs & {
    type: SignatureType.LegacyED25519 | "legacyED25519";
};
export declare class LegacyED25519Signature {
    readonly type = SignatureType.LegacyED25519;
    timestamp?: number;
    publicKey?: Uint8Array;
    signature?: Uint8Array;
    signer?: URL;
    signerVersion?: number;
    vote?: VoteType;
    transactionHash?: Uint8Array;
    constructor(args: LegacyED25519SignatureArgs);
    copy(): LegacyED25519Signature;
    asObject(): LegacyED25519SignatureArgsWithType;
}
export type LiteDataAccountArgs = {
    url?: URLArgs;
};
export type LiteDataAccountArgsWithType = LiteDataAccountArgs & {
    type: AccountType.LiteDataAccount | "liteDataAccount";
};
export declare class LiteDataAccount {
    readonly type = AccountType.LiteDataAccount;
    url?: URL;
    constructor(args: LiteDataAccountArgs);
    copy(): LiteDataAccount;
    asObject(): LiteDataAccountArgsWithType;
}
export type LiteIdentityArgs = {
    url?: URLArgs;
    creditBalance?: number;
    lastUsedOn?: number;
};
export type LiteIdentityArgsWithType = LiteIdentityArgs & {
    type: AccountType.LiteIdentity | "liteIdentity";
};
export declare class LiteIdentity {
    readonly type = AccountType.LiteIdentity;
    url?: URL;
    creditBalance?: number;
    lastUsedOn?: number;
    constructor(args: LiteIdentityArgs);
    copy(): LiteIdentity;
    asObject(): LiteIdentityArgsWithType;
}
export type LiteTokenAccountArgs = {
    url?: URLArgs;
    tokenUrl?: URLArgs;
    balance?: bigint | string | number;
    lockHeight?: number;
};
export type LiteTokenAccountArgsWithType = LiteTokenAccountArgs & {
    type: AccountType.LiteTokenAccount | "liteTokenAccount";
};
export declare class LiteTokenAccount {
    readonly type = AccountType.LiteTokenAccount;
    url?: URL;
    tokenUrl?: URL;
    balance?: bigint;
    lockHeight?: number;
    constructor(args: LiteTokenAccountArgs);
    copy(): LiteTokenAccount;
    asObject(): LiteTokenAccountArgsWithType;
}
export type LockAccountArgs = {
    height?: number;
};
export type LockAccountArgsWithType = LockAccountArgs & {
    type: TransactionType.LockAccount | "lockAccount";
};
export declare class LockAccount {
    readonly type = TransactionType.LockAccount;
    height?: number;
    constructor(args: LockAccountArgs);
    copy(): LockAccount;
    asObject(): LockAccountArgsWithType;
}
export type NetworkAccountUpdateArgs = {
    name?: string;
    body?: TransactionBody | TransactionBodyArgs;
};
export declare class NetworkAccountUpdate {
    name?: string;
    body?: TransactionBody;
    constructor(args: NetworkAccountUpdateArgs);
    copy(): NetworkAccountUpdate;
    asObject(): NetworkAccountUpdateArgs;
}
export type NetworkDefinitionArgs = {
    networkName?: string;
    version?: number;
    partitions?: (PartitionInfo | PartitionInfoArgs | undefined)[];
    validators?: (ValidatorInfo | ValidatorInfoArgs | undefined)[];
};
export declare class NetworkDefinition {
    networkName?: string;
    version?: number;
    partitions?: (PartitionInfo | undefined)[];
    validators?: (ValidatorInfo | undefined)[];
    constructor(args: NetworkDefinitionArgs);
    copy(): NetworkDefinition;
    asObject(): NetworkDefinitionArgs;
}
export type NetworkGlobalsArgs = {
    operatorAcceptThreshold?: Rational | RationalArgs;
    validatorAcceptThreshold?: Rational | RationalArgs;
    majorBlockSchedule?: string;
    anchorEmptyBlocks?: boolean;
    feeSchedule?: FeeSchedule | FeeScheduleArgs;
    limits?: NetworkLimits | NetworkLimitsArgs;
};
export declare class NetworkGlobals {
    operatorAcceptThreshold?: Rational;
    validatorAcceptThreshold?: Rational;
    majorBlockSchedule?: string;
    anchorEmptyBlocks?: boolean;
    feeSchedule?: FeeSchedule;
    limits?: NetworkLimits;
    constructor(args: NetworkGlobalsArgs);
    copy(): NetworkGlobals;
    asObject(): NetworkGlobalsArgs;
}
export type NetworkLimitsArgs = {
    dataEntryParts?: number;
    accountAuthorities?: number;
    bookPages?: number;
    pageEntries?: number;
    identityAccounts?: number;
    pendingMajorBlocks?: number;
    eventsPerBlock?: number;
};
export declare class NetworkLimits {
    dataEntryParts?: number;
    accountAuthorities?: number;
    bookPages?: number;
    pageEntries?: number;
    identityAccounts?: number;
    pendingMajorBlocks?: number;
    eventsPerBlock?: number;
    constructor(args: NetworkLimitsArgs);
    copy(): NetworkLimits;
    asObject(): NetworkLimitsArgs;
}
export type NetworkMaintenanceArgs = {
    operations?: (NetworkMaintenanceOperation | NetworkMaintenanceOperationArgs | undefined)[];
};
export type NetworkMaintenanceArgsWithType = NetworkMaintenanceArgs & {
    type: TransactionType.NetworkMaintenance | "networkMaintenance";
};
export declare class NetworkMaintenance {
    readonly type = TransactionType.NetworkMaintenance;
    operations?: (NetworkMaintenanceOperation | undefined)[];
    constructor(args: NetworkMaintenanceArgs);
    copy(): NetworkMaintenance;
    asObject(): NetworkMaintenanceArgsWithType;
}
export type PartitionAnchorArgs = {
    source?: URLArgs;
    majorBlockIndex?: number;
    minorBlockIndex?: number;
    rootChainIndex?: number;
    rootChainAnchor?: Uint8Array | string;
    stateTreeAnchor?: Uint8Array | string;
};
export declare class PartitionAnchor {
    source?: URL;
    majorBlockIndex?: number;
    minorBlockIndex?: number;
    rootChainIndex?: number;
    rootChainAnchor?: Uint8Array;
    stateTreeAnchor?: Uint8Array;
    constructor(args: PartitionAnchorArgs);
    copy(): PartitionAnchor;
    asObject(): PartitionAnchorArgs;
}
export type PartitionAnchorReceiptArgs = {
    anchor?: PartitionAnchor | PartitionAnchorArgs;
    rootChainReceipt?: merkle.Receipt | merkle.ReceiptArgs;
};
export declare class PartitionAnchorReceipt {
    anchor?: PartitionAnchor;
    rootChainReceipt?: merkle.Receipt;
    constructor(args: PartitionAnchorReceiptArgs);
    copy(): PartitionAnchorReceipt;
    asObject(): PartitionAnchorReceiptArgs;
}
export type PartitionExecutorVersionArgs = {
    partition?: string;
    version?: ExecutorVersionArgs;
};
export declare class PartitionExecutorVersion {
    partition?: string;
    version?: ExecutorVersion;
    constructor(args: PartitionExecutorVersionArgs);
    copy(): PartitionExecutorVersion;
    asObject(): PartitionExecutorVersionArgs;
}
export type PartitionInfoArgs = {
    id?: string;
    type?: PartitionTypeArgs;
};
export declare class PartitionInfo {
    id?: string;
    type?: PartitionType;
    constructor(args: PartitionInfoArgs);
    copy(): PartitionInfo;
    asObject(): PartitionInfoArgs;
}
export type PartitionSignatureArgs = {
    sourceNetwork?: URLArgs;
    destinationNetwork?: URLArgs;
    sequenceNumber?: number;
    transactionHash?: Uint8Array | string;
};
export type PartitionSignatureArgsWithType = PartitionSignatureArgs & {
    type: SignatureType.Partition | "partition";
};
export declare class PartitionSignature {
    readonly type = SignatureType.Partition;
    sourceNetwork?: URL;
    destinationNetwork?: URL;
    sequenceNumber?: number;
    transactionHash?: Uint8Array;
    constructor(args: PartitionSignatureArgs);
    copy(): PartitionSignature;
    asObject(): PartitionSignatureArgsWithType;
}
export type PartitionSyntheticLedgerArgs = {
    url?: URLArgs;
    produced?: number;
    received?: number;
    delivered?: number;
    pending?: (TxIDArgs | undefined)[];
};
export declare class PartitionSyntheticLedger {
    url?: URL;
    produced?: number;
    received?: number;
    delivered?: number;
    pending?: (TxID | undefined)[];
    constructor(args: PartitionSyntheticLedgerArgs);
    copy(): PartitionSyntheticLedger;
    asObject(): PartitionSyntheticLedgerArgs;
}
export type PendingTransactionGCOperationArgs = {
    account?: URLArgs;
};
export type PendingTransactionGCOperationArgsWithType = PendingTransactionGCOperationArgs & {
    type: NetworkMaintenanceOperationType.PendingTransactionGC | "pendingTransactionGC";
};
export declare class PendingTransactionGCOperation {
    readonly type = NetworkMaintenanceOperationType.PendingTransactionGC;
    account?: URL;
    constructor(args: PendingTransactionGCOperationArgs);
    copy(): PendingTransactionGCOperation;
    asObject(): PendingTransactionGCOperationArgsWithType;
}
export type RCD1SignatureArgs = {
    publicKey?: Uint8Array | string;
    signature?: Uint8Array | string;
    signer?: URLArgs;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteTypeArgs;
    transactionHash?: Uint8Array | string;
    memo?: string;
    data?: Uint8Array | string;
};
export type RCD1SignatureArgsWithType = RCD1SignatureArgs & {
    type: SignatureType.RCD1 | "rcd1";
};
export declare class RCD1Signature {
    readonly type = SignatureType.RCD1;
    publicKey?: Uint8Array;
    signature?: Uint8Array;
    signer?: URL;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteType;
    transactionHash?: Uint8Array;
    memo?: string;
    data?: Uint8Array;
    constructor(args: RCD1SignatureArgs);
    copy(): RCD1Signature;
    asObject(): RCD1SignatureArgsWithType;
}
export type RationalArgs = {
    numerator?: number;
    denominator?: number;
};
export declare class Rational {
    numerator?: number;
    denominator?: number;
    constructor(args: RationalArgs);
    copy(): Rational;
    asObject(): RationalArgs;
}
export type ReceiptSignatureArgs = {
    sourceNetwork?: URLArgs;
    proof?: merkle.Receipt | merkle.ReceiptArgs;
    transactionHash?: Uint8Array | string;
};
export type ReceiptSignatureArgsWithType = ReceiptSignatureArgs & {
    type: SignatureType.Receipt | "receipt";
};
export declare class ReceiptSignature {
    readonly type = SignatureType.Receipt;
    sourceNetwork?: URL;
    proof?: merkle.Receipt;
    transactionHash?: Uint8Array;
    constructor(args: ReceiptSignatureArgs);
    copy(): ReceiptSignature;
    asObject(): ReceiptSignatureArgsWithType;
}
export type RemoteSignatureArgs = {
    destination?: URLArgs;
    signature?: Signature | SignatureArgs;
    cause?: (Uint8Array | string | undefined)[];
};
export type RemoteSignatureArgsWithType = RemoteSignatureArgs & {
    type: SignatureType.Remote | "remote";
};
export declare class RemoteSignature {
    readonly type = SignatureType.Remote;
    destination?: URL;
    signature?: Signature;
    cause?: (Uint8Array | undefined)[];
    constructor(args: RemoteSignatureArgs);
    copy(): RemoteSignature;
    asObject(): RemoteSignatureArgsWithType;
}
export type RemoteTransactionArgs = {
    hash?: Uint8Array | string;
};
export type RemoteTransactionArgsWithType = RemoteTransactionArgs & {
    type: TransactionType.Remote | "remote";
};
export declare class RemoteTransaction {
    readonly type = TransactionType.Remote;
    hash?: Uint8Array;
    constructor(args: RemoteTransactionArgs);
    copy(): RemoteTransaction;
    asObject(): RemoteTransactionArgsWithType;
}
export type RemoveAccountAuthorityOperationArgs = {
    authority?: URLArgs;
};
export type RemoveAccountAuthorityOperationArgsWithType = RemoveAccountAuthorityOperationArgs & {
    type: AccountAuthOperationType.RemoveAuthority | "removeAuthority";
};
export declare class RemoveAccountAuthorityOperation {
    readonly type = AccountAuthOperationType.RemoveAuthority;
    authority?: URL;
    constructor(args: RemoveAccountAuthorityOperationArgs);
    copy(): RemoveAccountAuthorityOperation;
    asObject(): RemoveAccountAuthorityOperationArgsWithType;
}
export type RemoveKeyOperationArgs = {
    entry?: KeySpecParams | KeySpecParamsArgs;
};
export type RemoveKeyOperationArgsWithType = RemoveKeyOperationArgs & {
    type: KeyPageOperationType.Remove | "remove";
};
export declare class RemoveKeyOperation {
    readonly type = KeyPageOperationType.Remove;
    entry?: KeySpecParams;
    constructor(args: RemoveKeyOperationArgs);
    copy(): RemoveKeyOperation;
    asObject(): RemoveKeyOperationArgsWithType;
}
export type RouteArgs = {
    length?: number;
    value?: number;
    partition?: string;
};
export declare class Route {
    length?: number;
    value?: number;
    partition?: string;
    constructor(args: RouteArgs);
    copy(): Route;
    asObject(): RouteArgs;
}
export type RouteOverrideArgs = {
    account?: URLArgs;
    partition?: string;
};
export declare class RouteOverride {
    account?: URL;
    partition?: string;
    constructor(args: RouteOverrideArgs);
    copy(): RouteOverride;
    asObject(): RouteOverrideArgs;
}
export type RoutingTableArgs = {
    overrides?: (RouteOverride | RouteOverrideArgs | undefined)[];
    routes?: (Route | RouteArgs | undefined)[];
};
export declare class RoutingTable {
    overrides?: (RouteOverride | undefined)[];
    routes?: (Route | undefined)[];
    constructor(args: RoutingTableArgs);
    copy(): RoutingTable;
    asObject(): RoutingTableArgs;
}
export type RsaSha256SignatureArgs = {
    publicKey?: Uint8Array | string;
    signature?: Uint8Array | string;
    signer?: URLArgs;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteTypeArgs;
    transactionHash?: Uint8Array | string;
    memo?: string;
    data?: Uint8Array | string;
};
export type RsaSha256SignatureArgsWithType = RsaSha256SignatureArgs & {
    type: SignatureType.RsaSha256 | "rsaSha256";
};
export declare class RsaSha256Signature {
    readonly type = SignatureType.RsaSha256;
    publicKey?: Uint8Array;
    signature?: Uint8Array;
    signer?: URL;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteType;
    transactionHash?: Uint8Array;
    memo?: string;
    data?: Uint8Array;
    constructor(args: RsaSha256SignatureArgs);
    copy(): RsaSha256Signature;
    asObject(): RsaSha256SignatureArgsWithType;
}
export type SendTokensArgs = {
    hash?: Uint8Array | string;
    meta?: unknown;
    to?: (TokenRecipient | TokenRecipientArgs | undefined)[];
};
export type SendTokensArgsWithType = SendTokensArgs & {
    type: TransactionType.SendTokens | "sendTokens";
};
export declare class SendTokens {
    readonly type = TransactionType.SendTokens;
    hash?: Uint8Array;
    meta?: unknown;
    to?: (TokenRecipient | undefined)[];
    constructor(args: SendTokensArgs);
    copy(): SendTokens;
    asObject(): SendTokensArgsWithType;
}
export type SetRejectThresholdKeyPageOperationArgs = {
    threshold?: number;
};
export type SetRejectThresholdKeyPageOperationArgsWithType = SetRejectThresholdKeyPageOperationArgs & {
    type: KeyPageOperationType.SetRejectThreshold | "setRejectThreshold";
};
export declare class SetRejectThresholdKeyPageOperation {
    readonly type = KeyPageOperationType.SetRejectThreshold;
    threshold?: number;
    constructor(args: SetRejectThresholdKeyPageOperationArgs);
    copy(): SetRejectThresholdKeyPageOperation;
    asObject(): SetRejectThresholdKeyPageOperationArgsWithType;
}
export type SetResponseThresholdKeyPageOperationArgs = {
    threshold?: number;
};
export type SetResponseThresholdKeyPageOperationArgsWithType = SetResponseThresholdKeyPageOperationArgs & {
    type: KeyPageOperationType.SetResponseThreshold | "setResponseThreshold";
};
export declare class SetResponseThresholdKeyPageOperation {
    readonly type = KeyPageOperationType.SetResponseThreshold;
    threshold?: number;
    constructor(args: SetResponseThresholdKeyPageOperationArgs);
    copy(): SetResponseThresholdKeyPageOperation;
    asObject(): SetResponseThresholdKeyPageOperationArgsWithType;
}
export type SetThresholdKeyPageOperationArgs = {
    threshold?: number;
};
export type SetThresholdKeyPageOperationArgsWithType = SetThresholdKeyPageOperationArgs & {
    type: KeyPageOperationType.SetThreshold | "setThreshold";
};
export declare class SetThresholdKeyPageOperation {
    readonly type = KeyPageOperationType.SetThreshold;
    threshold?: number;
    constructor(args: SetThresholdKeyPageOperationArgs);
    copy(): SetThresholdKeyPageOperation;
    asObject(): SetThresholdKeyPageOperationArgsWithType;
}
export type SignatureSetArgs = {
    vote?: VoteTypeArgs;
    signer?: URLArgs;
    transactionHash?: Uint8Array | string;
    signatures?: (Signature | SignatureArgs | undefined)[];
    authority?: URLArgs;
};
export type SignatureSetArgsWithType = SignatureSetArgs & {
    type: SignatureType.Set | "set";
};
export declare class SignatureSet {
    readonly type = SignatureType.Set;
    vote?: VoteType;
    signer?: URL;
    transactionHash?: Uint8Array;
    signatures?: (Signature | undefined)[];
    authority?: URL;
    constructor(args: SignatureSetArgs);
    copy(): SignatureSet;
    asObject(): SignatureSetArgsWithType;
}
export type SyntheticBurnTokensArgs = {
    cause?: TxIDArgs;
    source?: URLArgs;
    initiator?: URLArgs;
    feeRefund?: number;
    index?: number;
    amount?: bigint | string | number;
    isRefund?: boolean;
};
export type SyntheticBurnTokensArgsWithType = SyntheticBurnTokensArgs & {
    type: TransactionType.SyntheticBurnTokens | "syntheticBurnTokens";
};
export declare class SyntheticBurnTokens {
    readonly type = TransactionType.SyntheticBurnTokens;
    cause?: TxID;
    source?: URL;
    initiator?: URL;
    feeRefund?: number;
    index?: number;
    amount?: bigint;
    isRefund?: boolean;
    constructor(args: SyntheticBurnTokensArgs);
    copy(): SyntheticBurnTokens;
    asObject(): SyntheticBurnTokensArgsWithType;
}
export type SyntheticCreateIdentityArgs = {
    cause?: TxIDArgs;
    source?: URLArgs;
    initiator?: URLArgs;
    feeRefund?: number;
    index?: number;
    accounts?: (Account | AccountArgs | undefined)[];
};
export type SyntheticCreateIdentityArgsWithType = SyntheticCreateIdentityArgs & {
    type: TransactionType.SyntheticCreateIdentity | "syntheticCreateIdentity";
};
export declare class SyntheticCreateIdentity {
    readonly type = TransactionType.SyntheticCreateIdentity;
    cause?: TxID;
    source?: URL;
    initiator?: URL;
    feeRefund?: number;
    index?: number;
    accounts?: (Account | undefined)[];
    constructor(args: SyntheticCreateIdentityArgs);
    copy(): SyntheticCreateIdentity;
    asObject(): SyntheticCreateIdentityArgsWithType;
}
export type SyntheticDepositCreditsArgs = {
    cause?: TxIDArgs;
    source?: URLArgs;
    initiator?: URLArgs;
    feeRefund?: number;
    index?: number;
    amount?: number;
    acmeRefundAmount?: bigint | string | number;
    isRefund?: boolean;
};
export type SyntheticDepositCreditsArgsWithType = SyntheticDepositCreditsArgs & {
    type: TransactionType.SyntheticDepositCredits | "syntheticDepositCredits";
};
export declare class SyntheticDepositCredits {
    readonly type = TransactionType.SyntheticDepositCredits;
    cause?: TxID;
    source?: URL;
    initiator?: URL;
    feeRefund?: number;
    index?: number;
    amount?: number;
    acmeRefundAmount?: bigint;
    isRefund?: boolean;
    constructor(args: SyntheticDepositCreditsArgs);
    copy(): SyntheticDepositCredits;
    asObject(): SyntheticDepositCreditsArgsWithType;
}
export type SyntheticDepositTokensArgs = {
    cause?: TxIDArgs;
    source?: URLArgs;
    initiator?: URLArgs;
    feeRefund?: number;
    index?: number;
    token?: URLArgs;
    amount?: bigint | string | number;
    isIssuer?: boolean;
    isRefund?: boolean;
};
export type SyntheticDepositTokensArgsWithType = SyntheticDepositTokensArgs & {
    type: TransactionType.SyntheticDepositTokens | "syntheticDepositTokens";
};
export declare class SyntheticDepositTokens {
    readonly type = TransactionType.SyntheticDepositTokens;
    cause?: TxID;
    source?: URL;
    initiator?: URL;
    feeRefund?: number;
    index?: number;
    token?: URL;
    amount?: bigint;
    isIssuer?: boolean;
    isRefund?: boolean;
    constructor(args: SyntheticDepositTokensArgs);
    copy(): SyntheticDepositTokens;
    asObject(): SyntheticDepositTokensArgsWithType;
}
export type SyntheticForwardTransactionArgs = {
    signatures?: (RemoteSignature | RemoteSignatureArgs | undefined)[];
    transaction?: Transaction | TransactionArgs;
};
export type SyntheticForwardTransactionArgsWithType = SyntheticForwardTransactionArgs & {
    type: TransactionType.SyntheticForwardTransaction | "syntheticForwardTransaction";
};
export declare class SyntheticForwardTransaction {
    readonly type = TransactionType.SyntheticForwardTransaction;
    signatures?: (RemoteSignature | undefined)[];
    transaction?: Transaction;
    constructor(args: SyntheticForwardTransactionArgs);
    copy(): SyntheticForwardTransaction;
    asObject(): SyntheticForwardTransactionArgsWithType;
}
export type SyntheticLedgerArgs = {
    url?: URLArgs;
    sequence?: (PartitionSyntheticLedger | PartitionSyntheticLedgerArgs | undefined)[];
};
export type SyntheticLedgerArgsWithType = SyntheticLedgerArgs & {
    type: AccountType.SyntheticLedger | "syntheticLedger";
};
export declare class SyntheticLedger {
    readonly type = AccountType.SyntheticLedger;
    url?: URL;
    sequence?: (PartitionSyntheticLedger | undefined)[];
    constructor(args: SyntheticLedgerArgs);
    copy(): SyntheticLedger;
    asObject(): SyntheticLedgerArgsWithType;
}
export type SyntheticOriginArgs = {
    cause?: TxIDArgs;
    initiator?: URLArgs;
    feeRefund?: number;
    index?: number;
};
export declare class SyntheticOrigin {
    cause?: TxID;
    initiator?: URL;
    feeRefund?: number;
    index?: number;
    constructor(args: SyntheticOriginArgs);
    copy(): SyntheticOrigin;
    asObject(): SyntheticOriginArgs;
}
export type SyntheticWriteDataArgs = {
    cause?: TxIDArgs;
    source?: URLArgs;
    initiator?: URLArgs;
    feeRefund?: number;
    index?: number;
    entry?: DataEntry | DataEntryArgs;
};
export type SyntheticWriteDataArgsWithType = SyntheticWriteDataArgs & {
    type: TransactionType.SyntheticWriteData | "syntheticWriteData";
};
export declare class SyntheticWriteData {
    readonly type = TransactionType.SyntheticWriteData;
    cause?: TxID;
    source?: URL;
    initiator?: URL;
    feeRefund?: number;
    index?: number;
    entry?: DataEntry;
    constructor(args: SyntheticWriteDataArgs);
    copy(): SyntheticWriteData;
    asObject(): SyntheticWriteDataArgsWithType;
}
export type SystemGenesisArgs = {};
export type SystemGenesisArgsWithType = {
    type: TransactionType.SystemGenesis | "systemGenesis";
};
export declare class SystemGenesis {
    readonly type = TransactionType.SystemGenesis;
    constructor(_: SystemGenesisArgs);
    copy(): SystemGenesis;
    asObject(): SystemGenesisArgsWithType;
}
export type SystemLedgerArgs = {
    url?: URLArgs;
    index?: number;
    timestamp?: Date | string;
    acmeBurnt?: bigint | string | number;
    pendingUpdates?: (NetworkAccountUpdate | NetworkAccountUpdateArgs | undefined)[];
    anchor?: AnchorBody | AnchorBodyArgs;
    executorVersion?: ExecutorVersionArgs;
    bvnExecutorVersions?: (PartitionExecutorVersion | PartitionExecutorVersionArgs | undefined)[];
};
export type SystemLedgerArgsWithType = SystemLedgerArgs & {
    type: AccountType.SystemLedger | "systemLedger";
};
export declare class SystemLedger {
    readonly type = AccountType.SystemLedger;
    url?: URL;
    index?: number;
    timestamp?: Date;
    acmeBurnt?: bigint;
    pendingUpdates?: (NetworkAccountUpdate | undefined)[];
    anchor?: AnchorBody;
    executorVersion?: ExecutorVersion;
    bvnExecutorVersions?: (PartitionExecutorVersion | undefined)[];
    constructor(args: SystemLedgerArgs);
    copy(): SystemLedger;
    asObject(): SystemLedgerArgsWithType;
}
export type SystemWriteDataArgs = {
    entry?: DataEntry | DataEntryArgs;
    writeToState?: boolean;
};
export type SystemWriteDataArgsWithType = SystemWriteDataArgs & {
    type: TransactionType.SystemWriteData | "systemWriteData";
};
export declare class SystemWriteData {
    readonly type = TransactionType.SystemWriteData;
    entry?: DataEntry;
    writeToState?: boolean;
    constructor(args: SystemWriteDataArgs);
    copy(): SystemWriteData;
    asObject(): SystemWriteDataArgsWithType;
}
export type TokenAccountArgs = {
    url?: URLArgs;
    authorities?: (AuthorityEntry | AuthorityEntryArgs | undefined)[];
    tokenUrl?: URLArgs;
    balance?: bigint | string | number;
};
export type TokenAccountArgsWithType = TokenAccountArgs & {
    type: AccountType.TokenAccount | "tokenAccount";
};
export declare class TokenAccount {
    readonly type = AccountType.TokenAccount;
    url?: URL;
    authorities?: (AuthorityEntry | undefined)[];
    tokenUrl?: URL;
    balance?: bigint;
    constructor(args: TokenAccountArgs);
    copy(): TokenAccount;
    asObject(): TokenAccountArgsWithType;
}
export type TokenIssuerArgs = {
    url?: URLArgs;
    authorities?: (AuthorityEntry | AuthorityEntryArgs | undefined)[];
    symbol?: string;
    precision?: number;
    properties?: URLArgs;
    issued?: bigint | string | number;
    supplyLimit?: bigint | string | number;
};
export type TokenIssuerArgsWithType = TokenIssuerArgs & {
    type: AccountType.TokenIssuer | "tokenIssuer";
};
export declare class TokenIssuer {
    readonly type = AccountType.TokenIssuer;
    url?: URL;
    authorities?: (AuthorityEntry | undefined)[];
    symbol?: string;
    precision?: number;
    properties?: URL;
    issued?: bigint;
    supplyLimit?: bigint;
    constructor(args: TokenIssuerArgs);
    copy(): TokenIssuer;
    asObject(): TokenIssuerArgsWithType;
}
export type TokenIssuerProofArgs = {
    transaction?: CreateToken | CreateTokenArgs;
    receipt?: merkle.Receipt | merkle.ReceiptArgs;
};
export declare class TokenIssuerProof {
    transaction?: CreateToken;
    receipt?: merkle.Receipt;
    constructor(args: TokenIssuerProofArgs);
    copy(): TokenIssuerProof;
    asObject(): TokenIssuerProofArgs;
}
export type TokenRecipientArgs = {
    url?: URLArgs;
    amount?: bigint | string | number;
};
export declare class TokenRecipient {
    url?: URL;
    amount?: bigint;
    constructor(args: TokenRecipientArgs);
    copy(): TokenRecipient;
    asObject(): TokenRecipientArgs;
}
export type TransactionArgs = {
    header?: TransactionHeader | TransactionHeaderArgs;
    body?: TransactionBody | TransactionBodyArgs;
};
export declare class Transaction extends TransactionBase {
    header?: TransactionHeader;
    body?: TransactionBody;
    constructor(args: TransactionArgs);
    copy(): Transaction;
    asObject(): TransactionArgs;
}
export type TransactionHeaderArgs = {
    principal?: URLArgs;
    initiator?: Uint8Array | string;
    memo?: string;
    metadata?: Uint8Array | string;
    expire?: ExpireOptions | ExpireOptionsArgs;
    holdUntil?: HoldUntilOptions | HoldUntilOptionsArgs;
    authorities?: (URLArgs | undefined)[];
};
export declare class TransactionHeader {
    principal?: URL;
    initiator?: Uint8Array;
    memo?: string;
    metadata?: Uint8Array;
    expire?: ExpireOptions;
    holdUntil?: HoldUntilOptions;
    authorities?: (URL | undefined)[];
    constructor(args: TransactionHeaderArgs);
    copy(): TransactionHeader;
    asObject(): TransactionHeaderArgs;
}
export type TransactionStatusArgs = {
    txID?: TxIDArgs;
    code?: errors2.StatusArgs;
    error?: errors2.Error | errors2.ErrorArgs;
    result?: TransactionResult | TransactionResultArgs;
    received?: number;
    initiator?: URLArgs;
    signers?: (Signer | SignerArgs | undefined)[];
    sourceNetwork?: URLArgs;
    destinationNetwork?: URLArgs;
    sequenceNumber?: number;
    gotDirectoryReceipt?: boolean;
    proof?: merkle.Receipt | merkle.ReceiptArgs;
    anchorSigners?: (Uint8Array | string | undefined)[];
};
export declare class TransactionStatus {
    txID?: TxID;
    code?: errors2.Status;
    error?: errors2.Error;
    result?: TransactionResult;
    received?: number;
    initiator?: URL;
    signers?: (Signer | undefined)[];
    sourceNetwork?: URL;
    destinationNetwork?: URL;
    sequenceNumber?: number;
    gotDirectoryReceipt?: boolean;
    proof?: merkle.Receipt;
    anchorSigners?: (Uint8Array | undefined)[];
    constructor(args: TransactionStatusArgs);
    copy(): TransactionStatus;
    asObject(): TransactionStatusArgs;
}
export type TransferCreditsArgs = {
    to?: (CreditRecipient | CreditRecipientArgs | undefined)[];
};
export type TransferCreditsArgsWithType = TransferCreditsArgs & {
    type: TransactionType.TransferCredits | "transferCredits";
};
export declare class TransferCredits {
    readonly type = TransactionType.TransferCredits;
    to?: (CreditRecipient | undefined)[];
    constructor(args: TransferCreditsArgs);
    copy(): TransferCredits;
    asObject(): TransferCreditsArgsWithType;
}
export type TxIdSetArgs = {
    entries?: (TxIDArgs | undefined)[];
};
export declare class TxIdSet {
    entries?: (TxID | undefined)[];
    constructor(args: TxIdSetArgs);
    copy(): TxIdSet;
    asObject(): TxIdSetArgs;
}
export type TypedDataSignatureArgs = {
    publicKey?: Uint8Array | string;
    signature?: Uint8Array | string;
    signer?: URLArgs;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteTypeArgs;
    transactionHash?: Uint8Array | string;
    memo?: string;
    data?: Uint8Array | string;
    chainID?: bigint | string | number;
};
export type TypedDataSignatureArgsWithType = TypedDataSignatureArgs & {
    type: SignatureType.TypedData | "typedData";
};
export declare class TypedDataSignature {
    readonly type = SignatureType.TypedData;
    publicKey?: Uint8Array;
    signature?: Uint8Array;
    signer?: URL;
    signerVersion?: number;
    timestamp?: number;
    vote?: VoteType;
    transactionHash?: Uint8Array;
    memo?: string;
    data?: Uint8Array;
    chainID?: bigint;
    constructor(args: TypedDataSignatureArgs);
    copy(): TypedDataSignature;
    asObject(): TypedDataSignatureArgsWithType;
}
export type UnknownAccountArgs = {
    url?: URLArgs;
};
export type UnknownAccountArgsWithType = UnknownAccountArgs & {
    type: AccountType.Unknown | "unknown";
};
export declare class UnknownAccount {
    readonly type = AccountType.Unknown;
    url?: URL;
    constructor(args: UnknownAccountArgs);
    copy(): UnknownAccount;
    asObject(): UnknownAccountArgsWithType;
}
export type UnknownSignerArgs = {
    url?: URLArgs;
    version?: number;
};
export type UnknownSignerArgsWithType = UnknownSignerArgs & {
    type: AccountType.UnknownSigner | "unknownSigner";
};
export declare class UnknownSigner {
    readonly type = AccountType.UnknownSigner;
    url?: URL;
    version?: number;
    constructor(args: UnknownSignerArgs);
    copy(): UnknownSigner;
    asObject(): UnknownSignerArgsWithType;
}
export type UpdateAccountAuthArgs = {
    operations?: (AccountAuthOperation | AccountAuthOperationArgs | undefined)[];
};
export type UpdateAccountAuthArgsWithType = UpdateAccountAuthArgs & {
    type: TransactionType.UpdateAccountAuth | "updateAccountAuth";
};
export declare class UpdateAccountAuth {
    readonly type = TransactionType.UpdateAccountAuth;
    operations?: (AccountAuthOperation | undefined)[];
    constructor(args: UpdateAccountAuthArgs);
    copy(): UpdateAccountAuth;
    asObject(): UpdateAccountAuthArgsWithType;
}
export type UpdateAllowedKeyPageOperationArgs = {
    allow?: (TransactionTypeArgs | undefined)[];
    deny?: (TransactionTypeArgs | undefined)[];
};
export type UpdateAllowedKeyPageOperationArgsWithType = UpdateAllowedKeyPageOperationArgs & {
    type: KeyPageOperationType.UpdateAllowed | "updateAllowed";
};
export declare class UpdateAllowedKeyPageOperation {
    readonly type = KeyPageOperationType.UpdateAllowed;
    allow?: (TransactionType | undefined)[];
    deny?: (TransactionType | undefined)[];
    constructor(args: UpdateAllowedKeyPageOperationArgs);
    copy(): UpdateAllowedKeyPageOperation;
    asObject(): UpdateAllowedKeyPageOperationArgsWithType;
}
export type UpdateKeyArgs = {
    newKeyHash?: Uint8Array | string;
};
export type UpdateKeyArgsWithType = UpdateKeyArgs & {
    type: TransactionType.UpdateKey | "updateKey";
};
export declare class UpdateKey {
    readonly type = TransactionType.UpdateKey;
    newKeyHash?: Uint8Array;
    constructor(args: UpdateKeyArgs);
    copy(): UpdateKey;
    asObject(): UpdateKeyArgsWithType;
}
export type UpdateKeyOperationArgs = {
    oldEntry?: KeySpecParams | KeySpecParamsArgs;
    newEntry?: KeySpecParams | KeySpecParamsArgs;
};
export type UpdateKeyOperationArgsWithType = UpdateKeyOperationArgs & {
    type: KeyPageOperationType.Update | "update";
};
export declare class UpdateKeyOperation {
    readonly type = KeyPageOperationType.Update;
    oldEntry?: KeySpecParams;
    newEntry?: KeySpecParams;
    constructor(args: UpdateKeyOperationArgs);
    copy(): UpdateKeyOperation;
    asObject(): UpdateKeyOperationArgsWithType;
}
export type UpdateKeyPageArgs = {
    operation?: (KeyPageOperation | KeyPageOperationArgs | undefined)[];
};
export type UpdateKeyPageArgsWithType = UpdateKeyPageArgs & {
    type: TransactionType.UpdateKeyPage | "updateKeyPage";
};
export declare class UpdateKeyPage {
    readonly type = TransactionType.UpdateKeyPage;
    operation?: (KeyPageOperation | undefined)[];
    constructor(args: UpdateKeyPageArgs);
    copy(): UpdateKeyPage;
    asObject(): UpdateKeyPageArgsWithType;
}
export type ValidatorInfoArgs = {
    publicKey?: Uint8Array | string;
    publicKeyHash?: Uint8Array | string;
    operator?: URLArgs;
    partitions?: (ValidatorPartitionInfo | ValidatorPartitionInfoArgs | undefined)[];
};
export declare class ValidatorInfo {
    publicKey?: Uint8Array;
    publicKeyHash?: Uint8Array;
    operator?: URL;
    partitions?: (ValidatorPartitionInfo | undefined)[];
    constructor(args: ValidatorInfoArgs);
    copy(): ValidatorInfo;
    asObject(): ValidatorInfoArgs;
}
export type ValidatorPartitionInfoArgs = {
    id?: string;
    active?: boolean;
};
export declare class ValidatorPartitionInfo {
    id?: string;
    active?: boolean;
    constructor(args: ValidatorPartitionInfoArgs);
    copy(): ValidatorPartitionInfo;
    asObject(): ValidatorPartitionInfoArgs;
}
export type WriteDataArgs = {
    entry?: DataEntry | DataEntryArgs;
    scratch?: boolean;
    writeToState?: boolean;
};
export type WriteDataArgsWithType = WriteDataArgs & {
    type: TransactionType.WriteData | "writeData";
};
export declare class WriteData {
    readonly type = TransactionType.WriteData;
    entry?: DataEntry;
    scratch?: boolean;
    writeToState?: boolean;
    constructor(args: WriteDataArgs);
    copy(): WriteData;
    asObject(): WriteDataArgsWithType;
}
export type WriteDataResultArgs = {
    entryHash?: Uint8Array | string;
    accountUrl?: URLArgs;
    accountID?: Uint8Array | string;
};
export type WriteDataResultArgsWithType = WriteDataResultArgs & {
    type: TransactionType.WriteData | "writeData";
};
export declare class WriteDataResult {
    readonly type = TransactionType.WriteData;
    entryHash?: Uint8Array;
    accountUrl?: URL;
    accountID?: Uint8Array;
    constructor(args: WriteDataResultArgs);
    copy(): WriteDataResult;
    asObject(): WriteDataResultArgsWithType;
}
export type WriteDataToArgs = {
    recipient?: URLArgs;
    entry?: DataEntry | DataEntryArgs;
};
export type WriteDataToArgsWithType = WriteDataToArgs & {
    type: TransactionType.WriteDataTo | "writeDataTo";
};
export declare class WriteDataTo {
    readonly type = TransactionType.WriteDataTo;
    recipient?: URL;
    entry?: DataEntry;
    constructor(args: WriteDataToArgs);
    copy(): WriteDataTo;
    asObject(): WriteDataToArgsWithType;
}
