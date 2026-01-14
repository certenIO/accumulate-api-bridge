export declare enum BlockFilterMode {
    /** ExcludeNone return all blocks including empty ones. */
    ExcludeNone = 0,
    /** ExcludeEmpty exclude empty blocks. */
    ExcludeEmpty = 1
}
export type BlockFilterModeArgs = BlockFilterMode | string;
/** @ignore */
export declare namespace BlockFilterMode {
    function fromObject(obj: BlockFilterModeArgs): BlockFilterMode;
    function byName(name: string): BlockFilterMode;
    function getName(v: BlockFilterMode): "excludeNone" | "excludeEmpty";
}
export declare enum TxFetchMode {
    /** Expand expand the full transactions in the result set. */
    Expand = 0,
    /** Ids include the transaction IDs & count in the result set. */
    Ids = 1,
    /** CountOnly only include the transaction count in the result set. */
    CountOnly = 2,
    /** Omit omit all transaction info from the result set. */
    Omit = 3
}
export type TxFetchModeArgs = TxFetchMode | string;
/** @ignore */
export declare namespace TxFetchMode {
    function fromObject(obj: TxFetchModeArgs): TxFetchMode;
    function byName(name: string): TxFetchMode;
    function getName(v: TxFetchMode): "omit" | "expand" | "ids" | "countOnly";
}
