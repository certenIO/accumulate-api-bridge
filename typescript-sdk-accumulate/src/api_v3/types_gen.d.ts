import { Record, RecordArgs } from "./unions_gen.js";
import { AccumulateTxID as TxID, TxIDArgs } from "../address/txid.js";
import { AccumulateURL as URL, URLArgs } from "../address/url.js";
import * as protocol from "../core/index.js";
import * as errors2 from "../errors/index.js";
import * as merkle from "../merkle/index.js";
import * as messaging from "../messaging/index.js";
import * as core from "../network/index.js";
import { EventType, KnownPeerStatus, KnownPeerStatusArgs, QueryType, RecordType, ServiceType } from "./enums_gen.js";
import * as p2p from "./p2p.js";
export type AccountRecordArgs = {
    account?: protocol.Account | protocol.AccountArgs;
    directory?: RecordRange<UrlRecord> | RecordRangeArgs<UrlRecord>;
    pending?: RecordRange<TxIDRecord> | RecordRangeArgs<TxIDRecord>;
    receipt?: Receipt | ReceiptArgs;
    lastBlockTime?: Date | string;
};
export type AccountRecordArgsWithType = AccountRecordArgs & {
    recordType: RecordType.Account | "account";
};
export declare class AccountRecord {
    readonly recordType = RecordType.Account;
    account?: protocol.Account;
    directory?: RecordRange<UrlRecord>;
    pending?: RecordRange<TxIDRecord>;
    receipt?: Receipt;
    lastBlockTime?: Date;
    constructor(args: AccountRecordArgs);
    copy(): AccountRecord;
    asObject(): AccountRecordArgsWithType;
}
export type AnchorSearchQueryArgs = {
    anchor?: Uint8Array | string;
    includeReceipt?: ReceiptOptions | ReceiptOptionsArgs;
};
export type AnchorSearchQueryArgsWithType = AnchorSearchQueryArgs & {
    queryType: QueryType.AnchorSearch | "anchorSearch";
};
export declare class AnchorSearchQuery {
    readonly queryType = QueryType.AnchorSearch;
    anchor?: Uint8Array;
    includeReceipt?: ReceiptOptions;
    constructor(args: AnchorSearchQueryArgs);
    copy(): AnchorSearchQuery;
    asObject(): AnchorSearchQueryArgsWithType;
}
export type BlockEventArgs = {
    partition?: string;
    index?: number;
    time?: Date | string;
    major?: number;
    entries?: (ChainEntryRecord<Record> | ChainEntryRecordArgs<Record> | undefined)[];
};
export type BlockEventArgsWithType = BlockEventArgs & {
    eventType: EventType.Block | "block";
};
export declare class BlockEvent {
    readonly eventType = EventType.Block;
    partition?: string;
    index?: number;
    time?: Date;
    major?: number;
    entries?: (ChainEntryRecord<Record> | undefined)[];
    constructor(args: BlockEventArgs);
    copy(): BlockEvent;
    asObject(): BlockEventArgsWithType;
}
export type BlockQueryArgs = {
    minor?: number;
    major?: number;
    minorRange?: RangeOptions | RangeOptionsArgs;
    majorRange?: RangeOptions | RangeOptionsArgs;
    entryRange?: RangeOptions | RangeOptionsArgs;
    omitEmpty?: boolean;
};
export type BlockQueryArgsWithType = BlockQueryArgs & {
    queryType: QueryType.Block | "block";
};
export declare class BlockQuery {
    readonly queryType = QueryType.Block;
    minor?: number;
    major?: number;
    minorRange?: RangeOptions;
    majorRange?: RangeOptions;
    entryRange?: RangeOptions;
    omitEmpty?: boolean;
    constructor(args: BlockQueryArgs);
    copy(): BlockQuery;
    asObject(): BlockQueryArgsWithType;
}
export type ChainEntryRecordArgs<T extends Record = Record> = {
    account?: URLArgs;
    name?: string;
    type?: merkle.ChainTypeArgs;
    index?: number;
    entry?: Uint8Array | string;
    value?: T | RecordArgs;
    receipt?: Receipt | ReceiptArgs;
    state?: (Uint8Array | string | undefined)[];
    lastBlockTime?: Date | string;
};
export type ChainEntryRecordArgsWithType<T extends Record = Record> = ChainEntryRecordArgs<T> & {
    recordType: RecordType.ChainEntry | "chainEntry";
};
export declare class ChainEntryRecord<T extends Record = Record> {
    readonly recordType = RecordType.ChainEntry;
    account?: URL;
    name?: string;
    type?: merkle.ChainType;
    index?: number;
    entry?: Uint8Array;
    value?: T;
    receipt?: Receipt;
    state?: (Uint8Array | undefined)[];
    lastBlockTime?: Date;
    constructor(args: ChainEntryRecordArgs<T>);
    copy(): ChainEntryRecord<T>;
    asObject(): ChainEntryRecordArgsWithType<T>;
}
export type ChainQueryArgs = {
    name?: string;
    index?: number;
    entry?: Uint8Array | string;
    range?: RangeOptions | RangeOptionsArgs;
    includeReceipt?: ReceiptOptions | ReceiptOptionsArgs;
};
export type ChainQueryArgsWithType = ChainQueryArgs & {
    queryType: QueryType.Chain | "chain";
};
export declare class ChainQuery {
    readonly queryType = QueryType.Chain;
    name?: string;
    index?: number;
    entry?: Uint8Array;
    range?: RangeOptions;
    includeReceipt?: ReceiptOptions;
    constructor(args: ChainQueryArgs);
    copy(): ChainQuery;
    asObject(): ChainQueryArgsWithType;
}
export type ChainRecordArgs = {
    name?: string;
    type?: merkle.ChainTypeArgs;
    count?: number;
    state?: (Uint8Array | string | undefined)[];
    lastBlockTime?: Date | string;
};
export type ChainRecordArgsWithType = ChainRecordArgs & {
    recordType: RecordType.Chain | "chain";
};
export declare class ChainRecord {
    readonly recordType = RecordType.Chain;
    name?: string;
    type?: merkle.ChainType;
    count?: number;
    state?: (Uint8Array | undefined)[];
    lastBlockTime?: Date;
    constructor(args: ChainRecordArgs);
    copy(): ChainRecord;
    asObject(): ChainRecordArgsWithType;
}
export type ConsensusPeerInfoArgs = {
    nodeID?: string;
    host?: string;
    port?: number;
};
export declare class ConsensusPeerInfo {
    nodeID?: string;
    host?: string;
    port?: number;
    constructor(args: ConsensusPeerInfoArgs);
    copy(): ConsensusPeerInfo;
    asObject(): ConsensusPeerInfoArgs;
}
export type ConsensusStatusArgs = {
    ok?: boolean;
    lastBlock?: LastBlock | LastBlockArgs;
    version?: string;
    commit?: string;
    nodeKeyHash?: Uint8Array | string;
    validatorKeyHash?: Uint8Array | string;
    partitionID?: string;
    partitionType?: protocol.PartitionTypeArgs;
    peers?: (ConsensusPeerInfo | ConsensusPeerInfoArgs | undefined)[];
};
export declare class ConsensusStatus {
    ok?: boolean;
    lastBlock?: LastBlock;
    version?: string;
    commit?: string;
    nodeKeyHash?: Uint8Array;
    validatorKeyHash?: Uint8Array;
    partitionID?: string;
    partitionType?: protocol.PartitionType;
    peers?: (ConsensusPeerInfo | undefined)[];
    constructor(args: ConsensusStatusArgs);
    copy(): ConsensusStatus;
    asObject(): ConsensusStatusArgs;
}
export type ConsensusStatusOptionsArgs = {
    nodeID?: string;
    partition?: string;
    includePeers?: boolean;
    includeAccumulate?: boolean;
};
export declare class ConsensusStatusOptions {
    nodeID?: string;
    partition?: string;
    includePeers?: boolean;
    includeAccumulate?: boolean;
    constructor(args: ConsensusStatusOptionsArgs);
    copy(): ConsensusStatusOptions;
    asObject(): ConsensusStatusOptionsArgs;
}
export type DataQueryArgs = {
    index?: number;
    entry?: Uint8Array | string;
    range?: RangeOptions | RangeOptionsArgs;
};
export type DataQueryArgsWithType = DataQueryArgs & {
    queryType: QueryType.Data | "data";
};
export declare class DataQuery {
    readonly queryType = QueryType.Data;
    index?: number;
    entry?: Uint8Array;
    range?: RangeOptions;
    constructor(args: DataQueryArgs);
    copy(): DataQuery;
    asObject(): DataQueryArgsWithType;
}
export type DefaultQueryArgs = {
    includeReceipt?: ReceiptOptions | ReceiptOptionsArgs;
};
export type DefaultQueryArgsWithType = DefaultQueryArgs & {
    queryType: QueryType.Default | "default";
};
export declare class DefaultQuery {
    readonly queryType = QueryType.Default;
    includeReceipt?: ReceiptOptions;
    constructor(args: DefaultQueryArgs);
    copy(): DefaultQuery;
    asObject(): DefaultQueryArgsWithType;
}
export type DelegateSearchQueryArgs = {
    delegate?: URLArgs;
};
export type DelegateSearchQueryArgsWithType = DelegateSearchQueryArgs & {
    queryType: QueryType.DelegateSearch | "delegateSearch";
};
export declare class DelegateSearchQuery {
    readonly queryType = QueryType.DelegateSearch;
    delegate?: URL;
    constructor(args: DelegateSearchQueryArgs);
    copy(): DelegateSearchQuery;
    asObject(): DelegateSearchQueryArgsWithType;
}
export type DirectoryQueryArgs = {
    range?: RangeOptions | RangeOptionsArgs;
};
export type DirectoryQueryArgsWithType = DirectoryQueryArgs & {
    queryType: QueryType.Directory | "directory";
};
export declare class DirectoryQuery {
    readonly queryType = QueryType.Directory;
    range?: RangeOptions;
    constructor(args: DirectoryQueryArgs);
    copy(): DirectoryQuery;
    asObject(): DirectoryQueryArgsWithType;
}
export type ErrorEventArgs = {
    err?: errors2.Error | errors2.ErrorArgs;
};
export type ErrorEventArgsWithType = ErrorEventArgs & {
    eventType: EventType.Error | "error";
};
export declare class ErrorEvent {
    readonly eventType = EventType.Error;
    err?: errors2.Error;
    constructor(args: ErrorEventArgs);
    copy(): ErrorEvent;
    asObject(): ErrorEventArgsWithType;
}
export type ErrorRecordArgs = {
    value?: errors2.Error | errors2.ErrorArgs;
};
export type ErrorRecordArgsWithType = ErrorRecordArgs & {
    recordType: RecordType.Error | "error";
};
export declare class ErrorRecord {
    readonly recordType = RecordType.Error;
    value?: errors2.Error;
    constructor(args: ErrorRecordArgs);
    copy(): ErrorRecord;
    asObject(): ErrorRecordArgsWithType;
}
export type FaucetOptionsArgs = {
    token?: URLArgs;
};
export declare class FaucetOptions {
    token?: URL;
    constructor(args: FaucetOptionsArgs);
    copy(): FaucetOptions;
    asObject(): FaucetOptionsArgs;
}
export type FindServiceOptionsArgs = {
    network?: string;
    service?: ServiceAddress | ServiceAddressArgs;
    known?: boolean;
    timeout?: number;
};
export declare class FindServiceOptions {
    network?: string;
    service?: ServiceAddress;
    known?: boolean;
    timeout?: number;
    constructor(args: FindServiceOptionsArgs);
    copy(): FindServiceOptions;
    asObject(): FindServiceOptionsArgs;
}
export type FindServiceResultArgs = {
    peerID?: p2p.PeerID | p2p.PeerIDArgs;
    status?: KnownPeerStatusArgs;
    addresses?: (p2p.Multiaddr | p2p.MultiaddrArgs | undefined)[];
};
export declare class FindServiceResult {
    peerID?: p2p.PeerID;
    status?: KnownPeerStatus;
    addresses?: (p2p.Multiaddr | undefined)[];
    constructor(args: FindServiceResultArgs);
    copy(): FindServiceResult;
    asObject(): FindServiceResultArgs;
}
export type GlobalsEventArgs = {
    old?: core.GlobalValues | core.GlobalValuesArgs;
    new?: core.GlobalValues | core.GlobalValuesArgs;
};
export type GlobalsEventArgsWithType = GlobalsEventArgs & {
    eventType: EventType.Globals | "globals";
};
export declare class GlobalsEvent {
    readonly eventType = EventType.Globals;
    old?: core.GlobalValues;
    new?: core.GlobalValues;
    constructor(args: GlobalsEventArgs);
    copy(): GlobalsEvent;
    asObject(): GlobalsEventArgsWithType;
}
export type IndexEntryRecordArgs = {
    value?: protocol.IndexEntry | protocol.IndexEntryArgs;
};
export type IndexEntryRecordArgsWithType = IndexEntryRecordArgs & {
    recordType: RecordType.IndexEntry | "indexEntry";
};
export declare class IndexEntryRecord {
    readonly recordType = RecordType.IndexEntry;
    value?: protocol.IndexEntry;
    constructor(args: IndexEntryRecordArgs);
    copy(): IndexEntryRecord;
    asObject(): IndexEntryRecordArgsWithType;
}
export type KeyRecordArgs = {
    authority?: URLArgs;
    signer?: URLArgs;
    version?: number;
    index?: number;
    entry?: protocol.KeySpec | protocol.KeySpecArgs;
};
export type KeyRecordArgsWithType = KeyRecordArgs & {
    recordType: RecordType.Key | "key";
};
export declare class KeyRecord {
    readonly recordType = RecordType.Key;
    authority?: URL;
    signer?: URL;
    version?: number;
    index?: number;
    entry?: protocol.KeySpec;
    constructor(args: KeyRecordArgs);
    copy(): KeyRecord;
    asObject(): KeyRecordArgsWithType;
}
export type LastBlockArgs = {
    height?: number;
    time?: Date | string;
    chainRoot?: Uint8Array | string;
    stateRoot?: Uint8Array | string;
    directoryAnchorHeight?: number;
};
export declare class LastBlock {
    height?: number;
    time?: Date;
    chainRoot?: Uint8Array;
    stateRoot?: Uint8Array;
    directoryAnchorHeight?: number;
    constructor(args: LastBlockArgs);
    copy(): LastBlock;
    asObject(): LastBlockArgs;
}
export type MajorBlockRecordArgs = {
    index?: number;
    time?: Date | string;
    minorBlocks?: RecordRange<MinorBlockRecord> | RecordRangeArgs<MinorBlockRecord>;
    lastBlockTime?: Date | string;
};
export type MajorBlockRecordArgsWithType = MajorBlockRecordArgs & {
    recordType: RecordType.MajorBlock | "majorBlock";
};
export declare class MajorBlockRecord {
    readonly recordType = RecordType.MajorBlock;
    index?: number;
    time?: Date;
    minorBlocks?: RecordRange<MinorBlockRecord>;
    lastBlockTime?: Date;
    constructor(args: MajorBlockRecordArgs);
    copy(): MajorBlockRecord;
    asObject(): MajorBlockRecordArgsWithType;
}
export type MessageHashSearchQueryArgs = {
    hash?: Uint8Array | string;
};
export type MessageHashSearchQueryArgsWithType = MessageHashSearchQueryArgs & {
    queryType: QueryType.MessageHashSearch | "messageHashSearch";
};
export declare class MessageHashSearchQuery {
    readonly queryType = QueryType.MessageHashSearch;
    hash?: Uint8Array;
    constructor(args: MessageHashSearchQueryArgs);
    copy(): MessageHashSearchQuery;
    asObject(): MessageHashSearchQueryArgsWithType;
}
export type MessageRecordArgs<T extends messaging.Message = messaging.Message> = {
    id?: TxIDArgs;
    message?: T | messaging.MessageArgs;
    status?: errors2.StatusArgs;
    error?: errors2.Error | errors2.ErrorArgs;
    result?: protocol.TransactionResult | protocol.TransactionResultArgs;
    received?: number;
    produced?: RecordRange<TxIDRecord> | RecordRangeArgs<TxIDRecord>;
    cause?: RecordRange<TxIDRecord> | RecordRangeArgs<TxIDRecord>;
    signatures?: RecordRange<SignatureSetRecord> | RecordRangeArgs<SignatureSetRecord>;
    historical?: boolean;
    sequence?: messaging.SequencedMessage | messaging.SequencedMessageArgs;
    sourceReceipt?: merkle.Receipt | merkle.ReceiptArgs;
    lastBlockTime?: Date | string;
};
export type MessageRecordArgsWithType<T extends messaging.Message = messaging.Message> = MessageRecordArgs<T> & {
    recordType: RecordType.Message | "message";
};
export declare class MessageRecord<T extends messaging.Message = messaging.Message> {
    readonly recordType = RecordType.Message;
    id?: TxID;
    message?: T;
    status?: errors2.Status;
    error?: errors2.Error;
    result?: protocol.TransactionResult;
    received?: number;
    produced?: RecordRange<TxIDRecord>;
    cause?: RecordRange<TxIDRecord>;
    signatures?: RecordRange<SignatureSetRecord>;
    historical?: boolean;
    sequence?: messaging.SequencedMessage;
    sourceReceipt?: merkle.Receipt;
    lastBlockTime?: Date;
    constructor(args: MessageRecordArgs<T>);
    copy(): MessageRecord<T>;
    asObject(): MessageRecordArgsWithType<T>;
}
export type MinorBlockRecordArgs = {
    index?: number;
    time?: Date | string;
    source?: URLArgs;
    entries?: RecordRange<ChainEntryRecord<Record>> | RecordRangeArgs<ChainEntryRecord<Record>>;
    anchored?: RecordRange<MinorBlockRecord> | RecordRangeArgs<MinorBlockRecord>;
    lastBlockTime?: Date | string;
};
export type MinorBlockRecordArgsWithType = MinorBlockRecordArgs & {
    recordType: RecordType.MinorBlock | "minorBlock";
};
export declare class MinorBlockRecord {
    readonly recordType = RecordType.MinorBlock;
    index?: number;
    time?: Date;
    source?: URL;
    entries?: RecordRange<ChainEntryRecord<Record>>;
    anchored?: RecordRange<MinorBlockRecord>;
    lastBlockTime?: Date;
    constructor(args: MinorBlockRecordArgs);
    copy(): MinorBlockRecord;
    asObject(): MinorBlockRecordArgsWithType;
}
export type NetworkStatusArgs = {
    oracle?: protocol.AcmeOracle | protocol.AcmeOracleArgs;
    globals?: protocol.NetworkGlobals | protocol.NetworkGlobalsArgs;
    network?: protocol.NetworkDefinition | protocol.NetworkDefinitionArgs;
    routing?: protocol.RoutingTable | protocol.RoutingTableArgs;
    executorVersion?: protocol.ExecutorVersionArgs;
    directoryHeight?: number;
    majorBlockHeight?: number;
    bvnExecutorVersions?: (protocol.PartitionExecutorVersion | protocol.PartitionExecutorVersionArgs | undefined)[];
};
export declare class NetworkStatus {
    oracle?: protocol.AcmeOracle;
    globals?: protocol.NetworkGlobals;
    network?: protocol.NetworkDefinition;
    routing?: protocol.RoutingTable;
    executorVersion?: protocol.ExecutorVersion;
    directoryHeight?: number;
    majorBlockHeight?: number;
    bvnExecutorVersions?: (protocol.PartitionExecutorVersion | undefined)[];
    constructor(args: NetworkStatusArgs);
    copy(): NetworkStatus;
    asObject(): NetworkStatusArgs;
}
export type NetworkStatusOptionsArgs = {
    partition?: string;
};
export declare class NetworkStatusOptions {
    partition?: string;
    constructor(args: NetworkStatusOptionsArgs);
    copy(): NetworkStatusOptions;
    asObject(): NetworkStatusOptionsArgs;
}
export type NodeInfoArgs = {
    peerID?: p2p.PeerID | p2p.PeerIDArgs;
    network?: string;
    services?: (ServiceAddress | ServiceAddressArgs | undefined)[];
    version?: string;
    commit?: string;
};
export declare class NodeInfo {
    peerID?: p2p.PeerID;
    network?: string;
    services?: (ServiceAddress | undefined)[];
    version?: string;
    commit?: string;
    constructor(args: NodeInfoArgs);
    copy(): NodeInfo;
    asObject(): NodeInfoArgs;
}
export type NodeInfoOptionsArgs = {
    peerID?: p2p.PeerID | p2p.PeerIDArgs;
};
export declare class NodeInfoOptions {
    peerID?: p2p.PeerID;
    constructor(args: NodeInfoOptionsArgs);
    copy(): NodeInfoOptions;
    asObject(): NodeInfoOptionsArgs;
}
export type PendingQueryArgs = {
    range?: RangeOptions | RangeOptionsArgs;
};
export type PendingQueryArgsWithType = PendingQueryArgs & {
    queryType: QueryType.Pending | "pending";
};
export declare class PendingQuery {
    readonly queryType = QueryType.Pending;
    range?: RangeOptions;
    constructor(args: PendingQueryArgs);
    copy(): PendingQuery;
    asObject(): PendingQueryArgsWithType;
}
export type PublicKeyHashSearchQueryArgs = {
    publicKeyHash?: Uint8Array | string;
};
export type PublicKeyHashSearchQueryArgsWithType = PublicKeyHashSearchQueryArgs & {
    queryType: QueryType.PublicKeyHashSearch | "publicKeyHashSearch";
};
export declare class PublicKeyHashSearchQuery {
    readonly queryType = QueryType.PublicKeyHashSearch;
    publicKeyHash?: Uint8Array;
    constructor(args: PublicKeyHashSearchQueryArgs);
    copy(): PublicKeyHashSearchQuery;
    asObject(): PublicKeyHashSearchQueryArgsWithType;
}
export type PublicKeySearchQueryArgs = {
    publicKey?: Uint8Array | string;
    type?: protocol.SignatureTypeArgs;
};
export type PublicKeySearchQueryArgsWithType = PublicKeySearchQueryArgs & {
    queryType: QueryType.PublicKeySearch | "publicKeySearch";
};
export declare class PublicKeySearchQuery {
    readonly queryType = QueryType.PublicKeySearch;
    publicKey?: Uint8Array;
    type?: protocol.SignatureType;
    constructor(args: PublicKeySearchQueryArgs);
    copy(): PublicKeySearchQuery;
    asObject(): PublicKeySearchQueryArgsWithType;
}
export type RangeOptionsArgs = {
    start?: number;
    count?: number;
    expand?: boolean;
    fromEnd?: boolean;
};
export declare class RangeOptions {
    start?: number;
    count?: number;
    expand?: boolean;
    fromEnd?: boolean;
    constructor(args: RangeOptionsArgs);
    copy(): RangeOptions;
    asObject(): RangeOptionsArgs;
}
export type ReceiptArgs = {
    start?: Uint8Array | string;
    startIndex?: number;
    end?: Uint8Array | string;
    endIndex?: number;
    anchor?: Uint8Array | string;
    entries?: (merkle.ReceiptEntry | merkle.ReceiptEntryArgs | undefined)[];
    localBlock?: number;
    localBlockTime?: Date | string;
    majorBlock?: number;
};
export declare class Receipt {
    start?: Uint8Array;
    startIndex?: number;
    end?: Uint8Array;
    endIndex?: number;
    anchor?: Uint8Array;
    entries?: (merkle.ReceiptEntry | undefined)[];
    localBlock?: number;
    localBlockTime?: Date;
    majorBlock?: number;
    constructor(args: ReceiptArgs);
    copy(): Receipt;
    asObject(): ReceiptArgs;
}
export type ReceiptOptionsArgs = {
    forAny?: boolean;
    forHeight?: number;
};
export declare class ReceiptOptions {
    forAny?: boolean;
    forHeight?: number;
    constructor(args: ReceiptOptionsArgs);
    copy(): ReceiptOptions;
    asObject(): ReceiptOptionsArgs;
}
export type RecordRangeArgs<T extends Record = Record> = {
    records?: (T | RecordArgs | undefined)[];
    start?: number;
    total?: number;
    lastBlockTime?: Date | string;
};
export type RecordRangeArgsWithType<T extends Record = Record> = RecordRangeArgs<T> & {
    recordType: RecordType.Range | "range";
};
export declare class RecordRange<T extends Record = Record> {
    readonly recordType = RecordType.Range;
    records?: (T | undefined)[];
    start?: number;
    total?: number;
    lastBlockTime?: Date;
    constructor(args: RecordRangeArgs<T>);
    copy(): RecordRange<T>;
    asObject(): RecordRangeArgsWithType<T>;
}
export type ServiceAddressArgs = {
    type?: ServiceType;
    argument?: string;
};
export declare class ServiceAddress {
    type?: ServiceType;
    argument?: string;
    constructor(args: ServiceAddressArgs);
    copy(): ServiceAddress;
    asObject(): ServiceAddressArgs;
}
export type SignatureSetRecordArgs = {
    account?: protocol.Account | protocol.AccountArgs;
    signatures?: RecordRange<MessageRecord<messaging.Message>> | RecordRangeArgs<MessageRecord<messaging.Message>>;
};
export type SignatureSetRecordArgsWithType = SignatureSetRecordArgs & {
    recordType: RecordType.SignatureSet | "signatureSet";
};
export declare class SignatureSetRecord {
    readonly recordType = RecordType.SignatureSet;
    account?: protocol.Account;
    signatures?: RecordRange<MessageRecord<messaging.Message>>;
    constructor(args: SignatureSetRecordArgs);
    copy(): SignatureSetRecord;
    asObject(): SignatureSetRecordArgsWithType;
}
export type SubmissionArgs = {
    status?: protocol.TransactionStatus | protocol.TransactionStatusArgs;
    success?: boolean;
    message?: string;
};
export declare class Submission {
    status?: protocol.TransactionStatus;
    success?: boolean;
    message?: string;
    constructor(args: SubmissionArgs);
    copy(): Submission;
    asObject(): SubmissionArgs;
}
export type SubmitOptionsArgs = {
    verify?: boolean;
    wait?: boolean;
};
export declare class SubmitOptions {
    verify?: boolean;
    wait?: boolean;
    constructor(args: SubmitOptionsArgs);
    copy(): SubmitOptions;
    asObject(): SubmitOptionsArgs;
}
export type SubscribeOptionsArgs = {
    partition?: string;
    account?: URLArgs;
};
export declare class SubscribeOptions {
    partition?: string;
    account?: URL;
    constructor(args: SubscribeOptionsArgs);
    copy(): SubscribeOptions;
    asObject(): SubscribeOptionsArgs;
}
export type TxIDRecordArgs = {
    value?: TxIDArgs;
};
export type TxIDRecordArgsWithType = TxIDRecordArgs & {
    recordType: RecordType.TxID | "txID";
};
export declare class TxIDRecord {
    readonly recordType = RecordType.TxID;
    value?: TxID;
    constructor(args: TxIDRecordArgs);
    copy(): TxIDRecord;
    asObject(): TxIDRecordArgsWithType;
}
export type UrlRecordArgs = {
    value?: URLArgs;
};
export type UrlRecordArgsWithType = UrlRecordArgs & {
    recordType: RecordType.Url | "url";
};
export declare class UrlRecord {
    readonly recordType = RecordType.Url;
    value?: URL;
    constructor(args: UrlRecordArgs);
    copy(): UrlRecord;
    asObject(): UrlRecordArgsWithType;
}
export type ValidateOptionsArgs = {
    full?: boolean;
};
export declare class ValidateOptions {
    full?: boolean;
    constructor(args: ValidateOptionsArgs);
    copy(): ValidateOptions;
    asObject(): ValidateOptionsArgs;
}
