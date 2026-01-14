import * as types from "./index.js";
import { TxID } from "../address/index.js";
import { RpcClient, RpcError } from "../api_v2/rpc-client.js";
import * as errors from "../errors/index.js";
import * as msg from "./msg.js";
export const ERR_CODE_PROTOCOL = -33000;
export class JsonRpcClient {
    constructor(endpoint) {
        this._rpcClient = new RpcClient(endpoint);
    }
    set debug(v) {
        this._rpcClient.debug = v;
    }
    async call(method, params) {
        try {
            if (typeof method === "string") {
                return await this._rpcClient.call(method, params);
            }
            return await this._rpcClient.call(method);
        }
        catch (error) {
            if (!(error instanceof RpcError) || error.code > ERR_CODE_PROTOCOL)
                throw error;
            try {
                const raw = JSON.parse(error.data);
                return Promise.reject(new errors.Error(raw));
            }
            catch (_) {
                throw error;
            }
        }
    }
    async typedCall(method, params, inType, outType) {
        const res = await this.call(method, new inType(params).asObject());
        return "fromObject" in outType ? outType.fromObject(res) : new outType(res);
    }
    async typedCall2(method, params, inType, outType) {
        const res = (await this.call(method, new inType(params).asObject()));
        return "fromObject" in outType
            ? res.map((x) => outType.fromObject(x))
            : res.map((x) => new outType(x));
    }
    consensusStatus(opts = {}) {
        return this.typedCall("consensus-status", opts, msg.ConsensusStatusRequest, types.ConsensusStatus);
    }
    networkStatus(opts = {}) {
        return this.typedCall("network-status", opts, msg.NetworkStatusRequest, types.NetworkStatus);
    }
    // metrics(opts: types.MetricsOptions = {}): Promise<types.Metrics> {
    //   return this.typedCall('metrics', opts, msg.MetricsRequest, types.Metrics);
    // }
    submit(envelope, opts = {}) {
        return this.typedCall2("submit", { envelope, ...opts }, msg.SubmitRequest, types.Submission);
    }
    validate(envelope, opts = {}) {
        return this.typedCall2("validate", { envelope, ...opts }, msg.ValidateRequest, types.Submission);
    }
    faucet(account, opts = {}) {
        return this.typedCall("faucet", { account, ...opts }, msg.FaucetRequest, types.Submission);
    }
    query(scope, query = { queryType: "default" }) {
        if (scope instanceof TxID)
            scope = scope.asUrl();
        return this.typedCall("query", { scope, query }, msg.QueryRequest, types.Record);
    }
}
// Export Client as an alias for JsonRpcClient for backward compatibility
export { JsonRpcClient as Client };
//# sourceMappingURL=client.js.map