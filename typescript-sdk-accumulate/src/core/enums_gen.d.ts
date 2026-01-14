export declare enum AccountAuthOperationType {
    /** Unknown is used when the authorization operation is not known. */
    Unknown = 0,
    /** Enable enables authorization checks for an authority. */
    Enable = 1,
    /** Disable disables authorization checks for an authority. */
    Disable = 2,
    /** AddAuthority adds an authority. */
    AddAuthority = 3,
    /** RemoveAuthority removes an authority. */
    RemoveAuthority = 4
}
export type AccountAuthOperationTypeArgs = AccountAuthOperationType | string;
/** @ignore */
export declare namespace AccountAuthOperationType {
    function fromObject(obj: AccountAuthOperationTypeArgs): AccountAuthOperationType;
    function byName(name: string): AccountAuthOperationType;
    function getName(v: AccountAuthOperationType): "unknown" | "enable" | "disable" | "addAuthority" | "removeAuthority";
}
export declare enum AccountType {
    /** Unknown represents an unknown account type. */
    Unknown = 0,
    /** AnchorLedger anchors the other partitions. */
    AnchorLedger = 1,
    /** Identity is an Identity account, aka an ADI. */
    Identity = 2,
    /** TokenIssuer is a Token Issuer account. */
    TokenIssuer = 3,
    /** TokenAccount is an ADI Token Account. */
    TokenAccount = 4,
    /** LiteTokenAccount is a Lite Token Account. */
    LiteTokenAccount = 5,
    /** BlockLedger is a Block Ledger account. */
    BlockLedger = 6,
    /** KeyPage is a Key Page account. */
    KeyPage = 9,
    /** KeyBook is a Key Book account. */
    KeyBook = 10,
    /** DataAccount is an ADI Data Account. */
    DataAccount = 11,
    /** LiteDataAccount is a Lite Data Account. */
    LiteDataAccount = 12,
    /** UnknownSigner represents an unknown signer account. */
    UnknownSigner = 13,
    /** SystemLedger is a ledger that tracks the state of internal operations. */
    SystemLedger = 14,
    /** LiteIdentity is a lite identity account. */
    LiteIdentity = 15,
    /** SyntheticLedger is a ledger that tracks the status of produced and received synthetic transactions. */
    SyntheticLedger = 16
}
export type AccountTypeArgs = AccountType | string;
/** @ignore */
export declare namespace AccountType {
    function fromObject(obj: AccountTypeArgs): AccountType;
    function byName(name: string): AccountType;
    function getName(v: AccountType): "unknown" | "identity" | "anchorLedger" | "tokenIssuer" | "tokenAccount" | "liteTokenAccount" | "blockLedger" | "keyPage" | "keyBook" | "dataAccount" | "liteDataAccount" | "unknownSigner" | "systemLedger" | "liteIdentity" | "syntheticLedger";
}
export declare enum AllowedTransactionBit {
    /** UpdateKeyPage is the offset of the UpdateKeyPage bit. */
    UpdateKeyPage = 1,
    /** UpdateAccountAuth is the offset of the UpdateAccountAuth bit. */
    UpdateAccountAuth = 2
}
export type AllowedTransactionBitArgs = AllowedTransactionBit | string;
/** @ignore */
export declare namespace AllowedTransactionBit {
    function fromObject(obj: AllowedTransactionBitArgs): AllowedTransactionBit;
    function byName(name: string): AllowedTransactionBit;
    function getName(v: AllowedTransactionBit): "updateKeyPage" | "updateAccountAuth";
}
export declare enum BookType {
    /** Normal is a normal key book. */
    Normal = 0,
    /** Validator is a validator key book. */
    Validator = 1,
    /** Operator Operator key book. */
    Operator = 2
}
export type BookTypeArgs = BookType | string;
/** @ignore */
export declare namespace BookType {
    function fromObject(obj: BookTypeArgs): BookType;
    function byName(name: string): BookType;
    function getName(v: BookType): "normal" | "validator" | "operator";
}
export declare enum DataEntryType {
    /** Unknown . */
    Unknown = 0,
    /** Factom . */
    Factom = 1,
    /** Accumulate . */
    Accumulate = 2,
    /** DoubleHash . */
    DoubleHash = 3
}
export type DataEntryTypeArgs = DataEntryType | string;
/** @ignore */
export declare namespace DataEntryType {
    function fromObject(obj: DataEntryTypeArgs): DataEntryType;
    function byName(name: string): DataEntryType;
    function getName(v: DataEntryType): "accumulate" | "unknown" | "factom" | "doubleHash";
}
export declare enum ExecutorVersion {
    /** V1 is the first version of the executor system. */
    V1 = 1,
    /** V1SignatureAnchoring introduces anchoring of signature chains into the root chain. */
    V1SignatureAnchoring = 2,
    /** V1DoubleHashEntries fixes a problem that prevented v1-signatureAnchoring from being activated correctly and enables double-hashed data entries. */
    V1DoubleHashEntries = 3,
    /** V1Halt halts transaction processing in preparation for v2. */
    V1Halt = 4,
    /** V2 is the second version of the executor system. */
    V2 = 5,
    /** V2Baikonur enables the Baikonur release. */
    V2Baikonur = 6,
    /** V2Vandenberg enables the Vandenberg release. */
    V2Vandenberg = 7,
    /** V2Jiuquan enables the Jiuquan release. */
    V2Jiuquan = 8,
    /** VNext is a placeholder for testing. DO NOT USE. */
    VNext = 9
}
export type ExecutorVersionArgs = ExecutorVersion | string;
/** @ignore */
export declare namespace ExecutorVersion {
    function fromObject(obj: ExecutorVersionArgs): ExecutorVersion;
    function byName(name: string): ExecutorVersion;
    function getName(v: ExecutorVersion): "v1" | "v1-halt" | "v2" | "v2-vandenberg" | "v2-jiuquan" | "vnext" | "v1-signatureAnchoring" | "v1-doubleHashEntries" | "v2Baikonur";
}
export declare enum KeyPageOperationType {
    /** Unknown is used when the key page operation is not known. */
    Unknown = 0,
    /** Update replaces a key in the page with a new key. */
    Update = 1,
    /** Remove removes a key from the page. */
    Remove = 2,
    /** Add adds a key to the page. */
    Add = 3,
    /** SetThreshold sets the signing threshold (the M of "M of N" signatures required). */
    SetThreshold = 4,
    /** UpdateAllowed updates the transactions the key page is allowed to execute. */
    UpdateAllowed = 5,
    /** SetRejectThreshold sets the rejection threshold. */
    SetRejectThreshold = 6,
    /** SetResponseThreshold sets the response threshold. */
    SetResponseThreshold = 7
}
export type KeyPageOperationTypeArgs = KeyPageOperationType | string;
/** @ignore */
export declare namespace KeyPageOperationType {
    function fromObject(obj: KeyPageOperationTypeArgs): KeyPageOperationType;
    function byName(name: string): KeyPageOperationType;
    function getName(v: KeyPageOperationType): "add" | "remove" | "unknown" | "update" | "setThreshold" | "updateAllowed" | "setRejectThreshold" | "setResponseThreshold";
}
export declare enum NetworkMaintenanceOperationType {
    /** Unknown is used when the operation type is not known. */
    Unknown = 0,
    /** PendingTransactionGC removes pending transaction garbage. */
    PendingTransactionGC = 1
}
export type NetworkMaintenanceOperationTypeArgs = NetworkMaintenanceOperationType | string;
/** @ignore */
export declare namespace NetworkMaintenanceOperationType {
    function fromObject(obj: NetworkMaintenanceOperationTypeArgs): NetworkMaintenanceOperationType;
    function byName(name: string): NetworkMaintenanceOperationType;
    function getName(v: NetworkMaintenanceOperationType): "unknown" | "pendingTransactionGC";
}
export declare enum ObjectType {
    /** Unknown is used when the object type is not known. */
    Unknown = 0,
    /** Account represents an account object. */
    Account = 1,
    /** Transaction represents a transaction object. */
    Transaction = 2
}
export type ObjectTypeArgs = ObjectType | string;
/** @ignore */
export declare namespace ObjectType {
    function fromObject(obj: ObjectTypeArgs): ObjectType;
    function byName(name: string): ObjectType;
    function getName(v: ObjectType): "unknown" | "account" | "transaction";
}
export declare enum PartitionType {
    /** Directory . */
    Directory = 1,
    /** BlockValidator . */
    BlockValidator = 2,
    /** BlockSummary . */
    BlockSummary = 3,
    /** Bootstrap . */
    Bootstrap = 4
}
export type PartitionTypeArgs = PartitionType | string;
/** @ignore */
export declare namespace PartitionType {
    function fromObject(obj: PartitionTypeArgs): PartitionType;
    function byName(name: string): PartitionType;
    function getName(v: PartitionType): "directory" | "bootstrap" | "blockValidator" | "blockSummary";
}
export declare enum SignatureType {
    /** Unknown is used when the signature type is not known. */
    Unknown = 0,
    /** LegacyED25519 represents a legacy ED25519 signature. */
    LegacyED25519 = 1,
    /** ED25519 represents an ED25519 signature. */
    ED25519 = 2,
    /** RCD1 represents an RCD1 signature. */
    RCD1 = 3,
    /** Receipt represents a Merkle tree receipt. */
    Receipt = 4,
    /** Partition is used when sending synthetic and system transactions. */
    Partition = 5,
    /** Set is used when forwarding multiple signatures. */
    Set = 6,
    /** Remote is used when forwarding a signature from one partition to another. */
    Remote = 7,
    /** BTC represents an BTC signature. */
    BTC = 8,
    /** BTCLegacy represents an BTC signature with uncompressed public key. */
    BTCLegacy = 9,
    /** ETH represents an ETH signature. */
    ETH = 10,
    /** Delegated represents a signature for a delegated authority. */
    Delegated = 11,
    /** Internal is used for internally produced transactions. */
    Internal = 12,
    /** Authority is a signature produced by an authority. */
    Authority = 13,
    /** RsaSha256 represents an RSA signature of SHA256 hashed data (PKCS#1 encoding). */
    RsaSha256 = 14,
    /** EcdsaSha256 represents a signature of SHA256 hashed data from an ecdsa algorithm with supported standard curves from NIST, SECG, and Brainpool typically (SEC, ANS.1 enocding). */
    EcdsaSha256 = 15,
    /** TypedData implements EIP-712 sign typed data specification. */
    TypedData = 16
}
export type SignatureTypeArgs = SignatureType | string;
/** @ignore */
export declare namespace SignatureType {
    function fromObject(obj: SignatureTypeArgs): SignatureType;
    function byName(name: string): SignatureType;
    function getName(v: SignatureType): "internal" | "set" | "unknown" | "ed25519" | "rcd1" | "receipt" | "partition" | "remote" | "btc" | "btclegacy" | "eth" | "delegated" | "authority" | "legacyED25519" | "rsaSha256" | "ecdsaSha256" | "typedData";
}
export declare enum TransactionMax {
    /** User is the highest number reserved for user transactions. */
    User = 48,
    /** Synthetic is the highest number reserved for synthetic transactions. */
    Synthetic = 95,
    /** System is the highest number reserved for internal transactions. */
    System = 255
}
export type TransactionMaxArgs = TransactionMax | string;
/** @ignore */
export declare namespace TransactionMax {
    function fromObject(obj: TransactionMaxArgs): TransactionMax;
    function byName(name: string): TransactionMax;
    function getName(v: TransactionMax): "user" | "synthetic" | "system";
}
export declare enum TransactionType {
    /** Unknown represents an unknown transaction type. */
    Unknown = 0,
    /** CreateIdentity creates an ADI, which produces a synthetic chain. */
    CreateIdentity = 1,
    /** CreateTokenAccount creates an ADI token account, which produces a synthetic chain create transaction. */
    CreateTokenAccount = 2,
    /** SendTokens transfers tokens between token accounts, which produces a synthetic deposit tokens transaction. */
    SendTokens = 3,
    /** CreateDataAccount creates an ADI Data Account, which produces a synthetic chain create transaction. */
    CreateDataAccount = 4,
    /** WriteData writes data to an ADI Data Account, which *does not* produce a synthetic transaction. */
    WriteData = 5,
    /** WriteDataTo writes data to a Lite Data Account, which produces a synthetic write data transaction. */
    WriteDataTo = 6,
    /** AcmeFaucet produces a synthetic deposit tokens transaction that deposits ACME tokens into a lite token account. */
    AcmeFaucet = 7,
    /** CreateToken creates a token issuer, which produces a synthetic chain create transaction. */
    CreateToken = 8,
    /** IssueTokens issues tokens to a token account, which produces a synthetic token deposit transaction. */
    IssueTokens = 9,
    /** BurnTokens burns tokens from a token account, which produces a synthetic burn tokens transaction. */
    BurnTokens = 10,
    /** CreateLiteTokenAccount create a lite token account. */
    CreateLiteTokenAccount = 11,
    /** CreateKeyPage creates a key page, which produces a synthetic chain create transaction. */
    CreateKeyPage = 12,
    /** CreateKeyBook creates a key book, which produces a synthetic chain create transaction. */
    CreateKeyBook = 13,
    /** AddCredits converts ACME tokens to credits, which produces a synthetic deposit credits transaction. */
    AddCredits = 14,
    /** UpdateKeyPage adds, removes, or updates keys in a key page, which *does not* produce a synthetic transaction. */
    UpdateKeyPage = 15,
    /** LockAccount sets a major block height that prevents tokens from being transferred out of a lite token account until that height has been reached. */
    LockAccount = 16,
    /** BurnCredits burns credits from a credit account. */
    BurnCredits = 17,
    /** TransferCredits transfers credits between credit accounts within the same domain. */
    TransferCredits = 18,
    /** UpdateAccountAuth updates authorization for an account. */
    UpdateAccountAuth = 21,
    /** UpdateKey update key for existing keys. */
    UpdateKey = 22,
    /** NetworkMaintenance executes network maintenance operations. */
    NetworkMaintenance = 46,
    /** ActivateProtocolVersion activates a new version of the protocol. */
    ActivateProtocolVersion = 47,
    /** Remote is used to sign a remote transaction. */
    Remote = 48,
    /** SyntheticCreateIdentity creates an identity. */
    SyntheticCreateIdentity = 49,
    /** SyntheticWriteData writes data to a data account. */
    SyntheticWriteData = 50,
    /** SyntheticDepositTokens deposits tokens into token accounts. */
    SyntheticDepositTokens = 51,
    /** SyntheticDepositCredits deposits credits into a credit holder. */
    SyntheticDepositCredits = 52,
    /** SyntheticBurnTokens returns tokens to a token issuer's pool of issuable tokens. */
    SyntheticBurnTokens = 53,
    /** SyntheticForwardTransaction forwards a transaction from one partition to another. */
    SyntheticForwardTransaction = 54,
    /** SystemGenesis initializes system chains. */
    SystemGenesis = 96,
    /** DirectoryAnchor anchors one network to another. */
    DirectoryAnchor = 97,
    /** BlockValidatorAnchor system transaction for partition data. */
    BlockValidatorAnchor = 98,
    /** SystemWriteData writes data to a system data account. */
    SystemWriteData = 99
}
export type TransactionTypeArgs = TransactionType | string;
/** @ignore */
export declare namespace TransactionType {
    function fromObject(obj: TransactionTypeArgs): TransactionType;
    function byName(name: string): TransactionType;
    function getName(v: TransactionType): "unknown" | "updateKeyPage" | "updateAccountAuth" | "remote" | "createIdentity" | "createTokenAccount" | "sendTokens" | "createDataAccount" | "writeData" | "writeDataTo" | "acmeFaucet" | "createToken" | "issueTokens" | "burnTokens" | "createLiteTokenAccount" | "createKeyPage" | "createKeyBook" | "addCredits" | "lockAccount" | "burnCredits" | "transferCredits" | "updateKey" | "networkMaintenance" | "activateProtocolVersion" | "syntheticCreateIdentity" | "syntheticWriteData" | "syntheticDepositTokens" | "syntheticDepositCredits" | "syntheticBurnTokens" | "syntheticForwardTransaction" | "systemGenesis" | "directoryAnchor" | "blockValidatorAnchor" | "systemWriteData";
}
export declare enum VoteType {
    /** Accept vote yea in favor of proposal. */
    Accept = 0,
    /** Reject vote nay against a proposal. */
    Reject = 1,
    /** Abstain chose not to vote on a proposal. */
    Abstain = 2,
    /** Suggest put forth a proposal. */
    Suggest = 3
}
export type VoteTypeArgs = VoteType | string;
/** @ignore */
export declare namespace VoteType {
    function fromObject(obj: VoteTypeArgs): VoteType;
    function byName(name: string): VoteType;
    function getName(v: VoteType): "accept" | "reject" | "abstain" | "suggest";
}
