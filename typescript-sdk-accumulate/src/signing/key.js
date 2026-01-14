var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SimpleExternalKey_sign;
import { sha256 } from "../common/index.js";
import { DelegatedSignature, KeySignature, Transaction, } from "../core/index.js";
import { encode } from "../encoding/index.js";
export class BaseKey {
    constructor(address) {
        this.address = address;
    }
    initSignature(_, opts) {
        return Promise.resolve(KeySignature.fromObject({
            type: this.address.type,
            publicKey: this.address.publicKey,
            signer: opts.signer,
            signerVersion: opts.signerVersion,
            timestamp: opts.timestamp,
            vote: opts.vote,
        }));
    }
    async sign(message, opts) {
        // Initialize the key signature
        const keySig = await this.initSignature(message, opts);
        // Apply delegators
        let sig = keySig;
        for (const del of opts.delegators || []) {
            sig = new DelegatedSignature({ signature: sig, delegator: del });
        }
        // The signature MUST be encoded before setting the signature or
        // transaction hash fields
        const sigMdHash = sha256(encode(sig));
        // Initiate if necessary
        const transaction = message instanceof Transaction ? message : undefined;
        if (transaction) {
            if (!transaction.header)
                throw new Error("transaction has no header");
            if (!transaction.header.initiator) {
                if (!opts.timestamp)
                    throw new Error("cannot initiate without a timestamp");
                transaction.header.initiator = sigMdHash;
            }
        }
        // Calculate the raw signature
        const rawSig = await this.signRaw(sig, message);
        // Finalize and return the key signature
        keySig.signature = rawSig;
        keySig.transactionHash = message.hash();
        return sig;
    }
}
export class SimpleExternalKey extends BaseKey {
    constructor(address, sign) {
        super(address);
        _SimpleExternalKey_sign.set(this, void 0);
        __classPrivateFieldSet(this, _SimpleExternalKey_sign, sign, "f");
    }
    async signRaw(signature, message) {
        const sigMdHash = sha256(encode(signature));
        const hash = sha256(Buffer.concat([sigMdHash, message.hash()]));
        return __classPrivateFieldGet(this, _SimpleExternalKey_sign, "f").call(this, hash);
    }
}
_SimpleExternalKey_sign = new WeakMap();
//# sourceMappingURL=key.js.map