import { PrivateKeyAddress } from "../address/index.js";
import { Signature, SignatureType } from "../core/index.js";
import { BaseKey, PrivateKey, PublicKey, Signable, SimpleExternalKey } from "./key.js";
declare abstract class BaseED25519Key extends BaseKey {
    readonly address: PrivateKey;
    protected constructor(address: PrivateKey);
    protected static make(type: SignatureType, seedOrKey?: Uint8Array): PrivateKeyAddress;
    signRaw(signature: Signature, message: Signable): Promise<Uint8Array>;
}
export declare class ED25519Key extends BaseED25519Key {
    static generate(): ED25519Key;
    static from(seedOrKey: Uint8Array): ED25519Key;
}
export declare class RCD1Key extends BaseED25519Key {
    static generate(): RCD1Key;
    static from(seedOrKey: Uint8Array): RCD1Key;
}
/**
 * @deprecated Use {@link SimpleExternalKey}
 */
export declare class ExternalED22519Key extends SimpleExternalKey {
    constructor(address: PublicKey, sign: (hash: Uint8Array) => Promise<Uint8Array>);
}
/**
 * @deprecated Use {@link SimpleExternalKey}
 */
export declare class ExternalRCD1Key extends SimpleExternalKey {
    constructor(address: PublicKey, sign: (hash: Uint8Array) => Promise<Uint8Array>);
}
export {};
