export declare enum Type {
    /** NodeInfoRequest . */
    NodeInfoRequest = 1,
    /** FindServiceRequest . */
    FindServiceRequest = 2,
    /** ConsensusStatusRequest . */
    ConsensusStatusRequest = 3,
    /** NetworkStatusRequest . */
    NetworkStatusRequest = 4,
    /** MetricsRequest . */
    MetricsRequest = 5,
    /** QueryRequest . */
    QueryRequest = 6,
    /** SubmitRequest . */
    SubmitRequest = 7,
    /** ValidateRequest . */
    ValidateRequest = 8,
    /** SubscribeRequest . */
    SubscribeRequest = 9,
    /** FaucetRequest . */
    FaucetRequest = 10,
    /** ErrorResponse . */
    ErrorResponse = 32,
    /** NodeInfoResponse . */
    NodeInfoResponse = 33,
    /** FindServiceResponse . */
    FindServiceResponse = 34,
    /** ConsensusStatusResponse . */
    ConsensusStatusResponse = 35,
    /** NetworkStatusResponse . */
    NetworkStatusResponse = 36,
    /** MetricsResponse . */
    MetricsResponse = 37,
    /** RecordResponse . */
    RecordResponse = 38,
    /** SubmitResponse . */
    SubmitResponse = 39,
    /** ValidateResponse . */
    ValidateResponse = 40,
    /** SubscribeResponse . */
    SubscribeResponse = 41,
    /** FaucetResponse . */
    FaucetResponse = 42,
    /** Event . */
    Event = 64,
    /** PrivateSequenceRequest . */
    PrivateSequenceRequest = 128,
    /** PrivateSequenceResponse . */
    PrivateSequenceResponse = 129,
    /** Addressed . */
    Addressed = 255
}
export type TypeArgs = Type | string;
/** @ignore */
export declare namespace Type {
    function fromObject(obj: TypeArgs): Type;
    function byName(name: string): Type;
    function getName(v: Type): "event" | "addressed" | "nodeInfoRequest" | "findServiceRequest" | "consensusStatusRequest" | "networkStatusRequest" | "metricsRequest" | "queryRequest" | "submitRequest" | "validateRequest" | "subscribeRequest" | "faucetRequest" | "errorResponse" | "nodeInfoResponse" | "findServiceResponse" | "consensusStatusResponse" | "networkStatusResponse" | "metricsResponse" | "recordResponse" | "submitResponse" | "validateResponse" | "subscribeResponse" | "faucetResponse" | "privateSequenceRequest" | "privateSequenceResponse";
}
