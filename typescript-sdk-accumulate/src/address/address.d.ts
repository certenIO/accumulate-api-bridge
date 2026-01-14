import { Signature, SignatureType } from "../core/index.js";
export declare namespace Address {
    function keyHash(type: SignatureType, publicKey: Uint8Array): Uint8Array;
    function fromKey(type: SignatureType, publicKey: Uint8Array): PublicKeyAddress;
    function fromKeyHash(type: SignatureType, publicKeyHash: Uint8Array): PublicKeyHashAddress;
    function fromSignature(sig: Signature): PublicKeyAddress;
}
export interface Address {
    type: SignatureType;
    publicKey?: Uint8Array;
    publicKeyHash?: Uint8Array;
    privateKey?: Uint8Array;
    toString(): string;
}
export declare class PublicKeyHashAddress implements Address {
    readonly type: SignatureType;
    readonly publicKeyHash: Uint8Array;
    constructor(type: SignatureType, publicKeyHash: Uint8Array);
    toString(): string;
}
export declare class PublicKeyAddress extends PublicKeyHashAddress {
    readonly type: SignatureType;
    readonly publicKeyHash: Uint8Array;
    readonly publicKey: Uint8Array;
    static from(type: SignatureType, publicKey: Uint8Array): PublicKeyAddress;
    protected constructor(type: SignatureType, publicKeyHash: Uint8Array, publicKey: Uint8Array);
}
export declare class PrivateKeyAddress extends PublicKeyHashAddress {
    readonly type: SignatureType;
    readonly publicKeyHash: Uint8Array;
    readonly publicKey: Uint8Array;
    readonly privateKey: Uint8Array;
    static from(type: SignatureType, publicKey: Uint8Array, privateKey: Uint8Array): PrivateKeyAddress;
    private constructor();
}
