/**
 * @class LedgerAppName
 * {@link LedgerAppName}
 */
export class LedgerAppName {
    constructor(name) {
        this.name = name;
    }
}
/**
 * @class LedgerVersion
 * {@link LedgerVersion}
 */
export class LedgerVersion {
    constructor(major, minor, patch) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }
}
/**
 * @class LedgerDeviceInfo defines the Device info returned by the client
 * {@link LedgerDeviceInfo:class}
 */
export class LedgerDeviceInfo {
}
/**
 * @class LedgerAddress defines the Wallet info returned by the client
 * {@link LedgerAddress:class}
 */
export class LedgerAddress {
    constructor(publicKey, address, chainCode) {
        this.address = address;
        this.publicKey = publicKey;
        this.chainCode = chainCode;
    }
}
export class rsvSig {
    constructor() {
        this.r = new Uint8Array(32);
        this.s = new Uint8Array(32);
        this.v = new Uint8Array(1);
    }
    fromDER(signature, parityOdd) {
        if (signature.length < 72) {
            throw new Error("invalid signature length to convert der signature to rsv format");
        }
        let offset = 0;
        let xoffset = 4; // point to r value
        // copy r
        let xlength = signature[xoffset - 1];
        if (xlength == 33) {
            xlength = 32;
            xoffset++;
        }
        this.r.set(signature.slice(offset + 32 - xlength, xoffset));
        offset += 32;
        xoffset += xlength + 2; // move over rvalue and TagLEn
        // copy s value
        xlength = signature[xoffset - 1];
        if (xlength == 33) {
            xlength = 32;
            xoffset++;
        }
        this.s.set(signature.slice(offset + 32 - xlength, xoffset));
        // set v
        if (parityOdd == true) {
            this.v[0] = 1;
        }
        else {
            this.v[1] = 0;
        }
    }
}
/**
 * @class LedgerSignature defines the Wallet info returned by the client
 * {@link LedgerSignature:class}
 */
export class LedgerSignature {
    constructor(signature, v) {
        this.signature = signature;
        this.parityIsOdd = v;
    }
}
//# sourceMappingURL=results.js.map