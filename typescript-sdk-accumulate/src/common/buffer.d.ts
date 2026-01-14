type Encoding = "hex" | "utf-8" | "base64";
export declare class Buffer extends Uint8Array {
    static from(v?: null, encoding?: Encoding): undefined;
    static from(v: string, encoding?: Encoding): Buffer;
    static from(v: Iterable<number> | ArrayLike<number>, mapFn?: (v: number, k: number) => number, thisArg?: any): Buffer;
    static from(v: string, mapFn: (v: number, k: number) => number, thisArg?: any): never;
    static concat(v: ArrayLike<number>[]): Uint8Array;
    toString(encoding?: Encoding): string;
}
export {};
