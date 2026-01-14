import * as types from "./index.js";
import { QueryArgs } from "./unions_gen.js";
import { TxID, URLArgs } from "../address/index.js";
import * as messaging from "../messaging/index.js";
export declare const ERR_CODE_PROTOCOL = -33000;
/**
 * QueryWith defines a specific subset of a query type with the specified fields
 * marked as required and optional. The `queryType` field is always marked as
 * required.
 */
export type QueryWith<Base extends QueryArgs, Required extends keyof Base = never, Optional extends keyof Base = never> = {
    [K in Required | "queryType"]-?: Base[K];
} & {
    [K in Optional]?: Base[K];
};
export declare class JsonRpcClient {
    private readonly _rpcClient;
    constructor(endpoint: string);
    set debug(v: boolean);
    /**
     * Direct RPC call.
     * @param method RPC method
     * @param params method parameters
     */
    call<V = any>(method: string, params: any): Promise<V>;
    call<V = any>(requests: {
        method: string;
        params: any;
    }[]): Promise<V[]>;
    private typedCall;
    private typedCall2;
    consensusStatus(opts?: types.ConsensusStatusOptionsArgs): Promise<types.ConsensusStatus>;
    networkStatus(opts?: types.NetworkStatusOptionsArgs): Promise<types.NetworkStatus>;
    submit(envelope: messaging.EnvelopeArgs, opts?: types.SubmitOptionsArgs): Promise<types.Submission[]>;
    validate(envelope: messaging.EnvelopeArgs, opts?: types.ValidateOptionsArgs): Promise<types.Submission[]>;
    faucet(account: URLArgs, opts?: types.FaucetOptionsArgs): Promise<types.Submission>;
    /**
     * Query an account by URL or message by ID.
     * @param scope The account URL or message ID
     * @param query The query
     * @returns An account or message
     */
    query(scope: URLArgs | TxID, query?: types.DefaultQueryArgsWithType): Promise<types.AccountRecord | types.MessageRecord>;
    /**
     * List an account's chains.
     * @param scope The account URL
     * @param query The query
     * @returns A range of chains
     */
    query(scope: URLArgs, query: QueryWith<types.ChainQueryArgsWithType>): Promise<types.RecordRange<types.ChainRecord>>;
    /**
     * Get a chain.
     * @param scope The account URL
     * @param query The query
     * @returns The chain
     */
    query(scope: URLArgs, query: QueryWith<types.ChainQueryArgsWithType, "name">): Promise<types.ChainRecord>;
    /**
     * Get a chain entry by index.
     * @param scope The account URL
     * @param query The query
     * @returns The chain entry
     */
    query(scope: URLArgs, query: QueryWith<types.ChainQueryArgsWithType, "name" | "index", "includeReceipt">): Promise<types.ChainEntryRecord>;
    /**
     * Get a chain entry by hash.
     * @param scope The account URL
     * @param query The query
     * @returns The chain entry
     */
    query(scope: URLArgs, query: QueryWith<types.ChainQueryArgsWithType, "name" | "entry", "includeReceipt">): Promise<types.ChainEntryRecord>;
    /**
     * Get a range of chain entries.
     * @param scope The account URL
     * @param query The query
     * @returns A range of chain entries
     */
    query(scope: URLArgs, query: QueryWith<types.ChainQueryArgsWithType, "name" | "range", "includeReceipt">): Promise<types.RecordRange<types.ChainEntryRecord>>;
    /**
     * Get the latest data entry.
     * @param scope The account URL
     * @param query The query
     * @returns The transaction chain entry
     */
    query(scope: URLArgs, query: QueryWith<types.DataQueryArgsWithType>): Promise<types.ChainEntryRecord<types.MessageRecord<messaging.TransactionMessage>>>;
    /**
     * Get a data entry by index.
     * @param scope The account URL
     * @param query The query
     * @returns The transaction chain entry
     */
    query(scope: URLArgs, query: QueryWith<types.DataQueryArgsWithType, "index">): Promise<types.ChainEntryRecord<types.MessageRecord<messaging.TransactionMessage>>>;
    /**
     * Get a data entry by hash.
     * @param scope The account URL
     * @param query The query
     * @returns The transaction chain entry
     */
    query(scope: URLArgs, query: QueryWith<types.DataQueryArgsWithType, "entry">): Promise<types.ChainEntryRecord<types.MessageRecord<messaging.TransactionMessage>>>;
    /**
     * Get a range of data entries.
     * @param scope The account URL
     * @param query The query
     * @returns A range of transaction chain entries
     */
    query(scope: URLArgs, query: QueryWith<types.DataQueryArgsWithType, "range">): Promise<types.RecordRange<types.ChainEntryRecord<types.MessageRecord<messaging.TransactionMessage>>>>;
    /**
     * List an account's directory entries.
     * @param scope The account URL
     * @param query The query
     * @returns A range of account URLs
     */
    query(scope: URLArgs, query: QueryWith<types.DirectoryQueryArgsWithType, "range"> & {
        range: {
            expand?: false;
        };
    }): Promise<types.RecordRange<types.UrlRecord>>;
    /**
     * List an account's directory entries.
     * @param scope The account URL
     * @param query The query
     * @returns A range of accounts
     */
    query(scope: URLArgs, query: QueryWith<types.DirectoryQueryArgsWithType, "range"> & {
        range: {
            expand: true;
        };
    }): Promise<types.RecordRange<types.AccountRecord>>;
    /**
     * List an account's pending transactions.
     * @param scope The account URL
     * @param query The query
     * @returns A range of IDs or transactions
     */
    query(scope: URLArgs, query: QueryWith<types.PendingQueryArgsWithType, "range"> & {
        range: {
            expand?: false;
        };
    }): Promise<types.RecordRange<types.TxIDRecord>>;
    /**
     * List an account's pending transactions.
     * @param scope The account URL
     * @param query The query
     * @returns A range of IDs or transactions
     */
    query(scope: URLArgs, query: QueryWith<types.PendingQueryArgsWithType, "range"> & {
        range: {
            expand: true;
        };
    }): Promise<types.RecordRange<types.MessageRecord<messaging.TransactionMessage>>>;
    /**
     * Get a minor block.
     * @param scope The partition URL
     * @param query The query
     * @returns The minor block
     */
    query(scope: URLArgs, query: QueryWith<types.BlockQueryArgsWithType, "minor", "entryRange" | "omitEmpty">): Promise<types.MinorBlockRecord>;
    /**
     * Get a major block.
     * @param scope The partition URL
     * @param query The query
     * @returns The major block
     */
    query(scope: URLArgs, query: QueryWith<types.BlockQueryArgsWithType, "major", "minorRange" | "entryRange" | "omitEmpty">): Promise<types.MajorBlockRecord>;
    /**
     * List minor blocks.
     * @param scope The partition URL
     * @param query The query
     * @returns A range of minor blocks
     */
    query(scope: URLArgs, query: QueryWith<types.BlockQueryArgsWithType, "minorRange", "omitEmpty">): Promise<types.RecordRange<types.MinorBlockRecord>>;
    /**
     * List major blocks.
     * @param scope The partition URL
     * @param query The query
     * @returns A range of major blocks
     */
    query(scope: URLArgs, query: QueryWith<types.BlockQueryArgsWithType, "majorRange", "omitEmpty">): Promise<types.RecordRange<types.MajorBlockRecord>>;
    /**
     * Search an account for an anchor chain entry.
     * @param scope The anchor ledger
     * @param query The query
     * @returns A range of chain entries
     */
    query(scope: URLArgs, query: QueryWith<types.AnchorSearchQueryArgsWithType, "anchor", "includeReceipt">): Promise<types.RecordRange<types.ChainEntryRecord<never>>>;
    /**
     * Search for a signer entry by public key within the authorities of the given
     * account. Remote authorities (those that belong to a different domain from
     * the account) are not searched.
     * @param scope The account URL
     * @param query The query
     * @returns A range of key records
     */
    query(scope: URLArgs, query: QueryWith<types.PublicKeySearchQueryArgsWithType, "publicKey" | "type">): Promise<types.RecordRange<types.KeyRecord>>;
    /**
     * Search for a signer entry by public key hash within the authorities of the
     * given account. Remote authorities (those that belong to a different domain
     * from the account) are not searched.
     * @param scope The account URL
     * @param query The query
     * @returns A range of key records
     */
    query(scope: URLArgs, query: QueryWith<types.PublicKeyHashSearchQueryArgsWithType, "publicKeyHash">): Promise<types.RecordRange<types.KeyRecord>>;
    /**
     * Search for a signer entry by delegate within the authorities of the given
     * account. Remote authorities (those that belong to a different domain from
     * the account) are not searched.
     * @param scope The account URL
     * @param query The query
     * @returns A range of key records
     */
    query(scope: URLArgs, query: QueryWith<types.DelegateSearchQueryArgsWithType, "delegate">): Promise<types.RecordRange<types.KeyRecord>>;
    /**
     * Search for a message by hash.
     * @param scope The scope of the query or 'unknown'
     * @param query The query
     * @returns A range of messages
     */
    query(scope: URLArgs, query: QueryWith<types.MessageHashSearchQueryArgsWithType, "hash">): Promise<types.RecordRange<types.MessageRecord>>;
    /**
     * Query the network.
     * @param scope The scope of the query
     * @param query The query
     * @returns A record
     */
    query(scope: URLArgs | TxID, query: types.QueryArgs): Promise<types.Record>;
}
export { JsonRpcClient as Client };
