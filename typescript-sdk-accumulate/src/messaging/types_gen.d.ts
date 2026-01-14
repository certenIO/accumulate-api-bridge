import { MessageType } from "./enums_gen.js";
type Message = any;
type MessageArgs = any;
import { AccumulateTxID as TxID, TxIDArgs } from "../address/txid.js";
import { AccumulateURL as URL, URLArgs } from "../address/url.js";
import * as protocol from "../core/index.js";
export type BadSyntheticMessageArgs = {
    message?: Message | MessageArgs;
    signature?: protocol.KeySignature | protocol.KeySignatureArgs;
    proof?: protocol.AnnotatedReceipt | protocol.AnnotatedReceiptArgs;
};
export type BadSyntheticMessageArgsWithType = BadSyntheticMessageArgs & {
    type: MessageType.BadSynthetic | "badSynthetic";
};
export declare class BadSyntheticMessage {
    readonly type = MessageType.BadSynthetic;
    message?: Message;
    signature?: protocol.KeySignature;
    proof?: protocol.AnnotatedReceipt;
    constructor(args: BadSyntheticMessageArgs);
    copy(): BadSyntheticMessage;
    asObject(): BadSyntheticMessageArgsWithType;
}
export type BlockAnchorArgs = {
    signature?: protocol.KeySignature | protocol.KeySignatureArgs;
    anchor?: Message | MessageArgs;
};
export type BlockAnchorArgsWithType = BlockAnchorArgs & {
    type: MessageType.BlockAnchor | "blockAnchor";
};
export declare class BlockAnchor {
    readonly type = MessageType.BlockAnchor;
    signature?: protocol.KeySignature;
    anchor?: Message;
    constructor(args: BlockAnchorArgs);
    copy(): BlockAnchor;
    asObject(): BlockAnchorArgsWithType;
}
export type CreditPaymentArgs = {
    paid?: protocol.FeeArgs;
    payer?: URLArgs;
    initiator?: boolean;
    txID?: TxIDArgs;
    cause?: TxIDArgs;
};
export type CreditPaymentArgsWithType = CreditPaymentArgs & {
    type: MessageType.CreditPayment | "creditPayment";
};
export declare class CreditPayment {
    readonly type = MessageType.CreditPayment;
    paid?: protocol.Fee;
    payer?: URL;
    initiator?: boolean;
    txID?: TxID;
    cause?: TxID;
    constructor(args: CreditPaymentArgs);
    copy(): CreditPayment;
    asObject(): CreditPaymentArgsWithType;
}
export type DidUpdateExecutorVersionArgs = {
    partition?: string;
    version?: protocol.ExecutorVersionArgs;
};
export type DidUpdateExecutorVersionArgsWithType = DidUpdateExecutorVersionArgs & {
    type: MessageType.DidUpdateExecutorVersion | "didUpdateExecutorVersion";
};
export declare class DidUpdateExecutorVersion {
    readonly type = MessageType.DidUpdateExecutorVersion;
    partition?: string;
    version?: protocol.ExecutorVersion;
    constructor(args: DidUpdateExecutorVersionArgs);
    copy(): DidUpdateExecutorVersion;
    asObject(): DidUpdateExecutorVersionArgsWithType;
}
export type EnvelopeArgs = {
    signatures?: (protocol.Signature | protocol.SignatureArgs | undefined)[];
    txHash?: Uint8Array | string;
    transaction?: (protocol.Transaction | protocol.TransactionArgs | undefined)[];
    messages?: (Message | MessageArgs | undefined)[];
};
export declare class Envelope {
    signatures?: (protocol.Signature | undefined)[];
    txHash?: Uint8Array;
    transaction?: (protocol.Transaction | undefined)[];
    messages?: (Message | undefined)[];
    constructor(args: EnvelopeArgs);
    copy(): Envelope;
    asObject(): EnvelopeArgs;
}
export type MakeMajorBlockArgs = {
    majorBlockIndex?: number;
    minorBlockIndex?: number;
    majorBlockTime?: Date | string;
};
export type MakeMajorBlockArgsWithType = MakeMajorBlockArgs & {
    type: MessageType.MakeMajorBlock | "makeMajorBlock";
};
export declare class MakeMajorBlock {
    readonly type = MessageType.MakeMajorBlock;
    majorBlockIndex?: number;
    minorBlockIndex?: number;
    majorBlockTime?: Date;
    constructor(args: MakeMajorBlockArgs);
    copy(): MakeMajorBlock;
    asObject(): MakeMajorBlockArgsWithType;
}
export type NetworkUpdateArgs = {
    accounts?: (protocol.NetworkAccountUpdate | protocol.NetworkAccountUpdateArgs | undefined)[];
};
export type NetworkUpdateArgsWithType = NetworkUpdateArgs & {
    type: MessageType.NetworkUpdate | "networkUpdate";
};
export declare class NetworkUpdate {
    readonly type = MessageType.NetworkUpdate;
    accounts?: (protocol.NetworkAccountUpdate | undefined)[];
    constructor(args: NetworkUpdateArgs);
    copy(): NetworkUpdate;
    asObject(): NetworkUpdateArgsWithType;
}
export type SequencedMessageArgs = {
    message?: Message | MessageArgs;
    source?: URLArgs;
    destination?: URLArgs;
    number?: number;
};
export type SequencedMessageArgsWithType = SequencedMessageArgs & {
    type: MessageType.Sequenced | "sequenced";
};
export declare class SequencedMessage {
    readonly type = MessageType.Sequenced;
    message?: Message;
    source?: URL;
    destination?: URL;
    number?: number;
    constructor(args: SequencedMessageArgs);
    copy(): SequencedMessage;
    asObject(): SequencedMessageArgsWithType;
}
export type SignatureMessageArgs = {
    signature?: protocol.Signature | protocol.SignatureArgs;
    txID?: TxIDArgs;
};
export type SignatureMessageArgsWithType = SignatureMessageArgs & {
    type: MessageType.Signature | "signature";
};
export declare class SignatureMessage {
    readonly type = MessageType.Signature;
    signature?: protocol.Signature;
    txID?: TxID;
    constructor(args: SignatureMessageArgs);
    copy(): SignatureMessage;
    asObject(): SignatureMessageArgsWithType;
}
export type SignatureRequestArgs = {
    authority?: URLArgs;
    txID?: TxIDArgs;
    cause?: TxIDArgs;
};
export type SignatureRequestArgsWithType = SignatureRequestArgs & {
    type: MessageType.SignatureRequest | "signatureRequest";
};
export declare class SignatureRequest {
    readonly type = MessageType.SignatureRequest;
    authority?: URL;
    txID?: TxID;
    cause?: TxID;
    constructor(args: SignatureRequestArgs);
    copy(): SignatureRequest;
    asObject(): SignatureRequestArgsWithType;
}
export type SynthFieldsArgs = {
    message?: Message | MessageArgs;
    signature?: protocol.KeySignature | protocol.KeySignatureArgs;
    proof?: protocol.AnnotatedReceipt | protocol.AnnotatedReceiptArgs;
};
export declare class SynthFields {
    message?: Message;
    signature?: protocol.KeySignature;
    proof?: protocol.AnnotatedReceipt;
    constructor(args: SynthFieldsArgs);
    copy(): SynthFields;
    asObject(): SynthFieldsArgs;
}
export type SyntheticMessageArgs = {
    message?: Message | MessageArgs;
    signature?: protocol.KeySignature | protocol.KeySignatureArgs;
    proof?: protocol.AnnotatedReceipt | protocol.AnnotatedReceiptArgs;
};
export type SyntheticMessageArgsWithType = SyntheticMessageArgs & {
    type: MessageType.Synthetic | "synthetic";
};
export declare class SyntheticMessage {
    readonly type = MessageType.Synthetic;
    message?: Message;
    signature?: protocol.KeySignature;
    proof?: protocol.AnnotatedReceipt;
    constructor(args: SyntheticMessageArgs);
    copy(): SyntheticMessage;
    asObject(): SyntheticMessageArgsWithType;
}
export type TransactionMessageArgs = {
    transaction?: protocol.Transaction | protocol.TransactionArgs;
};
export type TransactionMessageArgsWithType = TransactionMessageArgs & {
    type: MessageType.Transaction | "transaction";
};
export declare class TransactionMessage {
    readonly type = MessageType.Transaction;
    transaction?: protocol.Transaction;
    constructor(args: TransactionMessageArgs);
    copy(): TransactionMessage;
    asObject(): TransactionMessageArgsWithType;
}
export {};
