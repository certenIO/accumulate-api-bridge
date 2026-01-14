import * as types from "./types_gen.js";
export type Message = types.BadSyntheticMessage | types.BlockAnchor | types.CreditPayment | types.DidUpdateExecutorVersion | types.MakeMajorBlock | types.NetworkUpdate | types.SequencedMessage | types.SignatureMessage | types.SignatureRequest | types.SyntheticMessage | types.TransactionMessage;
export type MessageArgs = types.BadSyntheticMessage | types.BadSyntheticMessageArgsWithType | types.BlockAnchor | types.BlockAnchorArgsWithType | types.CreditPayment | types.CreditPaymentArgsWithType | types.DidUpdateExecutorVersion | types.DidUpdateExecutorVersionArgsWithType | types.MakeMajorBlock | types.MakeMajorBlockArgsWithType | types.NetworkUpdate | types.NetworkUpdateArgsWithType | types.SequencedMessage | types.SequencedMessageArgsWithType | types.SignatureMessage | types.SignatureMessageArgsWithType | types.SignatureRequest | types.SignatureRequestArgsWithType | types.SyntheticMessage | types.SyntheticMessageArgsWithType | types.TransactionMessage | types.TransactionMessageArgsWithType;
/** @ignore */
export declare namespace Message {
    function fromObject(obj: MessageArgs): Message;
}
