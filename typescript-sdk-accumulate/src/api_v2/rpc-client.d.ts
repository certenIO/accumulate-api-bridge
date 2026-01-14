export declare class RpcError extends Error {
    readonly code: number;
    readonly data?: any;
    constructor(err: any);
}
export declare class RpcClient {
    private readonly _httpCli;
    private readonly _endpoint;
    private _idCounter;
    debug: boolean;
    constructor(endpoint: string);
    call(method: string, params: any): Promise<any>;
    call(requests: {
        method: string;
        params: any;
    }[]): Promise<any[]>;
}
