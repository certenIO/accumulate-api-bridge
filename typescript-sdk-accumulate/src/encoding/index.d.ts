import "reflect-metadata";
import { Encodable, Uint } from "./encodable.js";
export * from "./encodable.js";
export * from "./encoding.js";
export declare const FieldNumber: Uint;
export declare const Length: Uint;
export declare function encode(target: any): Uint8Array;
export type Consumer = (field: Field, value: any) => void;
export declare function consume(target: any, consume: Consumer): void;
export interface Field {
    name: PropertyKey;
    number: number;
    type: Encodable;
    repeatable: boolean;
    embedded?: Field[];
    keepEmpty: boolean;
}
export declare class Encoding {
    readonly fields: Field[];
    static get(target: any): Encoding | undefined;
    static forClass<T, C extends abstract new (...args: any) => T>(target: C): Encoding | undefined;
    static set(target: any): Encoding;
    addField(number: number[], props: Omit<Field, "number">): void;
}
export declare const encodeAs: {
    field(...number: number[]): Annotator;
};
export declare class Annotator {
    private number;
    private field;
    constructor(number: number[]);
    get repeatable(): this;
    get keepEmpty(): this;
    get enum(): {
        (target: any, key: PropertyKey): void;
        of(type: any): (target: any, key: PropertyKey) => void;
    };
    get reference(): (target: any, key: PropertyKey) => void;
    get union(): (target: any, key: PropertyKey) => void;
    get int(): (target: any, key: PropertyKey) => void;
    get uint(): (target: any, key: PropertyKey) => void;
    get bool(): (target: any, key: PropertyKey) => void;
    get string(): (target: any, key: PropertyKey) => void;
    get hash(): (target: any, key: PropertyKey) => void;
    get bytes(): (target: any, key: PropertyKey) => void;
    get url(): (target: any, key: PropertyKey) => void;
    get time(): (target: any, key: PropertyKey) => void;
    get duration(): (target: any, key: PropertyKey) => void;
    get bigInt(): (target: any, key: PropertyKey) => void;
    get rawJson(): (target: any, key: PropertyKey) => void;
    get txid(): (target: any, key: PropertyKey) => void;
}
