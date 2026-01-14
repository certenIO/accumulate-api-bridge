export declare enum Status {
    /** OK means the request completed successfully. */
    OK = 200,
    /** Delivered means the transaction has been delivered. */
    Delivered = 201,
    /** Pending means the transaction is pending. */
    Pending = 202,
    /** Remote means the transaction is a local reference to a remote. */
    Remote = 203,
    /** WrongPartition means the requested resource is assigned to a different network partition. */
    WrongPartition = 301,
    /** BadRequest means the request was invalid. */
    BadRequest = 400,
    /** Unauthenticated means the signature could not be validated. */
    Unauthenticated = 401,
    /** InsufficientCredits means the signer does not have sufficient credits to execute the transaction. */
    InsufficientCredits = 402,
    /** Unauthorized means the signer is not authorized to sign the transaction. */
    Unauthorized = 403,
    /** NotFound means a record could not be found. */
    NotFound = 404,
    /** NotAllowed means the requested action could not be performed. */
    NotAllowed = 405,
    /** Rejected is returned when a transaction is rejected. */
    Rejected = 406,
    /** Expired is returned when a transaction has expired. */
    Expired = 407,
    /** Conflict means the request failed due to a conflict. */
    Conflict = 409,
    /** BadSignerVersion means the signer version does not match. */
    BadSignerVersion = 411,
    /** BadTimestamp means the timestamp is invalid. */
    BadTimestamp = 412,
    /** BadUrlLength means the url length is too big. */
    BadUrlLength = 413,
    /** IncompleteChain means the chain does not include the full history. */
    IncompleteChain = 414,
    /** InsufficientBalance means the account balance is insufficient to satisfy the request. */
    InsufficientBalance = 415,
    /** InternalError means an internal error occurred. */
    InternalError = 500,
    /** UnknownError means an unknown error occurred. */
    UnknownError = 501,
    /** EncodingError means encoding or decoding failed. */
    EncodingError = 502,
    /** FatalError means something has gone seriously wrong. */
    FatalError = 503,
    /** NotReady means the receiver is not ready to satisfy the request. */
    NotReady = 504,
    /** WrongType means the record is not the expected type. */
    WrongType = 505,
    /** NoPeer means the receiver cannot find a peer to satisfy the request. */
    NoPeer = 506,
    /** PeerMisbehaved means a peer behaved incorrectly. */
    PeerMisbehaved = 507,
    /** InvalidRecord means the database has one or more invalid records. */
    InvalidRecord = 508,
    /** StreamAborted is equivalent to [io.ErrUnexpectedEOF]. */
    StreamAborted = 509
}
export type StatusArgs = Status | string;
/** @ignore */
export declare namespace Status {
    function fromObject(obj: StatusArgs): Status;
    function byName(name: string): Status;
    function getName(v: Status): "pending" | "expired" | "ok" | "rejected" | "remote" | "delivered" | "unauthenticated" | "unauthorized" | "conflict" | "wrongPartition" | "badRequest" | "insufficientCredits" | "notFound" | "notAllowed" | "badSignerVersion" | "badTimestamp" | "badUrlLength" | "incompleteChain" | "insufficientBalance" | "internalError" | "unknownError" | "encodingError" | "fatalError" | "notReady" | "wrongType" | "noPeer" | "peerMisbehaved" | "invalidRecord" | "streamAborted";
}
