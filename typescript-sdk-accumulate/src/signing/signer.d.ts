import { URL, URLArgs } from "../address/index.js";
import type { UserSignature } from "../core/index.js";
import type { Key, Signable, SignOptions } from "./key.js";
export declare class Signer {
    readonly key: Key;
    readonly url: URL;
    constructor(key: Key, url: URL);
    static forPage(url: URLArgs, key: Key): Signer;
    static forLite(key: Key): SignerWithVersion;
    sign(message: Signable, opts: Omit<SignOptions, "signer">): Promise<UserSignature>;
    withVersion(version: number): SignerWithVersion;
}
export declare class SignerWithVersion extends Signer {
    readonly version: number;
    constructor(key: Key, url: URL, version: number);
    sign(message: Signable, opts: Omit<SignOptions, "signer" | "signerVersion">): Promise<UserSignature>;
}
