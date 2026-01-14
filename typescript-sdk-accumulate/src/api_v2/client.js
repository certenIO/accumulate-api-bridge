import { TxID } from "../address/index.js";
import { AccumulateURL as URL } from "../address/url.js";
import { Buffer, sha256 } from "../common/index.js";
import { AddCredits, ANCHORS_URL, BurnTokens, CreateDataAccount, CreateIdentity, CreateKeyBook, CreateKeyPage, CreateToken, CreateTokenAccount, IssueTokens, SendTokens, Transaction, TransactionHeader, UpdateAccountAuth, UpdateKey, UpdateKeyPage, WriteData, } from "../core/index.js";
import { Envelope } from "../messaging/index.js";
import { RpcClient } from "./rpc-client.js";
export class TxError extends Error {
    constructor(txId, status) {
        super(`Failed transaction ${txId}: ${JSON.stringify(status, null, 4)}`);
        this.txId = txId;
        this.status = status;
    }
}
/**
 * Client to call Accumulate RPC APIs.
 */
export class Client {
    constructor(endpoint) {
        this._rpcClient = new RpcClient(endpoint);
    }
    /**
     * Direct RPC call.
     * @param method RPC method
     * @param params method parameters
     */
    async call(method, params) {
        return this._rpcClient.call(method, params);
    }
    /******************
     * Queries
     ******************/
    queryAcmeOracle() {
        return this.describe().then((d) => d.values.oracle.price);
    }
    queryAnchor(anchor) {
        return this.queryUrl(ANCHORS_URL.join(`#anchor/${anchor}`), { prove: true });
    }
    queryUrl(url, options) {
        const urlStr = url.toString();
        return this.call("query", {
            url: urlStr,
            ...options,
        });
    }
    queryTx(txId, options) {
        const txIdStr = txId.toString();
        const paramName = txIdStr.startsWith("acc://") ? "txIdUrl" : "txid";
        return this.call("query-tx", {
            [paramName]: txIdStr,
            ...options,
        });
    }
    queryTxHistory(url, pagination, options) {
        const urlStr = url.toString();
        return this.call("query-tx-history", {
            url: urlStr,
            ...pagination,
            ...options,
        });
    }
    queryDirectory(url, pagination, options) {
        return this.call("query-directory", {
            url: url.toString(),
            ...pagination,
            ...options,
        });
    }
    queryData(url, entryHash) {
        return this.call("query-data", {
            url: url.toString(),
            entryHash,
        });
    }
    queryDataSet(url, pagination, options) {
        return this.call("query-data-set", {
            url: url.toString(),
            ...pagination,
            ...options,
        });
    }
    queryKeyPageIndex(url, key) {
        const urlStr = url.toString();
        const keyStr = key instanceof Uint8Array ? Buffer.from(key).toString("hex") : key;
        return this.call("query-key-index", {
            url: urlStr,
            key: keyStr,
        });
    }
    queryMajorBlocks(url, pagination) {
        return this.call("query-major-blocks", {
            url: url.toString(),
            ...pagination,
        });
    }
    queryMinorBlocks(url, pagination, options) {
        return this.call("query-minor-blocks", {
            url: url.toString(),
            ...pagination,
            ...options,
        });
    }
    async querySignerVersion(signer, publicKeyHash) {
        let signerUrl;
        let pkh;
        if (signer instanceof URL) {
            signerUrl = signer;
            if (!publicKeyHash) {
                throw new Error("Missing public key hash");
            }
            pkh = publicKeyHash;
        }
        else {
            signerUrl = signer.url;
            pkh = await sha256(signer.key.address.publicKey);
        }
        const { data: { keyPage }, } = await this.queryKeyPageIndex(signerUrl, pkh);
        const res = await this.queryUrl(keyPage);
        return res.data.version;
    }
    /**
     * Wait for a transaction (and its associated synthetic tx ids) to be delivered.
     * Throw an error if the transaction has failed or the timeout is exhausted.
     * @param txId
     * @param options
     * @returns void
     */
    async waitOnTx(txId, options) {
        if (txId instanceof TxID)
            txId = txId.toString();
        // Options
        const to = options?.timeout ?? 30000;
        const pollInterval = options?.pollInterval ?? 500;
        const ignoreSyntheticTxs = options?.ignoreSyntheticTxs ?? false;
        const start = Date.now();
        let lastError;
        do {
            try {
                const { status, syntheticTxids } = await this.queryTx(txId);
                switch (status.code) {
                    case "pending":
                    case "remote":
                        await sleep(pollInterval);
                        continue;
                    case "delivered":
                        break;
                    default:
                        throw new TxError(txId, status);
                }
                if (ignoreSyntheticTxs) {
                    return;
                }
                // Also verify the associated synthetic txs
                const timeoutLeft = to - Date.now() + start;
                const stxIds = syntheticTxids || [];
                await Promise.all(stxIds.map((stxId) => this.waitOnTx(stxId, {
                    timeout: timeoutLeft,
                    pollInterval: options?.pollInterval,
                    ignoreSyntheticTxs: options?.ignoreSyntheticTxs,
                })));
                return;
            }
            catch (e) {
                // Do not retry on definitive transaction errors
                if (e instanceof TxError) {
                    throw e;
                }
                lastError = e;
                await sleep(pollInterval);
            }
            // Poll while timeout is not reached
        } while (Date.now() - start < to);
        throw new Error(`Transaction ${txId} was not confirmed within ${to / 1000}s. Cause: ${lastError}`);
    }
    /******************
     * Transactions
     ******************/
    addCredits(principal, addCredits, signer) {
        return this._execute(URL.parse(principal), new AddCredits(addCredits), signer);
    }
    burnTokens(principal, burnTokens, signer) {
        return this._execute(URL.parse(principal), new BurnTokens(burnTokens), signer);
    }
    createDataAccount(principal, createDataAccount, signer) {
        return this._execute(URL.parse(principal), new CreateDataAccount(createDataAccount), signer);
    }
    createIdentity(principal, createIdentity, signer) {
        return this._execute(URL.parse(principal), new CreateIdentity(createIdentity), signer);
    }
    createKeyBook(principal, createKeyBook, signer) {
        return this._execute(URL.parse(principal), new CreateKeyBook(createKeyBook), signer);
    }
    createKeyPage(principal, createKeyPage, signer) {
        return this._execute(URL.parse(principal), new CreateKeyPage(createKeyPage), signer);
    }
    createToken(principal, createToken, signer) {
        return this._execute(URL.parse(principal), new CreateToken(createToken), signer);
    }
    createTokenAccount(principal, createTokenAccount, signer) {
        return this._execute(URL.parse(principal), new CreateTokenAccount(createTokenAccount), signer);
    }
    issueTokens(principal, issueTokens, signer) {
        return this._execute(URL.parse(principal), new IssueTokens(issueTokens), signer);
    }
    sendTokens(principal, sendTokens, signer) {
        return this._execute(URL.parse(principal), new SendTokens(sendTokens), signer);
    }
    updateAccountAuth(principal, operation, signer) {
        const operations = operation instanceof Array ? operation : [operation];
        return this._execute(URL.parse(principal), new UpdateAccountAuth({ operations }), signer);
    }
    updateKey(principal, updateKey, signer) {
        return this._execute(URL.parse(principal), new UpdateKey(updateKey), signer);
    }
    updateKeyPage(principal, operation, signer) {
        const operations = operation instanceof Array ? operation : [operation];
        return this._execute(URL.parse(principal), new UpdateKeyPage({ operation: operations }), signer);
    }
    writeData(principal, writeData, signer) {
        return this._execute(URL.parse(principal), new WriteData(writeData), signer);
    }
    async _execute(principal, payload, signer) {
        const header = new TransactionHeader({ principal });
        const tx = new Transaction({ body: payload, header });
        const sig = await signer.sign(tx, { timestamp: Date.now() });
        const env = new Envelope({
            transaction: [tx],
            signatures: [sig],
        });
        return this.execute(env);
    }
    async execute(env) {
        const req = {
            envelope: env.asObject(),
        };
        const res = await this.call("execute-direct", req);
        if (res.result.error) {
            throw res.result.error;
        }
        return res;
    }
    /******************
     * Others
     ******************/
    async faucet(url) {
        const res = await this.call("faucet", {
            url: url.toString(),
        });
        if (res.result.error) {
            throw res.result.error;
        }
        return res;
    }
    status() {
        return this.call("status");
    }
    version() {
        return this.call("version");
    }
    describe() {
        return this.call("describe");
    }
    metrics(metric, duration) {
        return this.call("metrics", {
            metric,
            duration,
        });
    }
}
async function sleep(millis) {
    return new Promise((resolve) => setTimeout(resolve, millis));
}
//# sourceMappingURL=client.js.map