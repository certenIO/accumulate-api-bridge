export declare enum EventType {
    /** Error . */
    Error = 1,
    /** Block . */
    Block = 2,
    /** Globals . */
    Globals = 3
}
export type EventTypeArgs = EventType | string;
/** @ignore */
export declare namespace EventType {
    function fromObject(obj: EventTypeArgs): EventType;
    function byName(name: string): EventType;
    function getName(v: EventType): "error" | "block" | "globals";
}
export declare enum KnownPeerStatus {
    /** Unknown . */
    Unknown = 0,
    /** Good . */
    Good = 1,
    /** Bad . */
    Bad = 2
}
export type KnownPeerStatusArgs = KnownPeerStatus | string;
/** @ignore */
export declare namespace KnownPeerStatus {
    function fromObject(obj: KnownPeerStatusArgs): KnownPeerStatus;
    function byName(name: string): KnownPeerStatus;
    function getName(v: KnownPeerStatus): "unknown" | "good" | "bad";
}
export declare enum QueryType {
    /** Default . */
    Default = 0,
    /** Chain . */
    Chain = 1,
    /** Data . */
    Data = 2,
    /** Directory . */
    Directory = 3,
    /** Pending . */
    Pending = 4,
    /** Block . */
    Block = 5,
    /** AnchorSearch . */
    AnchorSearch = 16,
    /** PublicKeySearch . */
    PublicKeySearch = 17,
    /** PublicKeyHashSearch . */
    PublicKeyHashSearch = 18,
    /** DelegateSearch . */
    DelegateSearch = 19,
    /** MessageHashSearch . */
    MessageHashSearch = 20
}
export type QueryTypeArgs = QueryType | string;
/** @ignore */
export declare namespace QueryType {
    function fromObject(obj: QueryTypeArgs): QueryType;
    function byName(name: string): QueryType;
    function getName(v: QueryType): "default" | "data" | "directory" | "pending" | "chain" | "anchorSearch" | "block" | "delegateSearch" | "messageHashSearch" | "publicKeyHashSearch" | "publicKeySearch";
}
export declare enum RecordType {
    /** Account . */
    Account = 1,
    /** Chain . */
    Chain = 2,
    /** ChainEntry . */
    ChainEntry = 3,
    /** Key . */
    Key = 4,
    /** Message . */
    Message = 16,
    /** SignatureSet . */
    SignatureSet = 17,
    /** MinorBlock . */
    MinorBlock = 32,
    /** MajorBlock . */
    MajorBlock = 33,
    /** Range . */
    Range = 128,
    /** Url . */
    Url = 129,
    /** TxID . */
    TxID = 130,
    /** IndexEntry . */
    IndexEntry = 131,
    /** Error . */
    Error = 143
}
export type RecordTypeArgs = RecordType | string;
/** @ignore */
export declare namespace RecordType {
    function fromObject(obj: RecordTypeArgs): RecordType;
    function byName(name: string): RecordType;
    function getName(v: RecordType): "error" | "message" | "key" | "account" | "url" | "chainEntry" | "chain" | "indexEntry" | "majorBlock" | "minorBlock" | "range" | "signatureSet" | "txID";
}
export declare enum ServiceType {
    /** Unknown indicates an unknown service type. */
    Unknown = 0,
    /** Node is the type of [NodeService]. */
    Node = 1,
    /** Consensus is the type of [ConsensusService]. */
    Consensus = 2,
    /** Network is the type of [NetworkService]. */
    Network = 3,
    /** Metrics is the type of [MetricsService]. */
    Metrics = 4,
    /** Query is the type of [Querier]. */
    Query = 5,
    /** Event is the type of [EventService]. */
    Event = 6,
    /** Submit is the type of [Submitter]. */
    Submit = 7,
    /** Validate is the type of [Validator]. */
    Validate = 8,
    /** Faucet is the type of [Faucet]. */
    Faucet = 9
}
export type ServiceTypeArgs = ServiceType | string;
/** @ignore */
export declare namespace ServiceType {
    function fromObject(obj: ServiceTypeArgs): ServiceType;
    function byName(name: string): ServiceType;
    function getName(v: ServiceType): "network" | "submit" | "unknown" | "query" | "faucet" | "metrics" | "event" | "validate" | "node" | "consensus";
}
