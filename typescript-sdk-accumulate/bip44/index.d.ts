/// <reference types="node" />
import { SignatureType } from "../core/index.js";
import * as bip44path from "./path.js";
export * from "./path.js";
export declare function randomMnemonic(): string;
export declare function validMnemonic(mnemonic: string): boolean;
declare type Key = {
    privateKey: Buffer;
    signatureType: SignatureType;
};
export declare class HDWallet {
    signatureType: SignatureType;
    private seed;
    private hdKey;
    constructor(options: {
        mnemonic?: string;
        passphrase?: string;
        seed?: string | Buffer;
        signatureType: SignatureType;
    });
    deriveKey(path: string): Key;
}
export declare class BIP44 extends HDWallet {
    constructor(signatureType: SignatureType, mnemonic: string, passphrase?: string);
    getKey(account: number, change: number, address: number): Key;
    getKeyFromPath(path: string): Key;
}
export declare function GetCoinTypeFromSigType(sigType: number | SignatureType): bip44path.CoinType;
export declare function GetSigTypeFromCoinType(coin: number | bip44path.CoinType): SignatureType;
export declare function NewWalletFromMnemonic(mnemonic: string, coin: bip44path.CoinType, passphrase?: string): BIP44;
