import { ChainQueryResponse, DescriptionResponse, GeneralQueryArgs, MinorBlocksQueryArgs, QueryOptionsArgs, QueryPaginationArgs, StatusResponse, TxHistoryQueryArgs, TxnQueryArgs, TxResponse } from ".";
import { TxID } from "../address/index.js";
import { AccumulateURL as URL } from "../address/url.js";
import { AccountAuthOperationArgs, AddCreditsArgs, BurnTokensArgs, CreateDataAccountArgs, CreateIdentityArgs, CreateKeyBookArgs, CreateKeyPageArgs, CreateTokenAccountArgs, CreateTokenArgs, IssueTokensArgs, KeyPageOperationArgs, SendTokensArgs, UpdateKeyArgs, WriteDataArgs } from "../core/index.js";
import { Envelope } from "../messaging/index.js";
import { Signer, SignerWithVersion } from "../signing/index.js";
/**
 * Options for waiting on transaction delivering.
 */
export type WaitTxOptions = {
    /**
     * Timeout after which status polling is aborted. Duration in ms.
     * Default: 30000ms (30s)
     */
    timeout?: number;
    /**
     * Interval between each tx status poll. Duration in ms.
     * Default: 500ms.
     */
    pollInterval?: number;
    /**
     * If set to true, only the user tx status is checked.
     * If set to false, will also wait on the associated synthetic txs to be delivered.
     * Default: false
     */
    ignoreSyntheticTxs?: boolean;
};
export declare class TxError extends Error {
    readonly txId: string;
    readonly status: any;
    constructor(txId: string, status: any);
}
export type TxResponse2 = TxResponse & {
    txid: TxID;
};
/**
 * Client to call Accumulate RPC APIs.
 */
export declare class Client {
    private readonly _rpcClient;
    constructor(endpoint: string);
    /**
     * Direct RPC call.
     * @param method RPC method
     * @param params method parameters
     */
    call<T>(method: string, params?: any): Promise<T>;
    /******************
     * Queries
     ******************/
    queryAcmeOracle(): Promise<number>;
    queryAnchor(anchor: string): Promise<any>;
    queryUrl(url: string | URL, options?: Omit<GeneralQueryArgs, "url">): Promise<any>;
    queryTx(txId: string | URL | TxID, options?: Omit<TxnQueryArgs, "txid" | "txidUrl">): Promise<any>;
    queryTxHistory(url: string | URL, pagination: QueryPaginationArgs, options?: Omit<TxHistoryQueryArgs, "url" | keyof QueryPaginationArgs>): Promise<any>;
    queryDirectory(url: string | URL, pagination: QueryPaginationArgs, options?: QueryOptionsArgs): Promise<any>;
    queryData(url: string | URL, entryHash?: string): Promise<any>;
    queryDataSet(url: string | URL, pagination: QueryPaginationArgs, options?: QueryOptionsArgs): Promise<any>;
    queryKeyPageIndex(url: string | URL, key: string | Uint8Array): Promise<any>;
    queryMajorBlocks(url: string | URL, pagination: QueryPaginationArgs): Promise<any>;
    queryMinorBlocks(url: string | URL, pagination: QueryPaginationArgs, options?: Omit<MinorBlocksQueryArgs, "url" | keyof QueryPaginationArgs>): Promise<any>;
    querySignerVersion(signer: Signer | URL, publicKeyHash?: Uint8Array): Promise<number>;
    /**
     * Wait for a transaction (and its associated synthetic tx ids) to be delivered.
     * Throw an error if the transaction has failed or the timeout is exhausted.
     * @param txId
     * @param options
     * @returns void
     */
    waitOnTx(txId: string | TxID, options?: WaitTxOptions): Promise<void>;
    /******************
     * Transactions
     ******************/
    addCredits(principal: URL | string, addCredits: AddCreditsArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    burnTokens(principal: URL | string, burnTokens: BurnTokensArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    createDataAccount(principal: URL | string, createDataAccount: CreateDataAccountArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    createIdentity(principal: URL | string, createIdentity: CreateIdentityArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    createKeyBook(principal: URL | string, createKeyBook: CreateKeyBookArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    createKeyPage(principal: URL | string, createKeyPage: CreateKeyPageArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    createToken(principal: URL | string, createToken: CreateTokenArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    createTokenAccount(principal: URL | string, createTokenAccount: CreateTokenAccountArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    issueTokens(principal: URL | string, issueTokens: IssueTokensArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    sendTokens(principal: URL | string, sendTokens: SendTokensArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    updateAccountAuth(principal: URL | string, operation: AccountAuthOperationArgs | AccountAuthOperationArgs[], signer: SignerWithVersion): Promise<TxResponse2>;
    updateKey(principal: URL | string, updateKey: UpdateKeyArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    updateKeyPage(principal: URL | string, operation: KeyPageOperationArgs | KeyPageOperationArgs[], signer: SignerWithVersion): Promise<TxResponse2>;
    writeData(principal: URL | string, writeData: WriteDataArgs, signer: SignerWithVersion): Promise<TxResponse2>;
    private _execute;
    execute(env: Envelope): Promise<TxResponse2>;
    /******************
     * Others
     ******************/
    faucet(url: string | URL): Promise<TxResponse2>;
    status(): Promise<StatusResponse>;
    version(): Promise<ChainQueryResponse>;
    describe(): Promise<DescriptionResponse>;
    metrics(metric: string, duration: number): Promise<ChainQueryResponse>;
}
