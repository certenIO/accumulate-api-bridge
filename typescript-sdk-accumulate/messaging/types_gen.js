var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { MessageType } from "./enums_gen.js";
// Lazy loader to avoid circular dependency
let _MessageClass;
function getMessageClass() {
    if (!_MessageClass) {
        // Fallback for Jest compatibility
        _MessageClass = {
            fromObject: (obj) => obj
        };
    }
    return _MessageClass;
}
import { AccumulateTxID as TxID } from "../address/txid.js";
import { AccumulateURL as URL } from "../address/url.js";
import { Buffer } from "../common/buffer.js";
import * as protocol from "../core/index.js";
import { encodeAs } from "../encoding/index.js";
export class BadSyntheticMessage {
    constructor(args) {
        this.type = MessageType.BadSynthetic;
        this.message = args.message == undefined ? undefined : getMessageClass().fromObject(args.message);
        this.signature =
            args.signature == undefined ? undefined : protocol.KeySignature.fromObject(args.signature);
        this.proof =
            args.proof == undefined
                ? undefined
                : args.proof instanceof protocol.AnnotatedReceipt
                    ? args.proof
                    : new protocol.AnnotatedReceipt(args.proof);
    }
    copy() {
        return new BadSyntheticMessage(this.asObject());
    }
    asObject() {
        return {
            type: "badSynthetic",
            message: this.message === undefined ? undefined : this.message.asObject(),
            signature: this.signature === undefined ? undefined : this.signature.asObject(),
            proof: this.proof === undefined ? undefined : this.proof.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], BadSyntheticMessage.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).union)
], BadSyntheticMessage.prototype, "message", void 0);
__decorate([
    (encodeAs.field(3).union)
], BadSyntheticMessage.prototype, "signature", void 0);
__decorate([
    (encodeAs.field(4).reference)
], BadSyntheticMessage.prototype, "proof", void 0);
export class BlockAnchor {
    constructor(args) {
        this.type = MessageType.BlockAnchor;
        this.signature =
            args.signature == undefined ? undefined : protocol.KeySignature.fromObject(args.signature);
        this.anchor = args.anchor == undefined ? undefined : getMessageClass().fromObject(args.anchor);
    }
    copy() {
        return new BlockAnchor(this.asObject());
    }
    asObject() {
        return {
            type: "blockAnchor",
            signature: this.signature === undefined ? undefined : this.signature.asObject(),
            anchor: this.anchor === undefined ? undefined : this.anchor.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], BlockAnchor.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).union)
], BlockAnchor.prototype, "signature", void 0);
__decorate([
    (encodeAs.field(3).union)
], BlockAnchor.prototype, "anchor", void 0);
export class CreditPayment {
    constructor(args) {
        this.type = MessageType.CreditPayment;
        this.paid = args.paid == undefined ? undefined : protocol.Fee.fromObject(args.paid);
        this.payer = args.payer == undefined ? undefined : URL.parse(args.payer);
        this.initiator = args.initiator == undefined ? undefined : args.initiator;
        this.txID = args.txID == undefined ? undefined : TxID.parse(args.txID);
        this.cause = args.cause == undefined ? undefined : TxID.parse(args.cause);
    }
    copy() {
        return new CreditPayment(this.asObject());
    }
    asObject() {
        return {
            type: "creditPayment",
            paid: this.paid === undefined ? undefined : protocol.Fee.getName(this.paid),
            payer: this.payer === undefined ? undefined : this.payer.toString(),
            initiator: this.initiator === undefined ? undefined : this.initiator,
            txID: this.txID === undefined ? undefined : this.txID.toString(),
            cause: this.cause === undefined ? undefined : this.cause.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], CreditPayment.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).enum)
], CreditPayment.prototype, "paid", void 0);
__decorate([
    (encodeAs.field(3).url)
], CreditPayment.prototype, "payer", void 0);
__decorate([
    (encodeAs.field(4).bool)
], CreditPayment.prototype, "initiator", void 0);
__decorate([
    (encodeAs.field(5).txid)
], CreditPayment.prototype, "txID", void 0);
__decorate([
    (encodeAs.field(6).txid)
], CreditPayment.prototype, "cause", void 0);
export class DidUpdateExecutorVersion {
    constructor(args) {
        this.type = MessageType.DidUpdateExecutorVersion;
        this.partition = args.partition == undefined ? undefined : args.partition;
        this.version =
            args.version == undefined ? undefined : protocol.ExecutorVersion.fromObject(args.version);
    }
    copy() {
        return new DidUpdateExecutorVersion(this.asObject());
    }
    asObject() {
        return {
            type: "didUpdateExecutorVersion",
            partition: this.partition === undefined ? undefined : this.partition,
            version: this.version === undefined ? undefined : protocol.ExecutorVersion.getName(this.version),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], DidUpdateExecutorVersion.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).string)
], DidUpdateExecutorVersion.prototype, "partition", void 0);
__decorate([
    (encodeAs.field(3).enum)
], DidUpdateExecutorVersion.prototype, "version", void 0);
export class Envelope {
    constructor(args) {
        this.signatures =
            args.signatures == undefined
                ? undefined
                : args.signatures.map((v) => v == undefined ? undefined : protocol.Signature.fromObject(v));
        this.txHash =
            args.txHash == undefined
                ? undefined
                : args.txHash instanceof Uint8Array
                    ? args.txHash
                    : Buffer.from(args.txHash, "hex");
        this.transaction =
            args.transaction == undefined
                ? undefined
                : args.transaction.map((v) => v == undefined
                    ? undefined
                    : v instanceof protocol.Transaction
                        ? v
                        : new protocol.Transaction(v));
        this.messages =
            args.messages == undefined
                ? undefined
                : args.messages.map((v) => (v == undefined ? undefined : getMessageClass().fromObject(v)));
    }
    copy() {
        return new Envelope(this.asObject());
    }
    asObject() {
        return {
            signatures: this.signatures === undefined
                ? undefined
                : this.signatures?.map((v) => (v == undefined ? undefined : v.asObject())),
            txHash: this.txHash === undefined
                ? undefined
                : this.txHash && Buffer.from(this.txHash).toString("hex"),
            transaction: this.transaction === undefined
                ? undefined
                : this.transaction?.map((v) => (v == undefined ? undefined : v.asObject())),
            messages: this.messages === undefined
                ? undefined
                : this.messages?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).repeatable.union)
], Envelope.prototype, "signatures", void 0);
__decorate([
    (encodeAs.field(2).bytes)
], Envelope.prototype, "txHash", void 0);
__decorate([
    (encodeAs.field(3).repeatable.reference)
], Envelope.prototype, "transaction", void 0);
__decorate([
    (encodeAs.field(4).repeatable.union)
], Envelope.prototype, "messages", void 0);
export class MakeMajorBlock {
    constructor(args) {
        this.type = MessageType.MakeMajorBlock;
        this.majorBlockIndex = args.majorBlockIndex == undefined ? undefined : args.majorBlockIndex;
        this.minorBlockIndex = args.minorBlockIndex == undefined ? undefined : args.minorBlockIndex;
        this.majorBlockTime =
            args.majorBlockTime == undefined
                ? undefined
                : args.majorBlockTime instanceof Date
                    ? args.majorBlockTime
                    : new Date(args.majorBlockTime);
    }
    copy() {
        return new MakeMajorBlock(this.asObject());
    }
    asObject() {
        return {
            type: "makeMajorBlock",
            majorBlockIndex: this.majorBlockIndex === undefined ? undefined : this.majorBlockIndex,
            minorBlockIndex: this.minorBlockIndex === undefined ? undefined : this.minorBlockIndex,
            majorBlockTime: this.majorBlockTime === undefined ? undefined : this.majorBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], MakeMajorBlock.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).uint)
], MakeMajorBlock.prototype, "majorBlockIndex", void 0);
__decorate([
    (encodeAs.field(3).uint)
], MakeMajorBlock.prototype, "minorBlockIndex", void 0);
__decorate([
    (encodeAs.field(4).time)
], MakeMajorBlock.prototype, "majorBlockTime", void 0);
export class NetworkUpdate {
    constructor(args) {
        this.type = MessageType.NetworkUpdate;
        this.accounts =
            args.accounts == undefined
                ? undefined
                : args.accounts.map((v) => v == undefined
                    ? undefined
                    : v instanceof protocol.NetworkAccountUpdate
                        ? v
                        : new protocol.NetworkAccountUpdate(v));
    }
    copy() {
        return new NetworkUpdate(this.asObject());
    }
    asObject() {
        return {
            type: "networkUpdate",
            accounts: this.accounts === undefined
                ? undefined
                : this.accounts?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], NetworkUpdate.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).repeatable.reference)
], NetworkUpdate.prototype, "accounts", void 0);
export class SequencedMessage {
    constructor(args) {
        this.type = MessageType.Sequenced;
        this.message = args.message == undefined ? undefined : getMessageClass().fromObject(args.message);
        this.source = args.source == undefined ? undefined : URL.parse(args.source);
        this.destination = args.destination == undefined ? undefined : URL.parse(args.destination);
        this.number = args.number == undefined ? undefined : args.number;
    }
    copy() {
        return new SequencedMessage(this.asObject());
    }
    asObject() {
        return {
            type: "sequenced",
            message: this.message === undefined ? undefined : this.message.asObject(),
            source: this.source === undefined ? undefined : this.source.toString(),
            destination: this.destination === undefined ? undefined : this.destination.toString(),
            number: this.number === undefined ? undefined : this.number,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], SequencedMessage.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).union)
], SequencedMessage.prototype, "message", void 0);
__decorate([
    (encodeAs.field(3).url)
], SequencedMessage.prototype, "source", void 0);
__decorate([
    (encodeAs.field(4).url)
], SequencedMessage.prototype, "destination", void 0);
__decorate([
    (encodeAs.field(5).uint)
], SequencedMessage.prototype, "number", void 0);
export class SignatureMessage {
    constructor(args) {
        this.type = MessageType.Signature;
        this.signature =
            args.signature == undefined ? undefined : protocol.Signature.fromObject(args.signature);
        this.txID = args.txID == undefined ? undefined : TxID.parse(args.txID);
    }
    copy() {
        return new SignatureMessage(this.asObject());
    }
    asObject() {
        return {
            type: "signature",
            signature: this.signature === undefined ? undefined : this.signature.asObject(),
            txID: this.txID === undefined ? undefined : this.txID.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], SignatureMessage.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).union)
], SignatureMessage.prototype, "signature", void 0);
__decorate([
    (encodeAs.field(3).txid)
], SignatureMessage.prototype, "txID", void 0);
export class SignatureRequest {
    constructor(args) {
        this.type = MessageType.SignatureRequest;
        this.authority = args.authority == undefined ? undefined : URL.parse(args.authority);
        this.txID = args.txID == undefined ? undefined : TxID.parse(args.txID);
        this.cause = args.cause == undefined ? undefined : TxID.parse(args.cause);
    }
    copy() {
        return new SignatureRequest(this.asObject());
    }
    asObject() {
        return {
            type: "signatureRequest",
            authority: this.authority === undefined ? undefined : this.authority.toString(),
            txID: this.txID === undefined ? undefined : this.txID.toString(),
            cause: this.cause === undefined ? undefined : this.cause.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], SignatureRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).url)
], SignatureRequest.prototype, "authority", void 0);
__decorate([
    (encodeAs.field(3).txid)
], SignatureRequest.prototype, "txID", void 0);
__decorate([
    (encodeAs.field(4).txid)
], SignatureRequest.prototype, "cause", void 0);
export class SynthFields {
    constructor(args) {
        this.message = args.message == undefined ? undefined : getMessageClass().fromObject(args.message);
        this.signature =
            args.signature == undefined ? undefined : protocol.KeySignature.fromObject(args.signature);
        this.proof =
            args.proof == undefined
                ? undefined
                : args.proof instanceof protocol.AnnotatedReceipt
                    ? args.proof
                    : new protocol.AnnotatedReceipt(args.proof);
    }
    copy() {
        return new SynthFields(this.asObject());
    }
    asObject() {
        return {
            message: this.message === undefined ? undefined : this.message.asObject(),
            signature: this.signature === undefined ? undefined : this.signature.asObject(),
            proof: this.proof === undefined ? undefined : this.proof.asObject(),
        };
    }
}
export class SyntheticMessage {
    constructor(args) {
        this.type = MessageType.Synthetic;
        this.message = args.message == undefined ? undefined : getMessageClass().fromObject(args.message);
        this.signature =
            args.signature == undefined ? undefined : protocol.KeySignature.fromObject(args.signature);
        this.proof =
            args.proof == undefined
                ? undefined
                : args.proof instanceof protocol.AnnotatedReceipt
                    ? args.proof
                    : new protocol.AnnotatedReceipt(args.proof);
    }
    copy() {
        return new SyntheticMessage(this.asObject());
    }
    asObject() {
        return {
            type: "synthetic",
            message: this.message === undefined ? undefined : this.message.asObject(),
            signature: this.signature === undefined ? undefined : this.signature.asObject(),
            proof: this.proof === undefined ? undefined : this.proof.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], SyntheticMessage.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).union)
], SyntheticMessage.prototype, "message", void 0);
__decorate([
    (encodeAs.field(3).union)
], SyntheticMessage.prototype, "signature", void 0);
__decorate([
    (encodeAs.field(4).reference)
], SyntheticMessage.prototype, "proof", void 0);
export class TransactionMessage {
    constructor(args) {
        this.type = MessageType.Transaction;
        this.transaction =
            args.transaction == undefined
                ? undefined
                : args.transaction instanceof protocol.Transaction
                    ? args.transaction
                    : new protocol.Transaction(args.transaction);
    }
    copy() {
        return new TransactionMessage(this.asObject());
    }
    asObject() {
        return {
            type: "transaction",
            transaction: this.transaction === undefined ? undefined : this.transaction.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], TransactionMessage.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).reference)
], TransactionMessage.prototype, "transaction", void 0);
//# sourceMappingURL=types_gen.js.map