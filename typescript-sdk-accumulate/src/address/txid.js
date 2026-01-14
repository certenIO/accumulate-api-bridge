import { Buffer } from "../common/buffer.js";
import { AccumulateURL, parseURL } from "./url.js";
export class AccumulateTxID {
    constructor(input, hash) {
        if (hash) {
            if (typeof hash === "string") {
                hash = Uint8Array.from(Buffer.from(hash, "hex"));
            }
            if (!(input instanceof AccumulateURL)) {
                input = new AccumulateURL(input);
            }
            if (input.username) {
                throw new Error("Username is not empty");
            }
            this.hash = hash;
            this.account = input;
            return;
        }
        if (!(input instanceof AccumulateURL)) {
            input = new AccumulateURL(input);
        }
        if (!input.username) {
            throw new Error("URL is not a transaction ID: username is empty");
        }
        this.hash = Buffer.from(input.username, "hex");
        this.account = new AccumulateURL(input.toString({ omitUser: true }));
    }
    static parse(input) {
        if (input instanceof AccumulateTxID)
            return input;
        return new this(input);
    }
    asUrl() {
        const copy = parseURL(this.account.toString());
        copy.username = Buffer.from(this.hash).toString("hex");
        return new AccumulateURL(copy);
    }
    toString() {
        return this.asUrl().toString();
    }
    equals(u) {
        u = AccumulateTxID.parse(u);
        return this.toString().toLowerCase() === u.toString().toLowerCase();
    }
}
//# sourceMappingURL=txid.js.map