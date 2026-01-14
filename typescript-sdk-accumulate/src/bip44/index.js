import { HDKey } from "@scure/bip32";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { SignatureType } from "../core/index.js";
import * as bip44path from "./path.js";
export * from "./path.js";
const HDSigCoin = new Map([
    [SignatureType.RCD1, bip44path.CoinType.FactomFactoids],
    [SignatureType.ED25519, bip44path.CoinType.Accumulate],
    [SignatureType.BTC, bip44path.CoinType.Bitcoin],
    [SignatureType.ETH, bip44path.CoinType.Ether],
]);
const HDCoinSig = new Map([
    [bip44path.CoinType.FactomFactoids, SignatureType.RCD1],
    [bip44path.CoinType.Accumulate, SignatureType.ED25519],
    [bip44path.CoinType.Bitcoin, SignatureType.BTC],
    [bip44path.CoinType.Ether, SignatureType.ETH],
]);
export function randomMnemonic() {
    return bip39.generateMnemonic();
}
export function validMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
}
export class HDWallet {
    constructor(options) {
        if (!options || typeof options !== "object") {
            throw new Error("Options must be provided and must be an object");
        }
        this.signatureType = options.signatureType;
        this.seed = new Uint8Array(0);
        if (options.mnemonic) {
            const passwd = options.passphrase || "";
            this.seed = new Uint8Array(bip39.mnemonicToSeedSync(options.mnemonic, passwd));
        }
        else if (options.seed) {
            if (typeof options.seed === "string") {
                this.seed = new Uint8Array(Buffer.from(options.seed, "hex"));
            }
            else {
                this.seed = new Uint8Array(options.seed);
            }
        }
        this.hdKey = HDKey.fromMasterSeed(this.seed);
    }
    deriveKey(path) {
        const d = new bip44path.Derivation(inferDerivationCurve(this.signatureType));
        d.fromPath(path);
        if (d.getCoinType() !== GetCoinTypeFromSigType(this.signatureType)) {
            throw new Error(`error path coin type ${d.getCoinType()} does not match expected for signature type ${this.signatureType}`);
        }
        d.validate();
        if (this.signatureType === SignatureType.ED25519) {
            const seedHex = Buffer.from(this.seed).toString("hex");
            const bipkey = derivePath(path, seedHex);
            return {
                privateKey: bipkey.key,
                signatureType: this.signatureType,
            };
        }
        else {
            const derived = this.hdKey.derive(path);
            if (!derived.privateKey)
                throw new Error("Could not derive private key");
            return {
                privateKey: Buffer.from(derived.privateKey),
                signatureType: this.signatureType,
            };
        }
    }
}
export class BIP44 extends HDWallet {
    constructor(signatureType, mnemonic, passphrase) {
        super({ mnemonic, passphrase, signatureType });
    }
    //getKey: account will be hardened if it isn't. Change and Address will be hardened only if slip-10 derivation is needed
    getKey(account, change, address) {
        const coin = GetCoinTypeFromSigType(this.signatureType);
        return this.deriveKey(bip44path.makePath(coin, account, change, address));
    }
    getKeyFromPath(path) {
        return this.deriveKey(path);
    }
}
function inferDerivationCurve(sigType) {
    return sigType === SignatureType.ED25519
        ? bip44path.Curve.CurveEd25519
        : bip44path.Curve.CurveSecp256k1;
}
export function GetCoinTypeFromSigType(sigType) {
    // Ensure the numeric value corresponds to a valid enum value
    if (typeof sigType === "number" && sigType in SignatureType) {
        // Retrieve the corresponding CoinType using the enum value
        const ret = HDSigCoin.get(sigType);
        if (ret === undefined) {
            throw new Error(`coin type ${sigType} not found in signature mapping`);
        }
        return ret;
    }
    else {
        throw new Error(`Invalid value for SignatureType: ${sigType}`);
    }
}
export function GetSigTypeFromCoinType(coin) {
    if (coin in bip44path.CoinType) {
        const ret = HDCoinSig.get(coin);
        if (ret === undefined) {
            throw new Error(`coin type ${coin} not found in signature mapping`);
        }
        return ret;
    }
    else {
        throw new Error(`Invalid value for CoinType: ${coin}`);
    }
}
export function NewWalletFromMnemonic(mnemonic, coin, passphrase) {
    return new BIP44(GetSigTypeFromCoinType(coin), mnemonic, passphrase);
}
//# sourceMappingURL=index.js.map