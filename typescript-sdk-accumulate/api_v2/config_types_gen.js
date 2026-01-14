var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { encodeAs } from "../encoding/index.js";
import { NodeType } from "./config.js";
import * as protocol from "./protocol.js";
export class Describe {
    constructor(args) {
        this.networkType =
            args.networkType == undefined
                ? undefined
                : protocol.PartitionType.fromObject(args.networkType);
        this.partitionId = args.partitionId == undefined ? undefined : args.partitionId;
        this.network =
            args.network == undefined
                ? undefined
                : args.network instanceof Network
                    ? args.network
                    : new Network(args.network);
    }
    copy() {
        return new Describe(this.asObject());
    }
    asObject() {
        return {
            networkType: this.networkType === undefined
                ? undefined
                : protocol.PartitionType.getName(this.networkType),
            partitionId: this.partitionId === undefined ? undefined : this.partitionId,
            network: this.network === undefined ? undefined : this.network.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).enum)
], Describe.prototype, "networkType", void 0);
__decorate([
    (encodeAs.field(2).string)
], Describe.prototype, "partitionId", void 0);
__decorate([
    (encodeAs.field(3).reference)
], Describe.prototype, "network", void 0);
export class Network {
    constructor(args) {
        this.id = args.id == undefined ? undefined : args.id;
    }
    copy() {
        return new Network(this.asObject());
    }
    asObject() {
        return {
            id: this.id === undefined ? undefined : this.id,
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], Network.prototype, "id", void 0);
export class Node {
    constructor(args) {
        this.address = args.address == undefined ? undefined : args.address;
        this.type = args.type == undefined ? undefined : NodeType.fromObject(args.type);
    }
    copy() {
        return new Node(this.asObject());
    }
    asObject() {
        return {
            address: this.address === undefined ? undefined : this.address,
            type: this.type === undefined ? undefined : NodeType.getName(this.type),
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], Node.prototype, "address", void 0);
__decorate([
    (encodeAs.field(2).enum)
], Node.prototype, "type", void 0);
export class Partition {
    constructor(args) {
        this.id = args.id == undefined ? undefined : args.id;
        this.type = args.type == undefined ? undefined : protocol.PartitionType.fromObject(args.type);
        this.basePort = args.basePort == undefined ? undefined : args.basePort;
        this.nodes =
            args.nodes == undefined
                ? undefined
                : args.nodes.map((v) => (v == undefined ? undefined : v instanceof Node ? v : new Node(v)));
    }
    copy() {
        return new Partition(this.asObject());
    }
    asObject() {
        return {
            id: this.id === undefined ? undefined : this.id,
            type: this.type === undefined ? undefined : protocol.PartitionType.getName(this.type),
            basePort: this.basePort === undefined ? undefined : this.basePort,
            nodes: this.nodes === undefined
                ? undefined
                : this.nodes?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], Partition.prototype, "id", void 0);
__decorate([
    (encodeAs.field(2).enum)
], Partition.prototype, "type", void 0);
__decorate([
    (encodeAs.field(3).int)
], Partition.prototype, "basePort", void 0);
__decorate([
    (encodeAs.field(4).repeatable.reference)
], Partition.prototype, "nodes", void 0);
//# sourceMappingURL=config_types_gen.js.map