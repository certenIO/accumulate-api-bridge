import * as url from "../address/index.js";
import { Buffer } from "../common/buffer.js";
export interface Encodable {
    embedding?: boolean;
    encode(value: any): Uint8Array;
    consume?(value: any, consumer: any): void;
    raw?(value: any): {
        length: Uint8Array;
        value: Uint8Array;
    };
}
export declare class Int {
    encode(value: number): Uint8Array;
}
export declare class Uint {
    encode(value: number): Uint8Array;
}
export declare class Bool {
    encode(value: boolean): Uint8Array;
}
export declare class String {
    encode(value: string): Uint8Array;
    raw(value: string): {
        length: Uint8Array;
        value: Buffer;
    };
}
export declare class Hash {
    encode(value: Uint8Array): Uint8Array;
}
export declare class Bytes {
    encode(value: Uint8Array): Uint8Array;
    raw(value: Uint8Array): {
        length: Uint8Array;
        value: Buffer;
    };
    static raw(value: Uint8Array): {
        length: Uint8Array;
        value: Buffer;
    };
}
export declare class Url {
    encode(value: url.URL): Uint8Array;
    raw(value: url.URL): {
        length: Uint8Array;
        value: Buffer;
    };
}
export declare class Time {
    encode(value: Date): Uint8Array;
}
export declare class Duration {
    encode(_value: number): Uint8Array;
}
export declare class BigInt {
    encode(value: bigint): Uint8Array;
}
export declare class Float {
    encode(_value: number): Uint8Array;
}
export declare class TxID {
    encode(value: url.TxID): Uint8Array;
    raw(value: url.TxID): {
        length: Uint8Array;
        value: Buffer;
    };
}
export declare class Enum {
    readonly type?: any;
    constructor(type?: any);
    encode(value: number): Uint8Array;
}
export declare class Union {
    composite: boolean;
    private _encode?;
    private _consume?;
    private getEncode;
    private getConsume;
    encode(value: any): Uint8Array;
    consume(value: any, consumer: any): void;
}
export declare class Reference {
    composite: boolean;
    private _encode?;
    private _consume?;
    private getEncode;
    private getConsume;
    encode(value: any): Uint8Array;
    consume(value: any, consumer: any): void;
}
export declare class RawJson {
    encode(value: any): Uint8Array;
    raw(value: any): {
        length: Uint8Array;
        value: Buffer;
    };
}
export declare class Any {
    encode(_value: any): Uint8Array;
}
