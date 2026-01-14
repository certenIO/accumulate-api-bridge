import { TransactionHeader } from "./types_gen.js";
import { TransactionBody } from "./unions_gen.js";
export declare abstract class TransactionBase {
    private _hash?;
    header?: TransactionHeader;
    body?: TransactionBody;
    hash(): Uint8Array;
}
export declare function hashBody(body: TransactionBody): Uint8Array;
