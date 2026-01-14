import { NodeType, NodeTypeArgs } from "./config.js";
import * as protocol from "./protocol.js";
export type DescribeArgs = {
    networkType?: protocol.PartitionTypeArgs;
    partitionId?: string;
    network?: Network | NetworkArgs;
};
export declare class Describe {
    networkType?: protocol.PartitionType;
    partitionId?: string;
    network?: Network;
    constructor(args: DescribeArgs);
    copy(): Describe;
    asObject(): DescribeArgs;
}
export type NetworkArgs = {
    id?: string;
};
export declare class Network {
    id?: string;
    constructor(args: NetworkArgs);
    copy(): Network;
    asObject(): NetworkArgs;
}
export type NodeArgs = {
    address?: string;
    type?: NodeTypeArgs;
};
export declare class Node {
    address?: string;
    type?: NodeType;
    constructor(args: NodeArgs);
    copy(): Node;
    asObject(): NodeArgs;
}
export type PartitionArgs = {
    id?: string;
    type?: protocol.PartitionTypeArgs;
    basePort?: number;
    nodes?: (Node | NodeArgs | undefined)[];
};
export declare class Partition {
    id?: string;
    type?: protocol.PartitionType;
    basePort?: number;
    nodes?: (Node | undefined)[];
    constructor(args: PartitionArgs);
    copy(): Partition;
    asObject(): PartitionArgs;
}
