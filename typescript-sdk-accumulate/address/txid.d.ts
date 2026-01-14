import { AccumulateURL, URLObj } from "./url.js";
export type TxIDArgs = AccumulateTxID | URL | string | AccumulateURL;
export declare class AccumulateTxID {
    readonly account: AccumulateURL;
    readonly hash: Uint8Array;
    constructor(input: AccumulateURL | URL | URLObj | string, hash?: Uint8Array | string);
    static parse(input: TxIDArgs): AccumulateTxID;
    asUrl(): AccumulateURL;
    toString(): string;
    equals(u: TxIDArgs): boolean;
}
