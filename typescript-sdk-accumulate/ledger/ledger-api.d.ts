import type Transport from "@ledgerhq/hw-transport";
import { URLArgs } from "../address/url.js";
import { Signature } from "../core/index.js";
import { BaseKey, Signable, Signer } from "../signing/index.js";
import { LedgerAddress, LedgerAppName, LedgerDeviceInfo, LedgerSignature, LedgerVersion } from "./model/results.js";
/**
 * {@link LedgerApi}
 */
export declare class LedgerApi {
    transport: Transport;
    constructor(transport: Transport);
    signerForLite(path: string): Promise<import("../signing/signer.js").SignerWithVersion>;
    signerForPage(page: URLArgs, path: string): Promise<Signer>;
    /**
     * get Factom address for a given BIP 32 path.
     * @param path a path in BIP 32 format (note: all paths muth be hardened (e.g. .../0'/0' )
     * @param boolDisplay if true, optionally display the address on the device, default = false
     * @param boolChainCode, if true, return the chain code, default = false
     * @param alias, a named key alias that is provided by the client to appear on the display, default = ""
     * @return an object with a publicKey and address with optional chainCode and chainid
     * @example
     * const fctaddr = await fct.getAddress("44'/131'/0'/0/0")
     * const accumulateaddr = await fct.getAddress("44'/281'/0'/0/0")
     */
    getPublicKey(path: string, boolDisplay?: boolean, boolChainCode?: boolean, alias?: string): Promise<LedgerAddress>;
    /**
     * You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign
     * @param path a path in BIP 32 format (note: all paths muth be hardened (e.g. .../0'/0' )
     * @param unsignedEnvelopeHex The binary Marshaled Transaction Envelope with unsigned Signature struct in Hex
     * @example
     const result = await fct.signTransaction("44'/131'/0'/0/0", "02016253dfaa7301010087db406ff65cb9dd72a1e99bcd51da5e03b0ccafc237dbf1318a8d7438e22371c892d6868d20f02894db071e2eb38fdc56c697caaeba7dc19bddae2c6e7084cc3120d667b49f")
     */
    signTransaction(path: string, unsignedEnvelopeHex: string): Promise<LedgerSignature>;
    /**
     */
    getVersion(): Promise<LedgerVersion>;
    /**
     */
    getAppName(): Promise<LedgerAppName>;
}
/**
 * @returns LedgerDeviceInfo array
 */
export declare function queryHidWallets(): Promise<Array<LedgerDeviceInfo>>;
export declare class LedgerKey extends BaseKey {
    private readonly api;
    readonly path: string;
    static load(api: LedgerApi, path: string): Promise<LedgerKey>;
    private constructor();
    signRaw(sig: Signature, msg: Signable): Promise<Uint8Array>;
}
