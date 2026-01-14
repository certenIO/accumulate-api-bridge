var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as api from "./index.js";
import { AccumulateURL as URL } from "../address/url.js";
import { encodeAs } from "../encoding/index.js";
import * as errors2 from "../errors/index.js";
import * as messaging from "../messaging/index.js";
import { MessageType } from "./msg.js";
import * as p2p from "./p2p.js";
export class ConsensusStatusRequest {
    constructor(args) {
        this.type = MessageType.ConsensusStatusRequest;
        this.nodeID = args.nodeID == undefined ? undefined : args.nodeID;
        this.partition = args.partition == undefined ? undefined : args.partition;
        this.includePeers = args.includePeers == undefined ? undefined : args.includePeers;
        this.includeAccumulate =
            args.includeAccumulate == undefined ? undefined : args.includeAccumulate;
    }
    copy() {
        return new ConsensusStatusRequest(this.asObject());
    }
    asObject() {
        return {
            type: "consensusStatusRequest",
            nodeID: this.nodeID === undefined ? undefined : this.nodeID,
            partition: this.partition === undefined ? undefined : this.partition,
            includePeers: this.includePeers === undefined ? undefined : this.includePeers,
            includeAccumulate: this.includeAccumulate === undefined ? undefined : this.includeAccumulate,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], ConsensusStatusRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2, 1).string)
], ConsensusStatusRequest.prototype, "nodeID", void 0);
__decorate([
    (encodeAs.field(2, 2).string)
], ConsensusStatusRequest.prototype, "partition", void 0);
__decorate([
    (encodeAs.field(2, 3).bool)
], ConsensusStatusRequest.prototype, "includePeers", void 0);
__decorate([
    (encodeAs.field(2, 4).bool)
], ConsensusStatusRequest.prototype, "includeAccumulate", void 0);
export class ConsensusStatusResponse {
    constructor(args) {
        this.type = MessageType.ConsensusStatusResponse;
        this.value =
            args.value == undefined
                ? undefined
                : args.value instanceof api.ConsensusStatus
                    ? args.value
                    : new api.ConsensusStatus(args.value);
    }
    copy() {
        return new ConsensusStatusResponse(this.asObject());
    }
    asObject() {
        return {
            type: "consensusStatusResponse",
            value: this.value === undefined ? undefined : this.value.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], ConsensusStatusResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).reference)
], ConsensusStatusResponse.prototype, "value", void 0);
export class ErrorResponse {
    constructor(args) {
        this.type = MessageType.ErrorResponse;
        this.error =
            args.error == undefined
                ? undefined
                : args.error instanceof errors2.Error
                    ? args.error
                    : new errors2.Error(args.error);
    }
    copy() {
        return new ErrorResponse(this.asObject());
    }
    asObject() {
        return {
            type: "errorResponse",
            error: this.error === undefined ? undefined : this.error.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], ErrorResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).reference)
], ErrorResponse.prototype, "error", void 0);
export class EventMessage {
    constructor(args) {
        this.type = MessageType.Event;
        this.value =
            args.value == undefined
                ? undefined
                : args.value.map((v) => (v == undefined ? undefined : api.Event.fromObject(v)));
    }
    copy() {
        return new EventMessage(this.asObject());
    }
    asObject() {
        return {
            type: "event",
            value: this.value === undefined
                ? undefined
                : this.value?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], EventMessage.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).repeatable.keepEmpty.union)
], EventMessage.prototype, "value", void 0);
export class FaucetRequest {
    constructor(args) {
        this.type = MessageType.FaucetRequest;
        this.account = args.account == undefined ? undefined : URL.parse(args.account);
        this.token = args.token == undefined ? undefined : URL.parse(args.token);
    }
    copy() {
        return new FaucetRequest(this.asObject());
    }
    asObject() {
        return {
            type: "faucetRequest",
            account: this.account === undefined ? undefined : this.account.toString(),
            token: this.token === undefined ? undefined : this.token.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], FaucetRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).url)
], FaucetRequest.prototype, "account", void 0);
__decorate([
    (encodeAs.field(3, 1).url)
], FaucetRequest.prototype, "token", void 0);
export class FaucetResponse {
    constructor(args) {
        this.type = MessageType.FaucetResponse;
        this.value =
            args.value == undefined
                ? undefined
                : args.value instanceof api.Submission
                    ? args.value
                    : new api.Submission(args.value);
    }
    copy() {
        return new FaucetResponse(this.asObject());
    }
    asObject() {
        return {
            type: "faucetResponse",
            value: this.value === undefined ? undefined : this.value.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], FaucetResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).reference)
], FaucetResponse.prototype, "value", void 0);
export class FindServiceRequest {
    constructor(args) {
        this.type = MessageType.FindServiceRequest;
        this.network = args.network == undefined ? undefined : args.network;
        this.service =
            args.service == undefined
                ? undefined
                : args.service instanceof api.ServiceAddress
                    ? args.service
                    : new api.ServiceAddress(args.service);
        this.known = args.known == undefined ? undefined : args.known;
        this.timeout = args.timeout == undefined ? undefined : args.timeout;
    }
    copy() {
        return new FindServiceRequest(this.asObject());
    }
    asObject() {
        return {
            type: "findServiceRequest",
            network: this.network === undefined ? undefined : this.network,
            service: this.service === undefined ? undefined : this.service.asObject(),
            known: this.known === undefined ? undefined : this.known,
            timeout: this.timeout === undefined ? undefined : this.timeout,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], FindServiceRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2, 1).string)
], FindServiceRequest.prototype, "network", void 0);
__decorate([
    (encodeAs.field(2, 2).reference)
], FindServiceRequest.prototype, "service", void 0);
__decorate([
    (encodeAs.field(2, 3).bool)
], FindServiceRequest.prototype, "known", void 0);
__decorate([
    (encodeAs.field(2, 4).duration)
], FindServiceRequest.prototype, "timeout", void 0);
export class FindServiceResponse {
    constructor(args) {
        this.type = MessageType.FindServiceResponse;
        this.value =
            args.value == undefined
                ? undefined
                : args.value.map((v) => v == undefined
                    ? undefined
                    : v instanceof api.FindServiceResult
                        ? v
                        : new api.FindServiceResult(v));
    }
    copy() {
        return new FindServiceResponse(this.asObject());
    }
    asObject() {
        return {
            type: "findServiceResponse",
            value: this.value === undefined
                ? undefined
                : this.value?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], FindServiceResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).repeatable.keepEmpty.reference)
], FindServiceResponse.prototype, "value", void 0);
export class NetworkStatusRequest {
    constructor(args) {
        this.type = MessageType.NetworkStatusRequest;
        this.partition = args.partition == undefined ? undefined : args.partition;
    }
    copy() {
        return new NetworkStatusRequest(this.asObject());
    }
    asObject() {
        return {
            type: "networkStatusRequest",
            partition: this.partition === undefined ? undefined : this.partition,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], NetworkStatusRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2, 1).string)
], NetworkStatusRequest.prototype, "partition", void 0);
export class NetworkStatusResponse {
    constructor(args) {
        this.type = MessageType.NetworkStatusResponse;
        this.value =
            args.value == undefined
                ? undefined
                : args.value instanceof api.NetworkStatus
                    ? args.value
                    : new api.NetworkStatus(args.value);
    }
    copy() {
        return new NetworkStatusResponse(this.asObject());
    }
    asObject() {
        return {
            type: "networkStatusResponse",
            value: this.value === undefined ? undefined : this.value.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], NetworkStatusResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).reference)
], NetworkStatusResponse.prototype, "value", void 0);
export class NodeInfoRequest {
    constructor(args) {
        this.type = MessageType.NodeInfoRequest;
        this.peerID = args.peerID == undefined ? undefined : p2p.PeerID.fromObject(args.peerID);
    }
    copy() {
        return new NodeInfoRequest(this.asObject());
    }
    asObject() {
        return {
            type: "nodeInfoRequest",
            peerID: this.peerID === undefined ? undefined : this.peerID.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], NodeInfoRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2, 1).union)
], NodeInfoRequest.prototype, "peerID", void 0);
export class NodeInfoResponse {
    constructor(args) {
        this.type = MessageType.NodeInfoResponse;
        this.value =
            args.value == undefined
                ? undefined
                : args.value instanceof api.NodeInfo
                    ? args.value
                    : new api.NodeInfo(args.value);
    }
    copy() {
        return new NodeInfoResponse(this.asObject());
    }
    asObject() {
        return {
            type: "nodeInfoResponse",
            value: this.value === undefined ? undefined : this.value.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], NodeInfoResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).reference)
], NodeInfoResponse.prototype, "value", void 0);
export class PrivateSequenceRequest {
    constructor(args) {
        this.type = MessageType.PrivateSequenceRequest;
        this.source = args.source == undefined ? undefined : URL.parse(args.source);
        this.destination = args.destination == undefined ? undefined : URL.parse(args.destination);
        this.sequenceNumber = args.sequenceNumber == undefined ? undefined : args.sequenceNumber;
        this.nodeID = args.nodeID == undefined ? undefined : p2p.PeerID.fromObject(args.nodeID);
    }
    copy() {
        return new PrivateSequenceRequest(this.asObject());
    }
    asObject() {
        return {
            type: "privateSequenceRequest",
            source: this.source === undefined ? undefined : this.source.toString(),
            destination: this.destination === undefined ? undefined : this.destination.toString(),
            sequenceNumber: this.sequenceNumber === undefined ? undefined : this.sequenceNumber,
            nodeID: this.nodeID === undefined ? undefined : this.nodeID.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], PrivateSequenceRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).url)
], PrivateSequenceRequest.prototype, "source", void 0);
__decorate([
    (encodeAs.field(3).url)
], PrivateSequenceRequest.prototype, "destination", void 0);
__decorate([
    (encodeAs.field(4).uint)
], PrivateSequenceRequest.prototype, "sequenceNumber", void 0);
__decorate([
    (encodeAs.field(5, 1).union)
], PrivateSequenceRequest.prototype, "nodeID", void 0);
export class PrivateSequenceResponse {
    constructor(args) {
        this.type = MessageType.PrivateSequenceResponse;
        this.value =
            args.value == undefined
                ? undefined
                : args.value instanceof (api.MessageRecord)
                    ? args.value
                    : new api.MessageRecord(args.value);
    }
    copy() {
        return new PrivateSequenceResponse(this.asObject());
    }
    asObject() {
        return {
            type: "privateSequenceResponse",
            value: this.value === undefined ? undefined : this.value.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], PrivateSequenceResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).reference)
], PrivateSequenceResponse.prototype, "value", void 0);
export class QueryRequest {
    constructor(args) {
        this.type = MessageType.QueryRequest;
        this.scope = args.scope == undefined ? undefined : URL.parse(args.scope);
        this.query = args.query == undefined ? undefined : api.Query.fromObject(args.query);
    }
    copy() {
        return new QueryRequest(this.asObject());
    }
    asObject() {
        return {
            type: "queryRequest",
            scope: this.scope === undefined ? undefined : this.scope.toString(),
            query: this.query === undefined ? undefined : this.query.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], QueryRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).url)
], QueryRequest.prototype, "scope", void 0);
__decorate([
    (encodeAs.field(3).union)
], QueryRequest.prototype, "query", void 0);
export class RecordResponse {
    constructor(args) {
        this.type = MessageType.RecordResponse;
        this.value = args.value == undefined ? undefined : api.Record.fromObject(args.value);
    }
    copy() {
        return new RecordResponse(this.asObject());
    }
    asObject() {
        return {
            type: "recordResponse",
            value: this.value === undefined ? undefined : this.value.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], RecordResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).union)
], RecordResponse.prototype, "value", void 0);
export class SubmitRequest {
    constructor(args) {
        this.type = MessageType.SubmitRequest;
        this.envelope =
            args.envelope == undefined
                ? undefined
                : args.envelope instanceof messaging.Envelope
                    ? args.envelope
                    : new messaging.Envelope(args.envelope);
        this.verify = args.verify == undefined ? undefined : args.verify;
        this.wait = args.wait == undefined ? undefined : args.wait;
    }
    copy() {
        return new SubmitRequest(this.asObject());
    }
    asObject() {
        return {
            type: "submitRequest",
            envelope: this.envelope === undefined ? undefined : this.envelope.asObject(),
            verify: this.verify === undefined ? undefined : this.verify,
            wait: this.wait === undefined ? undefined : this.wait,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], SubmitRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).reference)
], SubmitRequest.prototype, "envelope", void 0);
__decorate([
    (encodeAs.field(3, 1).bool)
], SubmitRequest.prototype, "verify", void 0);
__decorate([
    (encodeAs.field(3, 2).bool)
], SubmitRequest.prototype, "wait", void 0);
export class SubmitResponse {
    constructor(args) {
        this.type = MessageType.SubmitResponse;
        this.value =
            args.value == undefined
                ? undefined
                : args.value.map((v) => v == undefined ? undefined : v instanceof api.Submission ? v : new api.Submission(v));
    }
    copy() {
        return new SubmitResponse(this.asObject());
    }
    asObject() {
        return {
            type: "submitResponse",
            value: this.value === undefined
                ? undefined
                : this.value?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], SubmitResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).repeatable.keepEmpty.reference)
], SubmitResponse.prototype, "value", void 0);
export class SubscribeRequest {
    constructor(args) {
        this.type = MessageType.SubscribeRequest;
        this.partition = args.partition == undefined ? undefined : args.partition;
        this.account = args.account == undefined ? undefined : URL.parse(args.account);
    }
    copy() {
        return new SubscribeRequest(this.asObject());
    }
    asObject() {
        return {
            type: "subscribeRequest",
            partition: this.partition === undefined ? undefined : this.partition,
            account: this.account === undefined ? undefined : this.account.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], SubscribeRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2, 1).string)
], SubscribeRequest.prototype, "partition", void 0);
__decorate([
    (encodeAs.field(2, 2).url)
], SubscribeRequest.prototype, "account", void 0);
export class SubscribeResponse {
    constructor(_) {
        this.type = MessageType.SubscribeResponse;
    }
    copy() {
        return new SubscribeResponse(this.asObject());
    }
    asObject() {
        return {
            type: "subscribeResponse",
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], SubscribeResponse.prototype, "type", void 0);
export class ValidateRequest {
    constructor(args) {
        this.type = MessageType.ValidateRequest;
        this.envelope =
            args.envelope == undefined
                ? undefined
                : args.envelope instanceof messaging.Envelope
                    ? args.envelope
                    : new messaging.Envelope(args.envelope);
        this.full = args.full == undefined ? undefined : args.full;
    }
    copy() {
        return new ValidateRequest(this.asObject());
    }
    asObject() {
        return {
            type: "validateRequest",
            envelope: this.envelope === undefined ? undefined : this.envelope.asObject(),
            full: this.full === undefined ? undefined : this.full,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], ValidateRequest.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).reference)
], ValidateRequest.prototype, "envelope", void 0);
__decorate([
    (encodeAs.field(3, 1).bool)
], ValidateRequest.prototype, "full", void 0);
export class ValidateResponse {
    constructor(args) {
        this.type = MessageType.ValidateResponse;
        this.value =
            args.value == undefined
                ? undefined
                : args.value.map((v) => v == undefined ? undefined : v instanceof api.Submission ? v : new api.Submission(v));
    }
    copy() {
        return new ValidateResponse(this.asObject());
    }
    asObject() {
        return {
            type: "validateResponse",
            value: this.value === undefined
                ? undefined
                : this.value?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(MessageType))
], ValidateResponse.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).repeatable.keepEmpty.reference)
], ValidateResponse.prototype, "value", void 0);
//# sourceMappingURL=msg_types_gen.js.map