export * from "./enums_gen.js";
export * from "./types_gen.js";
export * from "./unions_gen.js";
declare module "./types_gen" {
    interface AccumulateDataEntry {
        hash(): Uint8Array;
    }
    interface DoubleHashDataEntry {
        hash(): Uint8Array;
    }
    interface FactomDataEntryWrapper {
        hash(): Uint8Array;
        asBinary(): Uint8Array;
    }
}
import { AddCreditsResult, BlockValidatorAnchor, DirectoryAnchor, EmptyResult, KeyPage, LiteIdentity, UnknownSigner, WriteDataResult } from "./types_gen.js";
import { TransactionType } from "./enums_gen.js";
import { AccumulateURL as URL } from "../address/url.js";
import { DelegatedSignature } from "./types_gen.js";
import { Signature } from "./unions_gen.js";
/**
 * The URL of the ACME token
 */
export declare const ACME_TOKEN_URL: URL;
/**
 * The URL of the DN
 */
export declare const DN_URL: URL;
/**
 * The URL of the anchors
 */
export declare const ANCHORS_URL: URL;
export type Fee = number;
export type FeeArgs = Fee | string;
/** @ignore */
export declare namespace Fee {
    function getName(fee: Fee): number;
    function fromObject(obj: FeeArgs): Fee;
}
export type AllowedTransactions = TransactionType[];
export type AllowedTransactionsArgs = AllowedTransactions | string[];
/** @ignore */
export declare namespace AllowedTransactions {
    function fromObject(obj: AllowedTransactionsArgs): AllowedTransactions;
}
type AsObject<T> = T extends {
    asObject(): infer P;
} ? P : never;
export type AnchorBody = DirectoryAnchor | BlockValidatorAnchor;
export type AnchorBodyArgs = AnchorBody | AsObject<AnchorBody>;
/** @ignore */
export declare namespace AnchorBody {
    function fromObject(obj: AnchorBodyArgs): AnchorBody;
}
export type Signer = LiteIdentity | KeyPage | UnknownSigner;
export type SignerArgs = Signer | AsObject<Signer>;
/** @ignore */
export declare namespace Signer {
    function fromObject(obj: SignerArgs): Signer;
}
export type TransactionResult = AddCreditsResult | EmptyResult | WriteDataResult;
export type TransactionResultArgs = TransactionResult | AsObject<TransactionResult>;
/** @ignore */
export declare namespace TransactionResult {
    function fromObject(obj: TransactionResultArgs): TransactionResult;
}
export type KeySignature = Extract<Signature, {
    publicKey?: Uint8Array;
}>;
export type KeySignatureArgs = KeySignature | AsObject<KeySignature>;
/** @ignore */
export declare namespace KeySignature {
    function fromObject(obj: KeySignatureArgs): KeySignature;
}
export type UserSignature = KeySignature | DelegatedSignature;
export type UserSignatureArgs = UserSignature | AsObject<UserSignature>;
/** @ignore */
export declare namespace UserSignature {
    function fromObject(obj: UserSignatureArgs): UserSignature;
}
