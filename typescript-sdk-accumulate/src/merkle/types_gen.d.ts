export type ReceiptArgs = {
    start?: Uint8Array | string;
    startIndex?: number;
    end?: Uint8Array | string;
    endIndex?: number;
    anchor?: Uint8Array | string;
    entries?: (ReceiptEntry | ReceiptEntryArgs | undefined)[];
};
export declare class Receipt {
    start?: Uint8Array;
    startIndex?: number;
    end?: Uint8Array;
    endIndex?: number;
    anchor?: Uint8Array;
    entries?: (ReceiptEntry | undefined)[];
    constructor(args: ReceiptArgs);
    copy(): Receipt;
    asObject(): ReceiptArgs;
}
export type ReceiptEntryArgs = {
    right?: boolean;
    hash?: Uint8Array | string;
};
export declare class ReceiptEntry {
    right?: boolean;
    hash?: Uint8Array;
    constructor(args: ReceiptEntryArgs);
    copy(): ReceiptEntry;
    asObject(): ReceiptEntryArgs;
}
export type ReceiptListArgs = {
    merkleState?: State | StateArgs;
    elements?: (Uint8Array | string | undefined)[];
    receipt?: Receipt | ReceiptArgs;
    continuedReceipt?: Receipt | ReceiptArgs;
};
export declare class ReceiptList {
    merkleState?: State;
    elements?: (Uint8Array | undefined)[];
    receipt?: Receipt;
    continuedReceipt?: Receipt;
    constructor(args: ReceiptListArgs);
    copy(): ReceiptList;
    asObject(): ReceiptListArgs;
}
export type StateArgs = {
    count?: number;
    pending?: (Uint8Array | string | undefined)[];
    hashList?: (Uint8Array | string | undefined)[];
};
export declare class State {
    count?: number;
    pending?: (Uint8Array | undefined)[];
    hashList?: (Uint8Array | undefined)[];
    constructor(args: StateArgs);
    copy(): State;
    asObject(): StateArgs;
}
