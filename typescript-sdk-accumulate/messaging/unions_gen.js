import * as types from "./types_gen.js";
import { MessageType } from "./enums_gen.js";
/** @ignore */
export var Message;
(function (Message) {
    function fromObject(obj) {
        if (obj instanceof types.BadSyntheticMessage)
            return obj;
        if (obj instanceof types.BlockAnchor)
            return obj;
        if (obj instanceof types.CreditPayment)
            return obj;
        if (obj instanceof types.DidUpdateExecutorVersion)
            return obj;
        if (obj instanceof types.MakeMajorBlock)
            return obj;
        if (obj instanceof types.NetworkUpdate)
            return obj;
        if (obj instanceof types.SequencedMessage)
            return obj;
        if (obj instanceof types.SignatureMessage)
            return obj;
        if (obj instanceof types.SignatureRequest)
            return obj;
        if (obj instanceof types.SyntheticMessage)
            return obj;
        if (obj instanceof types.TransactionMessage)
            return obj;
        switch (obj.type) {
            case MessageType.BadSynthetic:
            case "badSynthetic":
                return new types.BadSyntheticMessage(obj);
            case MessageType.BlockAnchor:
            case "blockAnchor":
                return new types.BlockAnchor(obj);
            case MessageType.CreditPayment:
            case "creditPayment":
                return new types.CreditPayment(obj);
            case MessageType.DidUpdateExecutorVersion:
            case "didUpdateExecutorVersion":
                return new types.DidUpdateExecutorVersion(obj);
            case MessageType.MakeMajorBlock:
            case "makeMajorBlock":
                return new types.MakeMajorBlock(obj);
            case MessageType.NetworkUpdate:
            case "networkUpdate":
                return new types.NetworkUpdate(obj);
            case MessageType.Sequenced:
            case "sequenced":
                return new types.SequencedMessage(obj);
            case MessageType.Signature:
            case "signature":
                return new types.SignatureMessage(obj);
            case MessageType.SignatureRequest:
            case "signatureRequest":
                return new types.SignatureRequest(obj);
            case MessageType.Synthetic:
            case "synthetic":
                return new types.SyntheticMessage(obj);
            case MessageType.Transaction:
            case "transaction":
                return new types.TransactionMessage(obj);
            default:
                throw new Error(`Unknown message '${obj.type}'`);
        }
    }
    Message.fromObject = fromObject;
})(Message || (Message = {}));
//# sourceMappingURL=unions_gen.js.map