import { URL } from "../address/index.js";
import { Buffer, sha256 } from "../common/index.js";
export class Signer {
    constructor(key, url) {
        this.key = key;
        this.url = url;
    }
    static forPage(url, key) {
        return new Signer(key, URL.parse(url));
    }
    static forLite(key) {
        const keyStr = Buffer.from(key.address.publicKeyHash.slice(0, 20)).toString("hex");
        const checkSum = sha256(Buffer.from(keyStr, "utf-8"));
        const checkStr = Buffer.from(checkSum.slice(28)).toString("hex");
        const url = URL.parse(keyStr + checkStr);
        return new SignerWithVersion(key, url, 1);
    }
    sign(message, opts) {
        return this.key.sign(message, {
            ...opts,
            signer: this.url,
        });
    }
    withVersion(version) {
        return new SignerWithVersion(this.key, this.url, version);
    }
}
export class SignerWithVersion extends Signer {
    constructor(key, url, version) {
        super(key, url);
        this.version = version;
    }
    sign(message, opts) {
        return this.key.sign(message, {
            ...opts,
            signer: this.url,
            signerVersion: this.version,
        });
    }
}
//# sourceMappingURL=signer.js.map