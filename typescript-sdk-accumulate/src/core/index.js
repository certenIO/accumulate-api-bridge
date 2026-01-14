export * from "./enums_gen.js";
export * from "./types_gen.js";
export * from "./unions_gen.js";
import { Buffer } from "../common/buffer.js";
import { AccumulateDataEntry, DoubleHashDataEntry, FactomDataEntryWrapper } from "./types_gen.js";
AccumulateDataEntry.prototype.hash = function () {
    if (!this.data) {
        return new Uint8Array();
    }
    return hashTree(this.data.map((v) => v || new Uint8Array()));
};
DoubleHashDataEntry.prototype.hash = function () {
    if (!this.data) {
        return new Uint8Array();
    }
    return sha256(hashTree(this.data.map((v) => v || new Uint8Array())));
};
FactomDataEntryWrapper.prototype.asBinary = function () {
    const len2buf = (x) => new Uint8Array([x >> 8, x]);
    const extIds = Buffer.concat((this.extIds || []).map((x) => {
        return Buffer.concat([len2buf(x?.length || 0), x || new Uint8Array()]);
    }));
    return Buffer.concat([
        Buffer.from([0]),
        Buffer.from(this.accountId || new Uint8Array(32)),
        len2buf(extIds.length),
        extIds,
        this.data || new Uint8Array(),
    ]);
};
FactomDataEntryWrapper.prototype.hash = function () {
    const data = this.asBinary();
    const sum = sha512(data);
    const salted = Buffer.concat([sum, data]);
    return sha256(salted);
};
/* eslint-disable @typescript-eslint/no-namespace */
import { AddCreditsResult, EmptyResult, WriteDataResult, } from "./types_gen.js";
import { Account, TransactionBody } from "./unions_gen.js";
import { TransactionType } from "./enums_gen.js";
import { AccumulateURL as URL } from "../address/url.js";
import { hashTree, sha256, sha512 } from "../common/index.js";
import { Signature } from "./unions_gen.js";
/**
 * The URL of the ACME token
 */
export const ACME_TOKEN_URL = URL.parse("acc://ACME");
/**
 * The URL of the DN
 */
export const DN_URL = URL.parse("acc://dn.acme");
/**
 * The URL of the anchors
 */
export const ANCHORS_URL = DN_URL.join("anchors");
/** @ignore */
export var Fee;
(function (Fee) {
    function getName(fee) {
        return fee;
    }
    Fee.getName = getName;
    function fromObject(obj) {
        if (typeof obj === "string")
            return Number(obj);
        return obj;
    }
    Fee.fromObject = fromObject;
})(Fee || (Fee = {}));
/** @ignore */
export var AllowedTransactions;
(function (AllowedTransactions) {
    function fromObject(obj) {
        if (!obj.length)
            return [];
        if (typeof obj[0] === "number")
            return obj;
        return obj.map((v) => TransactionType.byName(v));
    }
    AllowedTransactions.fromObject = fromObject;
})(AllowedTransactions || (AllowedTransactions = {}));
/** @ignore */
export var AnchorBody;
(function (AnchorBody) {
    function fromObject(obj) {
        return TransactionBody.fromObject(obj);
    }
    AnchorBody.fromObject = fromObject;
})(AnchorBody || (AnchorBody = {}));
/** @ignore */
export var Signer;
(function (Signer) {
    function fromObject(obj) {
        return Account.fromObject(obj);
    }
    Signer.fromObject = fromObject;
})(Signer || (Signer = {}));
/** @ignore */
export var TransactionResult;
(function (TransactionResult) {
    function fromObject(obj) {
        if (obj instanceof AddCreditsResult)
            return obj;
        if (obj instanceof EmptyResult)
            return obj;
        if (obj instanceof WriteDataResult)
            return obj;
        switch (obj.type) {
            case (TransactionType.AddCredits, "addCredits"):
                return new AddCreditsResult(obj);
            case (TransactionType.Unknown, "unknown"):
                return new EmptyResult(obj);
            case (TransactionType.WriteData, "writeData"):
                return new WriteDataResult(obj);
        }
        throw new Error(`Unknown signature '${obj.type}'`);
    }
    TransactionResult.fromObject = fromObject;
})(TransactionResult || (TransactionResult = {}));
/** @ignore */
export var KeySignature;
(function (KeySignature) {
    function fromObject(obj) {
        return Signature.fromObject(obj);
    }
    KeySignature.fromObject = fromObject;
})(KeySignature || (KeySignature = {}));
/** @ignore */
export var UserSignature;
(function (UserSignature) {
    function fromObject(obj) {
        return Signature.fromObject(obj);
    }
    UserSignature.fromObject = fromObject;
})(UserSignature || (UserSignature = {}));
//# sourceMappingURL=index.js.map