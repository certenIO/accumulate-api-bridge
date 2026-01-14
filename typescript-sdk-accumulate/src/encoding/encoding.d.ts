export declare function fieldMarshalBinary(field: number, val: Uint8Array): Uint8Array;
export declare function uvarintMarshalBinary(val: number | bigint, field?: number): Uint8Array;
export declare function varintMarshalBinary(val: number | bigint, field?: number): Uint8Array;
export declare function bigNumberMarshalBinary(bn: bigint, field?: number): Uint8Array;
export declare function booleanMarshalBinary(b: boolean, field?: number): Uint8Array;
export declare function stringMarshalBinary(val: string, field?: number): Uint8Array;
export declare function bytesMarshalBinary(val: Uint8Array, field?: number): Uint8Array;
export declare function hashMarshalBinary(val: Uint8Array, field?: number): Uint8Array;
