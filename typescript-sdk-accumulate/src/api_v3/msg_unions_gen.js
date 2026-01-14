import * as types from "./msg.js";
/** @ignore */
export var Message;
(function (Message) {
    function fromObject(obj) {
        if (obj instanceof types.ConsensusStatusRequest)
            return obj;
        if (obj instanceof types.ConsensusStatusResponse)
            return obj;
        if (obj instanceof types.ErrorResponse)
            return obj;
        if (obj instanceof types.EventMessage)
            return obj;
        if (obj instanceof types.FaucetRequest)
            return obj;
        if (obj instanceof types.FaucetResponse)
            return obj;
        if (obj instanceof types.FindServiceRequest)
            return obj;
        if (obj instanceof types.FindServiceResponse)
            return obj;
        if (obj instanceof types.NetworkStatusRequest)
            return obj;
        if (obj instanceof types.NetworkStatusResponse)
            return obj;
        if (obj instanceof types.NodeInfoRequest)
            return obj;
        if (obj instanceof types.NodeInfoResponse)
            return obj;
        if (obj instanceof types.PrivateSequenceRequest)
            return obj;
        if (obj instanceof types.PrivateSequenceResponse)
            return obj;
        if (obj instanceof types.QueryRequest)
            return obj;
        if (obj instanceof types.RecordResponse)
            return obj;
        if (obj instanceof types.SubmitRequest)
            return obj;
        if (obj instanceof types.SubmitResponse)
            return obj;
        if (obj instanceof types.SubscribeRequest)
            return obj;
        if (obj instanceof types.SubscribeResponse)
            return obj;
        if (obj instanceof types.ValidateRequest)
            return obj;
        if (obj instanceof types.ValidateResponse)
            return obj;
        switch (obj.type) {
            case types.MessageType.ConsensusStatusRequest:
            case "consensusStatusRequest":
                return new types.ConsensusStatusRequest(obj);
            case types.MessageType.ConsensusStatusResponse:
            case "consensusStatusResponse":
                return new types.ConsensusStatusResponse(obj);
            case types.MessageType.ErrorResponse:
            case "errorResponse":
                return new types.ErrorResponse(obj);
            case types.MessageType.Event:
            case "event":
                return new types.EventMessage(obj);
            case types.MessageType.FaucetRequest:
            case "faucetRequest":
                return new types.FaucetRequest(obj);
            case types.MessageType.FaucetResponse:
            case "faucetResponse":
                return new types.FaucetResponse(obj);
            case types.MessageType.FindServiceRequest:
            case "findServiceRequest":
                return new types.FindServiceRequest(obj);
            case types.MessageType.FindServiceResponse:
            case "findServiceResponse":
                return new types.FindServiceResponse(obj);
            case types.MessageType.NetworkStatusRequest:
            case "networkStatusRequest":
                return new types.NetworkStatusRequest(obj);
            case types.MessageType.NetworkStatusResponse:
            case "networkStatusResponse":
                return new types.NetworkStatusResponse(obj);
            case types.MessageType.NodeInfoRequest:
            case "nodeInfoRequest":
                return new types.NodeInfoRequest(obj);
            case types.MessageType.NodeInfoResponse:
            case "nodeInfoResponse":
                return new types.NodeInfoResponse(obj);
            case types.MessageType.PrivateSequenceRequest:
            case "privateSequenceRequest":
                return new types.PrivateSequenceRequest(obj);
            case types.MessageType.PrivateSequenceResponse:
            case "privateSequenceResponse":
                return new types.PrivateSequenceResponse(obj);
            case types.MessageType.QueryRequest:
            case "queryRequest":
                return new types.QueryRequest(obj);
            case types.MessageType.RecordResponse:
            case "recordResponse":
                return new types.RecordResponse(obj);
            case types.MessageType.SubmitRequest:
            case "submitRequest":
                return new types.SubmitRequest(obj);
            case types.MessageType.SubmitResponse:
            case "submitResponse":
                return new types.SubmitResponse(obj);
            case types.MessageType.SubscribeRequest:
            case "subscribeRequest":
                return new types.SubscribeRequest(obj);
            case types.MessageType.SubscribeResponse:
            case "subscribeResponse":
                return new types.SubscribeResponse(obj);
            case types.MessageType.ValidateRequest:
            case "validateRequest":
                return new types.ValidateRequest(obj);
            case types.MessageType.ValidateResponse:
            case "validateResponse":
                return new types.ValidateResponse(obj);
            default:
                throw new Error(`Unknown message '${obj.type}'`);
        }
    }
    Message.fromObject = fromObject;
})(Message || (Message = {}));
//# sourceMappingURL=msg_unions_gen.js.map