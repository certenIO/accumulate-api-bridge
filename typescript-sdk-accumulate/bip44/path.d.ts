export declare const Purpose = 2147483692;
export declare const FirstHardenedChild = 2147483648;
export declare enum CoinType {
    Bitcoin = 2147483648,
    Ether = 2147483708,
    FactomFactoids = 2147483779,
    Accumulate = 2147483929
}
export declare const DefaultAccumulateBaseDerivationPath: number[];
export declare const DefaultBitcoinBaseDerivationPath: number[];
export declare const DefaultEtherBaseDerivationPath: number[];
export declare const DefaultFactoidBaseDerivationPath: number[];
export declare const HDMap: Map<CoinType, number[]>;
export declare function getCoinTypeString(coinType: CoinType, hardened?: boolean): string;
export declare function fromPath(path: string): Derivation;
export declare function makePath(coinType: CoinType, account: number, change: number, address: number): string;
export declare enum Curve {
    CurveSecp256k1 = 0,
    CurveEd25519 = 1
}
export declare enum PathElement {
    Purpose = 0,
    CoinType = 1,
    Account = 2,
    Change = 3,
    Address = 4
}
export declare class Derivation {
    private path;
    private readonly curve;
    constructor(curve: Curve, path?: number[]);
    getPurpose(): number;
    getCoinType(): number;
    getAccount(): number;
    getChange(): number;
    getAddress(): number;
    validate(): void;
    toPath(): string;
    toString(): string;
    toPathArray(): number[];
    fromPath(path: string): void;
}
export declare function inferCurve(coinType: CoinType): Curve;
