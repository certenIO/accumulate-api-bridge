import { Address, URLArgs } from "../address/index.js";
import { KeySignature, Signature, UserSignature, VoteType } from "../core/index.js";
export type SignOptions = {
    signer: URLArgs;
    signerVersion: number;
    timestamp?: number;
    vote?: VoteType;
    delegators?: URLArgs[];
};
export type WithRequired<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};
export type PublicKey = WithRequired<Address, "publicKey" | "publicKeyHash">;
export type PrivateKey = WithRequired<PublicKey, "privateKey">;
export type Signable = {
    hash(): Uint8Array;
};
export interface Key {
    address: PublicKey;
    sign(message: Signable, args: SignOptions): Promise<UserSignature>;
}
export declare abstract class BaseKey implements Key {
    readonly address: PublicKey;
    protected constructor(address: PublicKey);
    abstract signRaw(signature: Signature, message: Signable): Promise<Uint8Array>;
    protected initSignature(_: Signable, opts: SignOptions): Promise<KeySignature>;
    sign(message: Signable, opts: SignOptions): Promise<UserSignature>;
}
export declare class SimpleExternalKey extends BaseKey {
    #private;
    constructor(address: PublicKey, sign: (hash: Uint8Array) => Promise<Uint8Array>);
    signRaw(signature: Signature, message: Signable): Promise<Uint8Array>;
}
