var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Buffer } from "../common/buffer.js";
import { encodeAs } from "../encoding/index.js";
export class Receipt {
    constructor(args) {
        this.start =
            args.start == undefined
                ? undefined
                : args.start instanceof Uint8Array
                    ? args.start
                    : Buffer.from(args.start, "hex");
        this.startIndex = args.startIndex == undefined ? undefined : args.startIndex;
        this.end =
            args.end == undefined
                ? undefined
                : args.end instanceof Uint8Array
                    ? args.end
                    : Buffer.from(args.end, "hex");
        this.endIndex = args.endIndex == undefined ? undefined : args.endIndex;
        this.anchor =
            args.anchor == undefined
                ? undefined
                : args.anchor instanceof Uint8Array
                    ? args.anchor
                    : Buffer.from(args.anchor, "hex");
        this.entries =
            args.entries == undefined
                ? undefined
                : args.entries.map((v) => v == undefined ? undefined : v instanceof ReceiptEntry ? v : new ReceiptEntry(v));
    }
    copy() {
        return new Receipt(this.asObject());
    }
    asObject() {
        return {
            start: this.start === undefined
                ? undefined
                : this.start && Buffer.from(this.start).toString("hex"),
            startIndex: this.startIndex === undefined ? undefined : this.startIndex,
            end: this.end === undefined ? undefined : this.end && Buffer.from(this.end).toString("hex"),
            endIndex: this.endIndex === undefined ? undefined : this.endIndex,
            anchor: this.anchor === undefined
                ? undefined
                : this.anchor && Buffer.from(this.anchor).toString("hex"),
            entries: this.entries === undefined
                ? undefined
                : this.entries?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).bytes)
], Receipt.prototype, "start", void 0);
__decorate([
    (encodeAs.field(2).int)
], Receipt.prototype, "startIndex", void 0);
__decorate([
    (encodeAs.field(3).bytes)
], Receipt.prototype, "end", void 0);
__decorate([
    (encodeAs.field(4).int)
], Receipt.prototype, "endIndex", void 0);
__decorate([
    (encodeAs.field(5).bytes)
], Receipt.prototype, "anchor", void 0);
__decorate([
    (encodeAs.field(6).repeatable.reference)
], Receipt.prototype, "entries", void 0);
export class ReceiptEntry {
    constructor(args) {
        this.right = args.right == undefined ? undefined : args.right;
        this.hash =
            args.hash == undefined
                ? undefined
                : args.hash instanceof Uint8Array
                    ? args.hash
                    : Buffer.from(args.hash, "hex");
    }
    copy() {
        return new ReceiptEntry(this.asObject());
    }
    asObject() {
        return {
            right: this.right === undefined ? undefined : this.right,
            hash: this.hash === undefined ? undefined : this.hash && Buffer.from(this.hash).toString("hex"),
        };
    }
}
__decorate([
    (encodeAs.field(1).bool)
], ReceiptEntry.prototype, "right", void 0);
__decorate([
    (encodeAs.field(2).bytes)
], ReceiptEntry.prototype, "hash", void 0);
export class ReceiptList {
    constructor(args) {
        this.merkleState =
            args.merkleState == undefined
                ? undefined
                : args.merkleState instanceof State
                    ? args.merkleState
                    : new State(args.merkleState);
        this.elements =
            args.elements == undefined
                ? undefined
                : args.elements.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
        this.receipt =
            args.receipt == undefined
                ? undefined
                : args.receipt instanceof Receipt
                    ? args.receipt
                    : new Receipt(args.receipt);
        this.continuedReceipt =
            args.continuedReceipt == undefined
                ? undefined
                : args.continuedReceipt instanceof Receipt
                    ? args.continuedReceipt
                    : new Receipt(args.continuedReceipt);
    }
    copy() {
        return new ReceiptList(this.asObject());
    }
    asObject() {
        return {
            merkleState: this.merkleState === undefined ? undefined : this.merkleState.asObject(),
            elements: this.elements === undefined
                ? undefined
                : this.elements?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
            receipt: this.receipt === undefined ? undefined : this.receipt.asObject(),
            continuedReceipt: this.continuedReceipt === undefined ? undefined : this.continuedReceipt.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).reference)
], ReceiptList.prototype, "merkleState", void 0);
__decorate([
    (encodeAs.field(2).repeatable.bytes)
], ReceiptList.prototype, "elements", void 0);
__decorate([
    (encodeAs.field(3).reference)
], ReceiptList.prototype, "receipt", void 0);
__decorate([
    (encodeAs.field(4).reference)
], ReceiptList.prototype, "continuedReceipt", void 0);
export class State {
    constructor(args) {
        this.count = args.count == undefined ? undefined : args.count;
        this.pending =
            args.pending == undefined
                ? undefined
                : args.pending.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
        this.hashList =
            args.hashList == undefined
                ? undefined
                : args.hashList.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
    }
    copy() {
        return new State(this.asObject());
    }
    asObject() {
        return {
            count: this.count === undefined ? undefined : this.count,
            pending: this.pending === undefined
                ? undefined
                : this.pending?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
            hashList: this.hashList === undefined
                ? undefined
                : this.hashList?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
        };
    }
}
//# sourceMappingURL=types_gen.js.map