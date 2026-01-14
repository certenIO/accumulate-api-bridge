import { AccumulateTxID } from "./txid.js";
export type URLArgs = AccumulateURL | URL | string;
export type URLObj = {
    scheme: string;
    hostname: string;
    username: string;
    pathname: string;
    search: string;
    hash: string;
};
export declare function parseURL(input: string | URL | URLObj): URLObj;
/**
 * An Accumulate URL (e.g: 'acc://my-identity/mydata')
 */
export declare class AccumulateURL {
    private readonly url;
    constructor(input: URL | URLObj | string);
    static parse(input: URLArgs): AccumulateURL;
    asTxID(): AccumulateTxID;
    withTxID(hash: Uint8Array | string): AccumulateTxID;
    /**
     * Append path to url and return a *new* AccumulateURL instance
     * @param path
     * @returns new AccumulateURL instance with appended path
     */
    join(...path: (string | AccumulateURL)[]): AccumulateURL;
    get username(): string;
    get authority(): string;
    get path(): string;
    get query(): string;
    get fragment(): string;
    toString(opts?: {
        omitUser?: boolean;
    }): string;
    equals(u: URLArgs): boolean;
}
