export declare enum MessageType {
    /** Transaction is a transaction. */
    Transaction = 1,
    /** Signature is a signature. */
    Signature = 2,
    /** BadSynthetic is deprecated. */
    BadSynthetic = 3,
    /** BlockAnchor is a block anchor signed by validator. */
    BlockAnchor = 4,
    /** Sequenced is a message that is part of a sequence. */
    Sequenced = 5,
    /** SignatureRequest is a request for additional signatures. */
    SignatureRequest = 6,
    /** CreditPayment is a payment of credits towards a transaction's fee. */
    CreditPayment = 7,
    /** BlockSummary is a summary of a block. */
    BlockSummary = 8,
    /** Synthetic is a message produced by the protocol, requiring proof. */
    Synthetic = 9,
    /** NetworkUpdate is an update to network parameters. */
    NetworkUpdate = 10,
    /** MakeMajorBlock triggers a major block. */
    MakeMajorBlock = 11,
    /** DidUpdateExecutorVersion notifies the DN that a BVN updated the executor version. */
    DidUpdateExecutorVersion = 12
}
export type MessageTypeArgs = MessageType | string;
/** @ignore */
export declare namespace MessageType {
    function fromObject(obj: MessageTypeArgs): MessageType;
    function byName(name: string): MessageType;
    function getName(v: MessageType): "transaction" | "blockSummary" | "synthetic" | "signature" | "sequenced" | "badSynthetic" | "blockAnchor" | "signatureRequest" | "creditPayment" | "networkUpdate" | "makeMajorBlock" | "didUpdateExecutorVersion";
}
