/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-debugger */
import "reflect-metadata";
import { Buffer } from "../common/buffer.js";
import { BigInt, Bool, Bytes, Duration, Enum, Hash, Int, RawJson, Reference, String, Time, TxID, Uint, Union, Url, } from "./encodable.js";
import { bytesMarshalBinary, uvarintMarshalBinary as uintMarshalBinary } from "./encoding.js";
export * from "./encodable.js";
export * from "./encoding.js";
export const FieldNumber = new Uint();
export const Length = new Uint();
export function encode(target) {
    const parts = [];
    consume(target, (field, value) => {
        parts.push(uintMarshalBinary(field.number));
        parts.push(field.type.encode(value));
    });
    return Buffer.concat(parts);
}
export function consume(target, consume) {
    const enc = Encoding.get(target);
    if (!enc)
        throw new Error("cannot encode object: no metadata");
    for (const field of enc.fields) {
        encodeField(target, field, consume);
    }
}
function encodeField(target, field, consume) {
    const value = field.type instanceof Embedded ? target : target[field.name];
    if (!field.repeatable) {
        encodeValue(value, field, consume);
        return;
    }
    if (value)
        for (const item of value)
            encodeValue(item, field, consume);
}
function encodeValue(value, field, consume) {
    switch (true) {
        case field.type instanceof Hash:
            if (!field.keepEmpty && isZeroHash(value))
                return;
            break;
        case field.type instanceof Embedded:
            break;
        default:
            if (!field.keepEmpty && !value)
                return;
            break;
    }
    consume(field, value);
}
function isZeroHash(value) {
    if (!value)
        return true;
    for (const v of value) {
        if (v !== 0)
            return false;
    }
    return true;
}
class Embedded {
    constructor(field) {
        this.field = field;
        this.embedding = true;
    }
    encode(value) {
        const parts = [];
        this.consume(value, (field, value) => {
            parts.push(uintMarshalBinary(field.number));
            parts.push(field.type.encode(value));
        });
        return bytesMarshalBinary(Buffer.concat(parts));
    }
    consume(value, consumer) {
        for (const item of this.field.embedded) {
            encodeField(value, item, consumer);
        }
    }
}
export class Encoding {
    constructor() {
        this.fields = [];
    }
    static get(target) {
        const proto = Object.getPrototypeOf(target);
        if (Reflect.hasOwnMetadata("encoding", proto))
            return Reflect.getMetadata("encoding", proto);
        return;
    }
    static forClass(target) {
        if (Reflect.hasOwnMetadata("encoding", target.prototype))
            return Reflect.getMetadata("encoding", target.prototype);
        return;
    }
    static set(target) {
        if (Reflect.hasOwnMetadata("encoding", target))
            return Reflect.getMetadata("encoding", target);
        const encoding = new Encoding();
        Reflect.defineMetadata("encoding", encoding, target);
        return encoding;
    }
    addField(number, props) {
        if (number.length > 2)
            throw new Error("multiply nested fields are not supported");
        if (number.length == 1) {
            this.fields.push({ number: number[0], ...props });
            return;
        }
        let field = this.fields.find((x) => x.number === number[0]);
        if (!field) {
            field = {
                number: number[0],
                type: {
                    encode() {
                        throw new Error("placeholder");
                    },
                },
                name: "",
                repeatable: false,
                keepEmpty: false,
                embedded: [],
            };
            (field.type = new Embedded(field)), this.fields.push(field);
        }
        field.embedded.push({ number: number[1], ...props });
    }
}
export const encodeAs = {
    field(...number) {
        return new Annotator(number);
    },
};
export class Annotator {
    constructor(number) {
        this.number = number;
        this.field = {
            repeatable: false,
            keepEmpty: false,
        };
    }
    get repeatable() {
        this.field.repeatable = true;
        return this;
    }
    get keepEmpty() {
        this.field.keepEmpty = true;
        return this;
    }
    get enum() {
        const add = (target, key, type) => Encoding.set(target).addField(this.number, {
            name: key,
            type: new Enum(type),
            ...this.field,
        });
        const annotator = (target, key) => add(target, key);
        annotator.of = (type) => (target, key) => add(target, key, type);
        return annotator;
    }
    get reference() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, {
                name: key,
                type: new Reference(),
                ...this.field,
            });
        };
    }
    get union() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new Union(), ...this.field });
        };
    }
    get int() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new Int(), ...this.field });
        };
    }
    get uint() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new Uint(), ...this.field });
        };
    }
    get bool() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new Bool(), ...this.field });
        };
    }
    get string() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new String(), ...this.field });
        };
    }
    get hash() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new Hash(), ...this.field });
        };
    }
    get bytes() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new Bytes(), ...this.field });
        };
    }
    get url() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new Url(), ...this.field });
        };
    }
    get time() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new Time(), ...this.field });
        };
    }
    get duration() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, {
                name: key,
                type: new Duration(),
                ...this.field,
            });
        };
    }
    get bigInt() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new BigInt(), ...this.field });
        };
    }
    // asAny(target: any, key: PropertyKey) {
    //   Encoding.set(target).addField(this.number, { name: key, type: new Any, ...this.field });
    // }
    get rawJson() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new RawJson(), ...this.field });
        };
    }
    // asFloat(target: any, key: PropertyKey) {
    //   Encoding.set(target).addField(this.number, { name: key, type: new Float, ...this.field });
    // }
    get txid() {
        return (target, key) => {
            Encoding.set(target).addField(this.number, { name: key, type: new TxID(), ...this.field });
        };
    }
}
//# sourceMappingURL=index.js.map