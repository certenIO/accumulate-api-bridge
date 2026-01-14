import * as api from "./index.js";
import { AccumulateURL as URL, URLArgs } from "../address/url.js";
import * as errors2 from "../errors/index.js";
import * as messaging from "../messaging/index.js";
import { MessageType } from "./msg.js";
import * as p2p from "./p2p.js";
export type ConsensusStatusRequestArgs = {
    nodeID?: string;
    partition?: string;
    includePeers?: boolean;
    includeAccumulate?: boolean;
};
export type ConsensusStatusRequestArgsWithType = ConsensusStatusRequestArgs & {
    type: MessageType.ConsensusStatusRequest | "consensusStatusRequest";
};
export declare class ConsensusStatusRequest {
    readonly type = MessageType.ConsensusStatusRequest;
    nodeID?: string;
    partition?: string;
    includePeers?: boolean;
    includeAccumulate?: boolean;
    constructor(args: ConsensusStatusRequestArgs);
    copy(): ConsensusStatusRequest;
    asObject(): ConsensusStatusRequestArgsWithType;
}
export type ConsensusStatusResponseArgs = {
    value?: api.ConsensusStatus | api.ConsensusStatusArgs;
};
export type ConsensusStatusResponseArgsWithType = ConsensusStatusResponseArgs & {
    type: MessageType.ConsensusStatusResponse | "consensusStatusResponse";
};
export declare class ConsensusStatusResponse {
    readonly type = MessageType.ConsensusStatusResponse;
    value?: api.ConsensusStatus;
    constructor(args: ConsensusStatusResponseArgs);
    copy(): ConsensusStatusResponse;
    asObject(): ConsensusStatusResponseArgsWithType;
}
export type ErrorResponseArgs = {
    error?: errors2.Error | errors2.ErrorArgs;
};
export type ErrorResponseArgsWithType = ErrorResponseArgs & {
    type: MessageType.ErrorResponse | "errorResponse";
};
export declare class ErrorResponse {
    readonly type = MessageType.ErrorResponse;
    error?: errors2.Error;
    constructor(args: ErrorResponseArgs);
    copy(): ErrorResponse;
    asObject(): ErrorResponseArgsWithType;
}
export type EventMessageArgs = {
    value?: (api.Event | api.EventArgs | undefined)[];
};
export type EventMessageArgsWithType = EventMessageArgs & {
    type: MessageType.Event | "event";
};
export declare class EventMessage {
    readonly type = MessageType.Event;
    value?: (api.Event | undefined)[];
    constructor(args: EventMessageArgs);
    copy(): EventMessage;
    asObject(): EventMessageArgsWithType;
}
export type FaucetRequestArgs = {
    account?: URLArgs;
    token?: URLArgs;
};
export type FaucetRequestArgsWithType = FaucetRequestArgs & {
    type: MessageType.FaucetRequest | "faucetRequest";
};
export declare class FaucetRequest {
    readonly type = MessageType.FaucetRequest;
    account?: URL;
    token?: URL;
    constructor(args: FaucetRequestArgs);
    copy(): FaucetRequest;
    asObject(): FaucetRequestArgsWithType;
}
export type FaucetResponseArgs = {
    value?: api.Submission | api.SubmissionArgs;
};
export type FaucetResponseArgsWithType = FaucetResponseArgs & {
    type: MessageType.FaucetResponse | "faucetResponse";
};
export declare class FaucetResponse {
    readonly type = MessageType.FaucetResponse;
    value?: api.Submission;
    constructor(args: FaucetResponseArgs);
    copy(): FaucetResponse;
    asObject(): FaucetResponseArgsWithType;
}
export type FindServiceRequestArgs = {
    network?: string;
    service?: api.ServiceAddress | api.ServiceAddressArgs;
    known?: boolean;
    timeout?: number;
};
export type FindServiceRequestArgsWithType = FindServiceRequestArgs & {
    type: MessageType.FindServiceRequest | "findServiceRequest";
};
export declare class FindServiceRequest {
    readonly type = MessageType.FindServiceRequest;
    network?: string;
    service?: api.ServiceAddress;
    known?: boolean;
    timeout?: number;
    constructor(args: FindServiceRequestArgs);
    copy(): FindServiceRequest;
    asObject(): FindServiceRequestArgsWithType;
}
export type FindServiceResponseArgs = {
    value?: (api.FindServiceResult | api.FindServiceResultArgs | undefined)[];
};
export type FindServiceResponseArgsWithType = FindServiceResponseArgs & {
    type: MessageType.FindServiceResponse | "findServiceResponse";
};
export declare class FindServiceResponse {
    readonly type = MessageType.FindServiceResponse;
    value?: (api.FindServiceResult | undefined)[];
    constructor(args: FindServiceResponseArgs);
    copy(): FindServiceResponse;
    asObject(): FindServiceResponseArgsWithType;
}
export type NetworkStatusRequestArgs = {
    partition?: string;
};
export type NetworkStatusRequestArgsWithType = NetworkStatusRequestArgs & {
    type: MessageType.NetworkStatusRequest | "networkStatusRequest";
};
export declare class NetworkStatusRequest {
    readonly type = MessageType.NetworkStatusRequest;
    partition?: string;
    constructor(args: NetworkStatusRequestArgs);
    copy(): NetworkStatusRequest;
    asObject(): NetworkStatusRequestArgsWithType;
}
export type NetworkStatusResponseArgs = {
    value?: api.NetworkStatus | api.NetworkStatusArgs;
};
export type NetworkStatusResponseArgsWithType = NetworkStatusResponseArgs & {
    type: MessageType.NetworkStatusResponse | "networkStatusResponse";
};
export declare class NetworkStatusResponse {
    readonly type = MessageType.NetworkStatusResponse;
    value?: api.NetworkStatus;
    constructor(args: NetworkStatusResponseArgs);
    copy(): NetworkStatusResponse;
    asObject(): NetworkStatusResponseArgsWithType;
}
export type NodeInfoRequestArgs = {
    peerID?: p2p.PeerID | p2p.PeerIDArgs;
};
export type NodeInfoRequestArgsWithType = NodeInfoRequestArgs & {
    type: MessageType.NodeInfoRequest | "nodeInfoRequest";
};
export declare class NodeInfoRequest {
    readonly type = MessageType.NodeInfoRequest;
    peerID?: p2p.PeerID;
    constructor(args: NodeInfoRequestArgs);
    copy(): NodeInfoRequest;
    asObject(): NodeInfoRequestArgsWithType;
}
export type NodeInfoResponseArgs = {
    value?: api.NodeInfo | api.NodeInfoArgs;
};
export type NodeInfoResponseArgsWithType = NodeInfoResponseArgs & {
    type: MessageType.NodeInfoResponse | "nodeInfoResponse";
};
export declare class NodeInfoResponse {
    readonly type = MessageType.NodeInfoResponse;
    value?: api.NodeInfo;
    constructor(args: NodeInfoResponseArgs);
    copy(): NodeInfoResponse;
    asObject(): NodeInfoResponseArgsWithType;
}
export type PrivateSequenceRequestArgs = {
    source?: URLArgs;
    destination?: URLArgs;
    sequenceNumber?: number;
    nodeID?: p2p.PeerID | p2p.PeerIDArgs;
};
export type PrivateSequenceRequestArgsWithType = PrivateSequenceRequestArgs & {
    type: MessageType.PrivateSequenceRequest | "privateSequenceRequest";
};
export declare class PrivateSequenceRequest {
    readonly type = MessageType.PrivateSequenceRequest;
    source?: URL;
    destination?: URL;
    sequenceNumber?: number;
    nodeID?: p2p.PeerID;
    constructor(args: PrivateSequenceRequestArgs);
    copy(): PrivateSequenceRequest;
    asObject(): PrivateSequenceRequestArgsWithType;
}
export type PrivateSequenceResponseArgs = {
    value?: api.MessageRecord<messaging.Message> | api.MessageRecordArgs<messaging.Message>;
};
export type PrivateSequenceResponseArgsWithType = PrivateSequenceResponseArgs & {
    type: MessageType.PrivateSequenceResponse | "privateSequenceResponse";
};
export declare class PrivateSequenceResponse {
    readonly type = MessageType.PrivateSequenceResponse;
    value?: api.MessageRecord<messaging.Message>;
    constructor(args: PrivateSequenceResponseArgs);
    copy(): PrivateSequenceResponse;
    asObject(): PrivateSequenceResponseArgsWithType;
}
export type QueryRequestArgs = {
    scope?: URLArgs;
    query?: api.Query | api.QueryArgs;
};
export type QueryRequestArgsWithType = QueryRequestArgs & {
    type: MessageType.QueryRequest | "queryRequest";
};
export declare class QueryRequest {
    readonly type = MessageType.QueryRequest;
    scope?: URL;
    query?: api.Query;
    constructor(args: QueryRequestArgs);
    copy(): QueryRequest;
    asObject(): QueryRequestArgsWithType;
}
export type RecordResponseArgs = {
    value?: api.Record | api.RecordArgs;
};
export type RecordResponseArgsWithType = RecordResponseArgs & {
    type: MessageType.RecordResponse | "recordResponse";
};
export declare class RecordResponse {
    readonly type = MessageType.RecordResponse;
    value?: api.Record;
    constructor(args: RecordResponseArgs);
    copy(): RecordResponse;
    asObject(): RecordResponseArgsWithType;
}
export type SubmitRequestArgs = {
    envelope?: messaging.Envelope | messaging.EnvelopeArgs;
    verify?: boolean;
    wait?: boolean;
};
export type SubmitRequestArgsWithType = SubmitRequestArgs & {
    type: MessageType.SubmitRequest | "submitRequest";
};
export declare class SubmitRequest {
    readonly type = MessageType.SubmitRequest;
    envelope?: messaging.Envelope;
    verify?: boolean;
    wait?: boolean;
    constructor(args: SubmitRequestArgs);
    copy(): SubmitRequest;
    asObject(): SubmitRequestArgsWithType;
}
export type SubmitResponseArgs = {
    value?: (api.Submission | api.SubmissionArgs | undefined)[];
};
export type SubmitResponseArgsWithType = SubmitResponseArgs & {
    type: MessageType.SubmitResponse | "submitResponse";
};
export declare class SubmitResponse {
    readonly type = MessageType.SubmitResponse;
    value?: (api.Submission | undefined)[];
    constructor(args: SubmitResponseArgs);
    copy(): SubmitResponse;
    asObject(): SubmitResponseArgsWithType;
}
export type SubscribeRequestArgs = {
    partition?: string;
    account?: URLArgs;
};
export type SubscribeRequestArgsWithType = SubscribeRequestArgs & {
    type: MessageType.SubscribeRequest | "subscribeRequest";
};
export declare class SubscribeRequest {
    readonly type = MessageType.SubscribeRequest;
    partition?: string;
    account?: URL;
    constructor(args: SubscribeRequestArgs);
    copy(): SubscribeRequest;
    asObject(): SubscribeRequestArgsWithType;
}
export type SubscribeResponseArgs = {};
export type SubscribeResponseArgsWithType = {
    type: MessageType.SubscribeResponse | "subscribeResponse";
};
export declare class SubscribeResponse {
    readonly type = MessageType.SubscribeResponse;
    constructor(_: SubscribeResponseArgs);
    copy(): SubscribeResponse;
    asObject(): SubscribeResponseArgsWithType;
}
export type ValidateRequestArgs = {
    envelope?: messaging.Envelope | messaging.EnvelopeArgs;
    full?: boolean;
};
export type ValidateRequestArgsWithType = ValidateRequestArgs & {
    type: MessageType.ValidateRequest | "validateRequest";
};
export declare class ValidateRequest {
    readonly type = MessageType.ValidateRequest;
    envelope?: messaging.Envelope;
    full?: boolean;
    constructor(args: ValidateRequestArgs);
    copy(): ValidateRequest;
    asObject(): ValidateRequestArgsWithType;
}
export type ValidateResponseArgs = {
    value?: (api.Submission | api.SubmissionArgs | undefined)[];
};
export type ValidateResponseArgsWithType = ValidateResponseArgs & {
    type: MessageType.ValidateResponse | "validateResponse";
};
export declare class ValidateResponse {
    readonly type = MessageType.ValidateResponse;
    value?: (api.Submission | undefined)[];
    constructor(args: ValidateResponseArgs);
    copy(): ValidateResponse;
    asObject(): ValidateResponseArgsWithType;
}
