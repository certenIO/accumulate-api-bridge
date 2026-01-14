import { TransportModule } from "../hw/index.js";
/**
 * @class LedgerAppName
 * {@link LedgerAppName}
 */
export declare class LedgerAppName {
    constructor(name: string);
    name: string;
}
/**
 * @class LedgerVersion
 * {@link LedgerVersion}
 */
export declare class LedgerVersion {
    constructor(major: number, minor: number, patch: number);
    major: number;
    minor: number;
    patch: number;
}
/**
 * @class LedgerDeviceInfo defines the Device info returned by the client
 * {@link LedgerDeviceInfo:class}
 */
export declare class LedgerDeviceInfo {
    deviceId: string;
    name: string;
    transportModule: TransportModule;
}
/**
 * @class LedgerAddress defines the Wallet info returned by the client
 * {@link LedgerAddress:class}
 */
export declare class LedgerAddress {
    constructor(publicKey: string, address: string, chainCode: string);
    publicKey: string;
    address: string;
    chainCode: string;
}
export declare class rsvSig {
    constructor();
    r: Uint8Array;
    s: Uint8Array;
    v: Uint8Array;
    fromDER(signature: Uint8Array, parityOdd: boolean): void;
}
/**
 * @class LedgerSignature defines the Wallet info returned by the client
 * {@link LedgerSignature:class}
 */
export declare class LedgerSignature {
    constructor(signature: string, v: boolean);
    signature: string;
    parityIsOdd: boolean;
}
