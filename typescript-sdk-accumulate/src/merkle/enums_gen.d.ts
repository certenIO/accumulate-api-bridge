export declare enum ChainType {
    /** Unknown is used when the chain type is not known. */
    Unknown = 0,
    /** Transaction holds transaction hashes. */
    Transaction = 1,
    /** Anchor holds chain anchors. */
    Anchor = 2,
    /** Index indexes other chains. */
    Index = 4
}
export type ChainTypeArgs = ChainType | string;
/** @ignore */
export declare namespace ChainType {
    function fromObject(obj: ChainTypeArgs): ChainType;
    function byName(name: string): ChainType;
    function getName(v: ChainType): "unknown" | "transaction" | "anchor" | "index";
}
