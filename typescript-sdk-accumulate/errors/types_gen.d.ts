import { Status, StatusArgs } from "./enums_gen.js";
export type CallSiteArgs = {
    funcName?: string;
    file?: string;
    line?: number;
};
export declare class CallSite {
    funcName?: string;
    file?: string;
    line?: number;
    constructor(args: CallSiteArgs);
    copy(): CallSite;
    asObject(): CallSiteArgs;
}
export type ErrorArgs = {
    message?: string;
    code?: StatusArgs;
    cause?: Error | ErrorArgs;
    callStack?: (CallSite | CallSiteArgs)[];
};
export declare class Error {
    message?: string;
    code?: Status;
    cause?: Error;
    callStack?: CallSite[];
    constructor(args: ErrorArgs);
    copy(): Error;
    asObject(): ErrorArgs;
}
