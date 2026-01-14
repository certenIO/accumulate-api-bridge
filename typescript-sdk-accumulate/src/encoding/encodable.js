// Note: Consumer type and functions moved to avoid circular dependency
import { Buffer } from "../common/buffer.js";
import { bigNumberMarshalBinary as bigIntMarshalBinary, booleanMarshalBinary, bytesMarshalBinary, hashMarshalBinary, stringMarshalBinary, uvarintMarshalBinary as uintMarshalBinary, uvarintMarshalBinary, varintMarshalBinary as intMarshalBinary, } from "./encoding.js";
export class Int {
    encode(value) {
        return intMarshalBinary(value);
    }
}
export class Uint {
    encode(value) {
        return uintMarshalBinary(value);
    }
}
export class Bool {
    encode(value) {
        return booleanMarshalBinary(value);
    }
}
export class String {
    encode(value) {
        return stringMarshalBinary(value);
    }
    raw(value) {
        return Bytes.raw(Buffer.from(value, "utf-8"));
    }
}
export class Hash {
    encode(value) {
        return hashMarshalBinary(value);
    }
}
export class Bytes {
    encode(value) {
        return bytesMarshalBinary(value);
    }
    raw(value) {
        return Bytes.raw(value);
    }
    static raw(value) {
        const length = uvarintMarshalBinary(value.length);
        return { length, value: Buffer.from(value) };
    }
}
export class Url {
    encode(value) {
        return stringMarshalBinary(value.toString());
    }
    raw(value) {
        return Bytes.raw(Buffer.from(value.toString(), "utf-8"));
    }
}
export class Time {
    encode(value) {
        return uintMarshalBinary(value.getTime() / 1000);
    }
}
export class Duration {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    encode(_value) {
        throw new Error("TODO: marshal duration to binary");
    }
}
export class BigInt {
    encode(value) {
        return bigIntMarshalBinary(value);
    }
}
export class Float {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    encode(_value) {
        throw new Error("TODO: marshal float to binary");
    }
}
export class TxID {
    encode(value) {
        return stringMarshalBinary(value.toString());
    }
    raw(value) {
        return Bytes.raw(Buffer.from(value.toString(), "utf-8"));
    }
}
export class Enum {
    constructor(type) {
        this.type = type;
    }
    encode(value) {
        return uintMarshalBinary(value);
    }
}
export class Union {
    constructor() {
        this.composite = true;
    }
    getEncode() {
        if (!this._encode) {
            // Import encode function dynamically to avoid circular dependency
            const { encode } = require("./index.js");
            this._encode = encode;
        }
        return this._encode;
    }
    getConsume() {
        if (!this._consume) {
            // Import consume function dynamically to avoid circular dependency
            const { consume } = require("./index.js");
            this._consume = consume;
        }
        return this._consume;
    }
    encode(value) {
        return bytesMarshalBinary(this.getEncode()(value));
    }
    consume(value, consumer) {
        this.getConsume()(value, consumer);
    }
}
export class Reference {
    constructor() {
        this.composite = true;
    }
    getEncode() {
        if (!this._encode) {
            // Import encode function dynamically to avoid circular dependency
            const { encode } = require("./index.js");
            this._encode = encode;
        }
        return this._encode;
    }
    getConsume() {
        if (!this._consume) {
            // Import consume function dynamically to avoid circular dependency
            const { consume } = require("./index.js");
            this._consume = consume;
        }
        return this._consume;
    }
    encode(value) {
        return bytesMarshalBinary(this.getEncode()(value));
    }
    consume(value, consumer) {
        this.getConsume()(value, consumer);
    }
}
export class RawJson {
    encode(value) {
        const json = JSON.stringify(value);
        const bytes = Buffer.from(json, "utf-8");
        return bytesMarshalBinary(bytes);
    }
    raw(value) {
        const json = JSON.stringify(value);
        return Bytes.raw(Buffer.from(json, "utf-8"));
    }
}
export class Any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    encode(_value) {
        throw new Error("cannot marshal type any to binary");
    }
}
//# sourceMappingURL=encodable.js.map