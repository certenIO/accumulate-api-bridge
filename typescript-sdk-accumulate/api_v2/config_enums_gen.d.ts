export declare enum NodeType {
    /** Validator . */
    Validator = 1,
    /** Follower . */
    Follower = 2
}
export type NodeTypeArgs = NodeType | string;
/** @ignore */
export declare namespace NodeType {
    function fromObject(obj: NodeTypeArgs): NodeType;
    function byName(name: string): NodeType;
    function getName(v: NodeType): "validator" | "follower";
}
export declare enum PortOffset {
    /** TendermintP2P . */
    TendermintP2P = 0,
    /** TendermintRpc . */
    TendermintRpc = 1,
    /** AccumulateP2P . */
    AccumulateP2P = 2,
    /** Prometheus . */
    Prometheus = 3,
    /** AccumulateApi . */
    AccumulateApi = 4
}
export type PortOffsetArgs = PortOffset | string;
/** @ignore */
export declare namespace PortOffset {
    function fromObject(obj: PortOffsetArgs): PortOffset;
    function byName(name: string): PortOffset;
    function getName(v: PortOffset): "prometheus" | "tendermintP2P" | "tendermintRpc" | "accumulateP2P" | "accumulateApi";
}
