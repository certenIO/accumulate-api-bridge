import { BlockFilterMode, BlockFilterModeArgs, TxFetchMode, TxFetchModeArgs } from "./enums_gen.js";
import { AccumulateTxID as TxID, TxIDArgs } from "../address/txid.js";
import { AccumulateURL as URL, URLArgs } from "../address/url.js";
import * as errors2 from "../errors/index.js";
import * as merkle from "../merkle/index.js";
import * as messaging from "../messaging/index.js";
import * as core from "../network/index.js";
import * as config from "./config.js";
import * as protocol from "./protocol.js";
export type ChainEntryArgs = {
    height?: number;
    entry?: Uint8Array | string;
    state?: (Uint8Array | string | undefined)[];
    value?: any;
};
export declare class ChainEntry {
    height?: number;
    entry?: Uint8Array;
    state?: (Uint8Array | undefined)[];
    value?: any;
    constructor(args: ChainEntryArgs);
    copy(): ChainEntry;
    asObject(): ChainEntryArgs;
}
export type ChainIdQueryArgs = {
    chainId?: Uint8Array | string;
};
export declare class ChainIdQuery {
    chainId?: Uint8Array;
    constructor(args: ChainIdQueryArgs);
    copy(): ChainIdQuery;
    asObject(): ChainIdQueryArgs;
}
export type ChainQueryResponseArgs = {
    type?: string;
    mainChain?: MerkleState | MerkleStateArgs;
    chains?: (ChainState | ChainStateArgs | undefined)[];
    data?: any;
    chainId?: Uint8Array | string;
    receipt?: GeneralReceipt | GeneralReceiptArgs;
    lastBlockTime?: Date | string;
};
export declare class ChainQueryResponse {
    type?: string;
    mainChain?: MerkleState;
    chains?: (ChainState | undefined)[];
    data?: any;
    chainId?: Uint8Array;
    receipt?: GeneralReceipt;
    lastBlockTime?: Date;
    constructor(args: ChainQueryResponseArgs);
    copy(): ChainQueryResponse;
    asObject(): ChainQueryResponseArgs;
}
export type ChainStateArgs = {
    name?: string;
    type?: protocol.ChainTypeArgs;
    height?: number;
    roots?: (Uint8Array | string | undefined)[];
};
export declare class ChainState {
    name?: string;
    type?: protocol.ChainType;
    height?: number;
    roots?: (Uint8Array | undefined)[];
    constructor(args: ChainStateArgs);
    copy(): ChainState;
    asObject(): ChainStateArgs;
}
export type DataEntryQueryArgs = {
    url?: URLArgs;
    entryHash?: Uint8Array | string;
};
export declare class DataEntryQuery {
    url?: URL;
    entryHash?: Uint8Array;
    constructor(args: DataEntryQueryArgs);
    copy(): DataEntryQuery;
    asObject(): DataEntryQueryArgs;
}
export type DataEntryQueryResponseArgs = {
    entryHash?: Uint8Array | string;
    entry?: protocol.DataEntry | protocol.DataEntryArgs;
    txId?: TxIDArgs;
    causeTxId?: TxIDArgs;
    lastBlockTime?: Date | string;
};
export declare class DataEntryQueryResponse {
    entryHash?: Uint8Array;
    entry?: protocol.DataEntry;
    txId?: TxID;
    causeTxId?: TxID;
    lastBlockTime?: Date;
    constructor(args: DataEntryQueryResponseArgs);
    copy(): DataEntryQueryResponse;
    asObject(): DataEntryQueryResponseArgs;
}
export type DataEntrySetQueryArgs = {
    url?: URLArgs;
    start?: number;
    count?: number;
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
};
export declare class DataEntrySetQuery {
    url?: URL;
    start?: number;
    count?: number;
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
    constructor(args: DataEntrySetQueryArgs);
    copy(): DataEntrySetQuery;
    asObject(): DataEntrySetQueryArgs;
}
export type DescriptionResponseArgs = {
    partitionId?: string;
    networkType?: protocol.PartitionTypeArgs;
    network?: NetworkDescription | NetworkDescriptionArgs;
    networkAnchor?: Uint8Array | string;
    values?: core.GlobalValues | core.GlobalValuesArgs;
    error?: errors2.Error | errors2.ErrorArgs;
};
export declare class DescriptionResponse {
    partitionId?: string;
    networkType?: protocol.PartitionType;
    network?: NetworkDescription;
    networkAnchor?: Uint8Array;
    values?: core.GlobalValues;
    error?: errors2.Error;
    constructor(args: DescriptionResponseArgs);
    copy(): DescriptionResponse;
    asObject(): DescriptionResponseArgs;
}
export type DirectoryQueryArgs = {
    url?: URLArgs;
    start?: number;
    count?: number;
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
};
export declare class DirectoryQuery {
    url?: URL;
    start?: number;
    count?: number;
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
    constructor(args: DirectoryQueryArgs);
    copy(): DirectoryQuery;
    asObject(): DirectoryQueryArgs;
}
export type ExecuteRequestArgs = {
    envelope?: messaging.Envelope | messaging.EnvelopeArgs;
    checkOnly?: boolean;
};
export declare class ExecuteRequest {
    envelope?: messaging.Envelope;
    checkOnly?: boolean;
    constructor(args: ExecuteRequestArgs);
    copy(): ExecuteRequest;
    asObject(): ExecuteRequestArgs;
}
export type GeneralQueryArgs = {
    url?: URLArgs;
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
};
export declare class GeneralQuery {
    url?: URL;
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
    constructor(args: GeneralQueryArgs);
    copy(): GeneralQuery;
    asObject(): GeneralQueryArgs;
}
export type GeneralReceiptArgs = {
    localBlock?: number;
    localBlockTime?: Date | string;
    directoryBlock?: number;
    majorBlock?: number;
    proof?: merkle.Receipt | merkle.ReceiptArgs;
    error?: string;
};
export declare class GeneralReceipt {
    localBlock?: number;
    localBlockTime?: Date;
    directoryBlock?: number;
    majorBlock?: number;
    proof?: merkle.Receipt;
    error?: string;
    constructor(args: GeneralReceiptArgs);
    copy(): GeneralReceipt;
    asObject(): GeneralReceiptArgs;
}
export type KeyPageArgs = {
    version?: number;
};
export declare class KeyPage {
    version?: number;
    constructor(args: KeyPageArgs);
    copy(): KeyPage;
    asObject(): KeyPageArgs;
}
export type KeyPageIndexQueryArgs = {
    url?: URLArgs;
    key?: Uint8Array | string;
};
export declare class KeyPageIndexQuery {
    url?: URL;
    key?: Uint8Array;
    constructor(args: KeyPageIndexQueryArgs);
    copy(): KeyPageIndexQuery;
    asObject(): KeyPageIndexQueryArgs;
}
export type MajorBlocksQueryArgs = {
    url?: URLArgs;
    start?: number;
    count?: number;
};
export declare class MajorBlocksQuery {
    url?: URL;
    start?: number;
    count?: number;
    constructor(args: MajorBlocksQueryArgs);
    copy(): MajorBlocksQuery;
    asObject(): MajorBlocksQueryArgs;
}
export type MajorQueryResponseArgs = {
    majorBlockIndex?: number;
    majorBlockTime?: Date | string;
    minorBlocks?: (MinorBlock | MinorBlockArgs | undefined)[];
    lastBlockTime?: Date | string;
};
export declare class MajorQueryResponse {
    majorBlockIndex?: number;
    majorBlockTime?: Date;
    minorBlocks?: (MinorBlock | undefined)[];
    lastBlockTime?: Date;
    constructor(args: MajorQueryResponseArgs);
    copy(): MajorQueryResponse;
    asObject(): MajorQueryResponseArgs;
}
export type MerkleStateArgs = {
    height?: number;
    roots?: (Uint8Array | string | undefined)[];
};
export declare class MerkleState {
    height?: number;
    roots?: (Uint8Array | undefined)[];
    constructor(args: MerkleStateArgs);
    copy(): MerkleState;
    asObject(): MerkleStateArgs;
}
export type MetricsQueryArgs = {
    metric?: string;
    duration?: number;
};
export declare class MetricsQuery {
    metric?: string;
    duration?: number;
    constructor(args: MetricsQueryArgs);
    copy(): MetricsQuery;
    asObject(): MetricsQueryArgs;
}
export type MetricsResponseArgs = {
    value?: any;
};
export declare class MetricsResponse {
    value?: any;
    constructor(args: MetricsResponseArgs);
    copy(): MetricsResponse;
    asObject(): MetricsResponseArgs;
}
export type MinorBlockArgs = {
    blockIndex?: number;
    blockTime?: Date | string;
};
export declare class MinorBlock {
    blockIndex?: number;
    blockTime?: Date;
    constructor(args: MinorBlockArgs);
    copy(): MinorBlock;
    asObject(): MinorBlockArgs;
}
export type MinorBlocksQueryArgs = {
    url?: URLArgs;
    start?: number;
    count?: number;
    txFetchMode?: TxFetchModeArgs;
    blockFilterMode?: BlockFilterModeArgs;
};
export declare class MinorBlocksQuery {
    url?: URL;
    start?: number;
    count?: number;
    txFetchMode?: TxFetchMode;
    blockFilterMode?: BlockFilterMode;
    constructor(args: MinorBlocksQueryArgs);
    copy(): MinorBlocksQuery;
    asObject(): MinorBlocksQueryArgs;
}
export type MinorQueryResponseArgs = {
    blockIndex?: number;
    blockTime?: Date | string;
    txCount?: number;
    txIds?: (Uint8Array | string | undefined)[];
    transactions?: (TransactionQueryResponse | TransactionQueryResponseArgs | undefined)[];
    lastBlockTime?: Date | string;
};
export declare class MinorQueryResponse {
    blockIndex?: number;
    blockTime?: Date;
    txCount?: number;
    txIds?: (Uint8Array | undefined)[];
    transactions?: (TransactionQueryResponse | undefined)[];
    lastBlockTime?: Date;
    constructor(args: MinorQueryResponseArgs);
    copy(): MinorQueryResponse;
    asObject(): MinorQueryResponseArgs;
}
export type MultiResponseArgs = {
    type?: string;
    items?: (any | undefined)[];
    start?: number;
    count?: number;
    total?: number;
    otherItems?: (any | undefined)[];
    lastBlockTime?: Date | string;
};
export declare class MultiResponse {
    type?: string;
    items?: (any | undefined)[];
    start?: number;
    count?: number;
    total?: number;
    otherItems?: (any | undefined)[];
    lastBlockTime?: Date;
    constructor(args: MultiResponseArgs);
    copy(): MultiResponse;
    asObject(): MultiResponseArgs;
}
export type NetworkDescriptionArgs = {
    id?: string;
    partitions?: (PartitionDescription | PartitionDescriptionArgs | undefined)[];
};
export declare class NetworkDescription {
    id?: string;
    partitions?: (PartitionDescription | undefined)[];
    constructor(args: NetworkDescriptionArgs);
    copy(): NetworkDescription;
    asObject(): NetworkDescriptionArgs;
}
export type NodeDescriptionArgs = {
    address?: string;
    type?: config.NodeTypeArgs;
};
export declare class NodeDescription {
    address?: string;
    type?: config.NodeType;
    constructor(args: NodeDescriptionArgs);
    copy(): NodeDescription;
    asObject(): NodeDescriptionArgs;
}
export type PartitionDescriptionArgs = {
    id?: string;
    type?: protocol.PartitionTypeArgs;
    basePort?: number;
    nodes?: (NodeDescription | NodeDescriptionArgs | undefined)[];
};
export declare class PartitionDescription {
    id?: string;
    type?: protocol.PartitionType;
    basePort?: number;
    nodes?: (NodeDescription | undefined)[];
    constructor(args: PartitionDescriptionArgs);
    copy(): PartitionDescription;
    asObject(): PartitionDescriptionArgs;
}
export type QueryOptionsArgs = {
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
};
export declare class QueryOptions {
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
    constructor(args: QueryOptionsArgs);
    copy(): QueryOptions;
    asObject(): QueryOptionsArgs;
}
export type QueryPaginationArgs = {
    start?: number;
    count?: number;
};
export declare class QueryPagination {
    start?: number;
    count?: number;
    constructor(args: QueryPaginationArgs);
    copy(): QueryPagination;
    asObject(): QueryPaginationArgs;
}
export type ResponseDataEntryArgs = {
    entryHash?: Uint8Array | string;
    entry?: protocol.DataEntry | protocol.DataEntryArgs;
    txId?: TxIDArgs;
    causeTxId?: TxIDArgs;
    lastBlockTime?: Date | string;
};
export declare class ResponseDataEntry {
    entryHash?: Uint8Array;
    entry?: protocol.DataEntry;
    txId?: TxID;
    causeTxId?: TxID;
    lastBlockTime?: Date;
    constructor(args: ResponseDataEntryArgs);
    copy(): ResponseDataEntry;
    asObject(): ResponseDataEntryArgs;
}
export type ResponseDataEntrySetArgs = {
    dataEntries?: (ResponseDataEntry | ResponseDataEntryArgs | undefined)[];
    total?: number;
    lastBlockTime?: Date | string;
};
export declare class ResponseDataEntrySet {
    dataEntries?: (ResponseDataEntry | undefined)[];
    total?: number;
    lastBlockTime?: Date;
    constructor(args: ResponseDataEntrySetArgs);
    copy(): ResponseDataEntrySet;
    asObject(): ResponseDataEntrySetArgs;
}
export type ResponseKeyPageIndexArgs = {
    authority?: URLArgs;
    signer?: URLArgs;
    index?: number;
    lastBlockTime?: Date | string;
};
export declare class ResponseKeyPageIndex {
    authority?: URL;
    signer?: URL;
    index?: number;
    lastBlockTime?: Date;
    constructor(args: ResponseKeyPageIndexArgs);
    copy(): ResponseKeyPageIndex;
    asObject(): ResponseKeyPageIndexArgs;
}
export type SignatureBookArgs = {
    authority?: URLArgs;
    pages?: (SignaturePage | SignaturePageArgs | undefined)[];
};
export declare class SignatureBook {
    authority?: URL;
    pages?: (SignaturePage | undefined)[];
    constructor(args: SignatureBookArgs);
    copy(): SignatureBook;
    asObject(): SignatureBookArgs;
}
export type SignaturePageArgs = {
    signer?: SignerMetadata | SignerMetadataArgs;
    signatures?: (protocol.Signature | protocol.SignatureArgs | undefined)[];
};
export declare class SignaturePage {
    signer?: SignerMetadata;
    signatures?: (protocol.Signature | undefined)[];
    constructor(args: SignaturePageArgs);
    copy(): SignaturePage;
    asObject(): SignaturePageArgs;
}
export type SignerArgs = {
    publicKey?: Uint8Array | string;
    timestamp?: number;
    url?: URLArgs;
    version?: number;
    signatureType?: protocol.SignatureTypeArgs;
    useSimpleHash?: boolean;
};
export declare class Signer {
    publicKey?: Uint8Array;
    timestamp?: number;
    url?: URL;
    version?: number;
    signatureType?: protocol.SignatureType;
    useSimpleHash?: boolean;
    constructor(args: SignerArgs);
    copy(): Signer;
    asObject(): SignerArgs;
}
export type SignerMetadataArgs = {
    type?: protocol.AccountTypeArgs;
    url?: URLArgs;
    acceptThreshold?: number;
};
export declare class SignerMetadata {
    type?: protocol.AccountType;
    url?: URL;
    acceptThreshold?: number;
    constructor(args: SignerMetadataArgs);
    copy(): SignerMetadata;
    asObject(): SignerMetadataArgs;
}
export type StatusResponseArgs = {
    ok?: boolean;
    bvnHeight?: number;
    dnHeight?: number;
    bvnTime?: Date | string;
    dnTime?: Date | string;
    lastDirectoryAnchorHeight?: number;
    bvnRootHash?: Uint8Array | string;
    dnRootHash?: Uint8Array | string;
    bvnBptHash?: Uint8Array | string;
    dnBptHash?: Uint8Array | string;
};
export declare class StatusResponse {
    ok?: boolean;
    bvnHeight?: number;
    dnHeight?: number;
    bvnTime?: Date;
    dnTime?: Date;
    lastDirectoryAnchorHeight?: number;
    bvnRootHash?: Uint8Array;
    dnRootHash?: Uint8Array;
    bvnBptHash?: Uint8Array;
    dnBptHash?: Uint8Array;
    constructor(args: StatusResponseArgs);
    copy(): StatusResponse;
    asObject(): StatusResponseArgs;
}
export type SyntheticTransactionRequestArgs = {
    source?: URLArgs;
    destination?: URLArgs;
    sequenceNumber?: number;
    anchor?: boolean;
};
export declare class SyntheticTransactionRequest {
    source?: URL;
    destination?: URL;
    sequenceNumber?: number;
    anchor?: boolean;
    constructor(args: SyntheticTransactionRequestArgs);
    copy(): SyntheticTransactionRequest;
    asObject(): SyntheticTransactionRequestArgs;
}
export type TokenDepositArgs = {
    url?: URLArgs;
    amount?: bigint | string | number;
    txid?: Uint8Array | string;
};
export declare class TokenDeposit {
    url?: URL;
    amount?: bigint;
    txid?: Uint8Array;
    constructor(args: TokenDepositArgs);
    copy(): TokenDeposit;
    asObject(): TokenDepositArgs;
}
export type TokenSendArgs = {
    from?: URLArgs;
    to?: (TokenDeposit | TokenDepositArgs | undefined)[];
};
export declare class TokenSend {
    from?: URL;
    to?: (TokenDeposit | undefined)[];
    constructor(args: TokenSendArgs);
    copy(): TokenSend;
    asObject(): TokenSendArgs;
}
export type TransactionQueryResponseArgs = {
    type?: string;
    mainChain?: MerkleState | MerkleStateArgs;
    data?: any;
    origin?: URLArgs;
    transactionHash?: Uint8Array | string;
    txid?: TxIDArgs;
    transaction?: protocol.Transaction | protocol.TransactionArgs;
    signatures?: (protocol.Signature | protocol.SignatureArgs | undefined)[];
    status?: protocol.TransactionStatus | protocol.TransactionStatusArgs;
    produced?: (TxIDArgs | undefined)[];
    receipts?: (TxReceipt | TxReceiptArgs | undefined)[];
    signatureBooks?: (SignatureBook | SignatureBookArgs | undefined)[];
    lastBlockTime?: Date | string;
};
export declare class TransactionQueryResponse {
    type?: string;
    mainChain?: MerkleState;
    data?: any;
    origin?: URL;
    transactionHash?: Uint8Array;
    txid?: TxID;
    transaction?: protocol.Transaction;
    signatures?: (protocol.Signature | undefined)[];
    status?: protocol.TransactionStatus;
    produced?: (TxID | undefined)[];
    receipts?: (TxReceipt | undefined)[];
    signatureBooks?: (SignatureBook | undefined)[];
    lastBlockTime?: Date;
    constructor(args: TransactionQueryResponseArgs);
    copy(): TransactionQueryResponse;
    asObject(): TransactionQueryResponseArgs;
}
export type TxHistoryQueryArgs = {
    url?: URLArgs;
    start?: number;
    count?: number;
    scratch?: boolean;
};
export declare class TxHistoryQuery {
    url?: URL;
    start?: number;
    count?: number;
    scratch?: boolean;
    constructor(args: TxHistoryQueryArgs);
    copy(): TxHistoryQuery;
    asObject(): TxHistoryQueryArgs;
}
export type TxReceiptArgs = {
    localBlock?: number;
    localBlockTime?: Date | string;
    directoryBlock?: number;
    majorBlock?: number;
    proof?: merkle.Receipt | merkle.ReceiptArgs;
    error?: string;
    account?: URLArgs;
    chain?: string;
};
export declare class TxReceipt {
    localBlock?: number;
    localBlockTime?: Date;
    directoryBlock?: number;
    majorBlock?: number;
    proof?: merkle.Receipt;
    error?: string;
    account?: URL;
    chain?: string;
    constructor(args: TxReceiptArgs);
    copy(): TxReceipt;
    asObject(): TxReceiptArgs;
}
export type TxRequestArgs = {
    checkOnly?: boolean;
    isEnvelope?: boolean;
    origin?: URLArgs;
    signer?: Signer | SignerArgs;
    signature?: Uint8Array | string;
    keyPage?: KeyPage | KeyPageArgs;
    txHash?: Uint8Array | string;
    payload?: any;
    memo?: string;
    metadata?: Uint8Array | string;
};
export declare class TxRequest {
    checkOnly?: boolean;
    isEnvelope?: boolean;
    origin?: URL;
    signer?: Signer;
    signature?: Uint8Array;
    keyPage?: KeyPage;
    txHash?: Uint8Array;
    payload?: any;
    memo?: string;
    metadata?: Uint8Array;
    constructor(args: TxRequestArgs);
    copy(): TxRequest;
    asObject(): TxRequestArgs;
}
export type TxResponseArgs = {
    transactionHash?: Uint8Array | string;
    txid?: TxIDArgs;
    signatureHashes?: (Uint8Array | string | undefined)[];
    simpleHash?: Uint8Array | string;
    code?: number;
    message?: string;
    delivered?: boolean;
    result?: any;
    lastBlockTime?: Date | string;
};
export declare class TxResponse {
    transactionHash?: Uint8Array;
    txid?: TxID;
    signatureHashes?: (Uint8Array | undefined)[];
    simpleHash?: Uint8Array;
    code?: number;
    message?: string;
    delivered?: boolean;
    result?: any;
    lastBlockTime?: Date;
    constructor(args: TxResponseArgs);
    copy(): TxResponse;
    asObject(): TxResponseArgs;
}
export type TxnQueryArgs = {
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
    txid?: Uint8Array | string;
    txIdUrl?: TxIDArgs;
    wait?: number;
    ignorePending?: boolean;
};
export declare class TxnQuery {
    expand?: boolean;
    height?: number;
    scratch?: boolean;
    prove?: boolean;
    includeRemote?: boolean;
    txid?: Uint8Array;
    txIdUrl?: TxID;
    wait?: number;
    ignorePending?: boolean;
    constructor(args: TxnQueryArgs);
    copy(): TxnQuery;
    asObject(): TxnQueryArgs;
}
export type UrlQueryArgs = {
    url?: URLArgs;
};
export declare class UrlQuery {
    url?: URL;
    constructor(args: UrlQueryArgs);
    copy(): UrlQuery;
    asObject(): UrlQueryArgs;
}
export type VersionResponseArgs = {
    version?: string;
    commit?: string;
    versionIsKnown?: boolean;
    isTestNet?: boolean;
};
export declare class VersionResponse {
    version?: string;
    commit?: string;
    versionIsKnown?: boolean;
    isTestNet?: boolean;
    constructor(args: VersionResponseArgs);
    copy(): VersionResponse;
    asObject(): VersionResponseArgs;
}
