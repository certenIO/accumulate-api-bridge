var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BlockFilterMode, TxFetchMode } from "./enums_gen.js";
import { AccumulateTxID as TxID } from "../address/txid.js";
import { AccumulateURL as URL } from "../address/url.js";
import { Buffer } from "../common/buffer.js";
import { encodeAs } from "../encoding/index.js";
import * as errors2 from "../errors/index.js";
import * as merkle from "../merkle/index.js";
import * as messaging from "../messaging/index.js";
import * as core from "../network/index.js";
import * as config from "./config.js";
import * as protocol from "./protocol.js";
export class ChainEntry {
    constructor(args) {
        this.height = args.height == undefined ? undefined : args.height;
        this.entry =
            args.entry == undefined
                ? undefined
                : args.entry instanceof Uint8Array
                    ? args.entry
                    : Buffer.from(args.entry, "hex");
        this.state =
            args.state == undefined
                ? undefined
                : args.state.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
        this.value = args.value == undefined ? undefined : args.value;
    }
    copy() {
        return new ChainEntry(this.asObject());
    }
    asObject() {
        return {
            height: this.height === undefined ? undefined : this.height,
            entry: this.entry === undefined
                ? undefined
                : this.entry && Buffer.from(this.entry).toString("hex"),
            state: this.state === undefined
                ? undefined
                : this.state?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
            value: this.value === undefined ? undefined : this.value,
        };
    }
}
export class ChainIdQuery {
    constructor(args) {
        this.chainId =
            args.chainId == undefined
                ? undefined
                : args.chainId instanceof Uint8Array
                    ? args.chainId
                    : Buffer.from(args.chainId, "hex");
    }
    copy() {
        return new ChainIdQuery(this.asObject());
    }
    asObject() {
        return {
            chainId: this.chainId === undefined
                ? undefined
                : this.chainId && Buffer.from(this.chainId).toString("hex"),
        };
    }
}
export class ChainQueryResponse {
    constructor(args) {
        this.type = args.type == undefined ? undefined : args.type;
        this.mainChain =
            args.mainChain == undefined
                ? undefined
                : args.mainChain instanceof MerkleState
                    ? args.mainChain
                    : new MerkleState(args.mainChain);
        this.chains =
            args.chains == undefined
                ? undefined
                : args.chains.map((v) => v == undefined ? undefined : v instanceof ChainState ? v : new ChainState(v));
        this.data = args.data == undefined ? undefined : args.data;
        this.chainId =
            args.chainId == undefined
                ? undefined
                : args.chainId instanceof Uint8Array
                    ? args.chainId
                    : Buffer.from(args.chainId, "hex");
        this.receipt =
            args.receipt == undefined
                ? undefined
                : args.receipt instanceof GeneralReceipt
                    ? args.receipt
                    : new GeneralReceipt(args.receipt);
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new ChainQueryResponse(this.asObject());
    }
    asObject() {
        return {
            type: this.type === undefined ? undefined : this.type,
            mainChain: this.mainChain === undefined ? undefined : this.mainChain.asObject(),
            chains: this.chains === undefined
                ? undefined
                : this.chains?.map((v) => (v == undefined ? undefined : v.asObject())),
            data: this.data === undefined ? undefined : this.data,
            chainId: this.chainId === undefined
                ? undefined
                : this.chainId && Buffer.from(this.chainId).toString("hex"),
            receipt: this.receipt === undefined ? undefined : this.receipt.asObject(),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
export class ChainState {
    constructor(args) {
        this.name = args.name == undefined ? undefined : args.name;
        this.type = args.type == undefined ? undefined : protocol.ChainType.fromObject(args.type);
        this.height = args.height == undefined ? undefined : args.height;
        this.roots =
            args.roots == undefined
                ? undefined
                : args.roots.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
    }
    copy() {
        return new ChainState(this.asObject());
    }
    asObject() {
        return {
            name: this.name === undefined ? undefined : this.name,
            type: this.type === undefined ? undefined : protocol.ChainType.getName(this.type),
            height: this.height === undefined ? undefined : this.height,
            roots: this.roots === undefined
                ? undefined
                : this.roots?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], ChainState.prototype, "name", void 0);
__decorate([
    (encodeAs.field(2).enum)
], ChainState.prototype, "type", void 0);
__decorate([
    (encodeAs.field(3).uint)
], ChainState.prototype, "height", void 0);
__decorate([
    (encodeAs.field(4).repeatable.bytes)
], ChainState.prototype, "roots", void 0);
export class DataEntryQuery {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.entryHash =
            args.entryHash == undefined
                ? undefined
                : args.entryHash instanceof Uint8Array
                    ? args.entryHash
                    : Buffer.from(args.entryHash, "hex");
    }
    copy() {
        return new DataEntryQuery(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
            entryHash: this.entryHash === undefined
                ? undefined
                : this.entryHash && Buffer.from(this.entryHash).toString("hex"),
        };
    }
}
__decorate([
    (encodeAs.field(1).url)
], DataEntryQuery.prototype, "url", void 0);
__decorate([
    (encodeAs.field(2).hash)
], DataEntryQuery.prototype, "entryHash", void 0);
export class DataEntryQueryResponse {
    constructor(args) {
        this.entryHash =
            args.entryHash == undefined
                ? undefined
                : args.entryHash instanceof Uint8Array
                    ? args.entryHash
                    : Buffer.from(args.entryHash, "hex");
        this.entry = args.entry == undefined ? undefined : protocol.DataEntry.fromObject(args.entry);
        this.txId = args.txId == undefined ? undefined : TxID.parse(args.txId);
        this.causeTxId = args.causeTxId == undefined ? undefined : TxID.parse(args.causeTxId);
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new DataEntryQueryResponse(this.asObject());
    }
    asObject() {
        return {
            entryHash: this.entryHash === undefined
                ? undefined
                : this.entryHash && Buffer.from(this.entryHash).toString("hex"),
            entry: this.entry === undefined ? undefined : this.entry.asObject(),
            txId: this.txId === undefined ? undefined : this.txId.toString(),
            causeTxId: this.causeTxId === undefined ? undefined : this.causeTxId.toString(),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).hash)
], DataEntryQueryResponse.prototype, "entryHash", void 0);
__decorate([
    (encodeAs.field(2).union)
], DataEntryQueryResponse.prototype, "entry", void 0);
__decorate([
    (encodeAs.field(3).txid)
], DataEntryQueryResponse.prototype, "txId", void 0);
__decorate([
    (encodeAs.field(4).txid)
], DataEntryQueryResponse.prototype, "causeTxId", void 0);
__decorate([
    (encodeAs.field(5).time)
], DataEntryQueryResponse.prototype, "lastBlockTime", void 0);
export class DataEntrySetQuery {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.start = args.start == undefined ? undefined : args.start;
        this.count = args.count == undefined ? undefined : args.count;
        this.expand = args.expand == undefined ? undefined : args.expand;
        this.height = args.height == undefined ? undefined : args.height;
        this.scratch = args.scratch == undefined ? undefined : args.scratch;
        this.prove = args.prove == undefined ? undefined : args.prove;
        this.includeRemote = args.includeRemote == undefined ? undefined : args.includeRemote;
    }
    copy() {
        return new DataEntrySetQuery(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
            start: this.start === undefined ? undefined : this.start,
            count: this.count === undefined ? undefined : this.count,
            expand: this.expand === undefined ? undefined : this.expand,
            height: this.height === undefined ? undefined : this.height,
            scratch: this.scratch === undefined ? undefined : this.scratch,
            prove: this.prove === undefined ? undefined : this.prove,
            includeRemote: this.includeRemote === undefined ? undefined : this.includeRemote,
        };
    }
}
export class DescriptionResponse {
    constructor(args) {
        this.partitionId = args.partitionId == undefined ? undefined : args.partitionId;
        this.networkType =
            args.networkType == undefined
                ? undefined
                : protocol.PartitionType.fromObject(args.networkType);
        this.network =
            args.network == undefined
                ? undefined
                : args.network instanceof NetworkDescription
                    ? args.network
                    : new NetworkDescription(args.network);
        this.networkAnchor =
            args.networkAnchor == undefined
                ? undefined
                : args.networkAnchor instanceof Uint8Array
                    ? args.networkAnchor
                    : Buffer.from(args.networkAnchor, "hex");
        this.values =
            args.values == undefined
                ? undefined
                : args.values instanceof core.GlobalValues
                    ? args.values
                    : new core.GlobalValues(args.values);
        this.error =
            args.error == undefined
                ? undefined
                : args.error instanceof errors2.Error
                    ? args.error
                    : new errors2.Error(args.error);
    }
    copy() {
        return new DescriptionResponse(this.asObject());
    }
    asObject() {
        return {
            partitionId: this.partitionId === undefined ? undefined : this.partitionId,
            networkType: this.networkType === undefined
                ? undefined
                : protocol.PartitionType.getName(this.networkType),
            network: this.network === undefined ? undefined : this.network.asObject(),
            networkAnchor: this.networkAnchor === undefined
                ? undefined
                : this.networkAnchor && Buffer.from(this.networkAnchor).toString("hex"),
            values: this.values === undefined ? undefined : this.values.asObject(),
            error: this.error === undefined ? undefined : this.error.asObject(),
        };
    }
}
export class DirectoryQuery {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.start = args.start == undefined ? undefined : args.start;
        this.count = args.count == undefined ? undefined : args.count;
        this.expand = args.expand == undefined ? undefined : args.expand;
        this.height = args.height == undefined ? undefined : args.height;
        this.scratch = args.scratch == undefined ? undefined : args.scratch;
        this.prove = args.prove == undefined ? undefined : args.prove;
        this.includeRemote = args.includeRemote == undefined ? undefined : args.includeRemote;
    }
    copy() {
        return new DirectoryQuery(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
            start: this.start === undefined ? undefined : this.start,
            count: this.count === undefined ? undefined : this.count,
            expand: this.expand === undefined ? undefined : this.expand,
            height: this.height === undefined ? undefined : this.height,
            scratch: this.scratch === undefined ? undefined : this.scratch,
            prove: this.prove === undefined ? undefined : this.prove,
            includeRemote: this.includeRemote === undefined ? undefined : this.includeRemote,
        };
    }
}
export class ExecuteRequest {
    constructor(args) {
        this.envelope =
            args.envelope == undefined
                ? undefined
                : args.envelope instanceof messaging.Envelope
                    ? args.envelope
                    : new messaging.Envelope(args.envelope);
        this.checkOnly = args.checkOnly == undefined ? undefined : args.checkOnly;
    }
    copy() {
        return new ExecuteRequest(this.asObject());
    }
    asObject() {
        return {
            envelope: this.envelope === undefined ? undefined : this.envelope.asObject(),
            checkOnly: this.checkOnly === undefined ? undefined : this.checkOnly,
        };
    }
}
export class GeneralQuery {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.expand = args.expand == undefined ? undefined : args.expand;
        this.height = args.height == undefined ? undefined : args.height;
        this.scratch = args.scratch == undefined ? undefined : args.scratch;
        this.prove = args.prove == undefined ? undefined : args.prove;
        this.includeRemote = args.includeRemote == undefined ? undefined : args.includeRemote;
    }
    copy() {
        return new GeneralQuery(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
            expand: this.expand === undefined ? undefined : this.expand,
            height: this.height === undefined ? undefined : this.height,
            scratch: this.scratch === undefined ? undefined : this.scratch,
            prove: this.prove === undefined ? undefined : this.prove,
            includeRemote: this.includeRemote === undefined ? undefined : this.includeRemote,
        };
    }
}
export class GeneralReceipt {
    constructor(args) {
        this.localBlock = args.localBlock == undefined ? undefined : args.localBlock;
        this.localBlockTime =
            args.localBlockTime == undefined
                ? undefined
                : args.localBlockTime instanceof Date
                    ? args.localBlockTime
                    : new Date(args.localBlockTime);
        this.directoryBlock = args.directoryBlock == undefined ? undefined : args.directoryBlock;
        this.majorBlock = args.majorBlock == undefined ? undefined : args.majorBlock;
        this.proof =
            args.proof == undefined
                ? undefined
                : args.proof instanceof merkle.Receipt
                    ? args.proof
                    : new merkle.Receipt(args.proof);
        this.error = args.error == undefined ? undefined : args.error;
    }
    copy() {
        return new GeneralReceipt(this.asObject());
    }
    asObject() {
        return {
            localBlock: this.localBlock === undefined ? undefined : this.localBlock,
            localBlockTime: this.localBlockTime === undefined ? undefined : this.localBlockTime,
            directoryBlock: this.directoryBlock === undefined ? undefined : this.directoryBlock,
            majorBlock: this.majorBlock === undefined ? undefined : this.majorBlock,
            proof: this.proof === undefined ? undefined : this.proof.asObject(),
            error: this.error === undefined ? undefined : this.error,
        };
    }
}
__decorate([
    (encodeAs.field(1).uint)
], GeneralReceipt.prototype, "localBlock", void 0);
__decorate([
    (encodeAs.field(2).time)
], GeneralReceipt.prototype, "localBlockTime", void 0);
__decorate([
    (encodeAs.field(3).uint)
], GeneralReceipt.prototype, "directoryBlock", void 0);
__decorate([
    (encodeAs.field(4).uint)
], GeneralReceipt.prototype, "majorBlock", void 0);
__decorate([
    (encodeAs.field(5).reference)
], GeneralReceipt.prototype, "proof", void 0);
__decorate([
    (encodeAs.field(6).string)
], GeneralReceipt.prototype, "error", void 0);
export class KeyPage {
    constructor(args) {
        this.version = args.version == undefined ? undefined : args.version;
    }
    copy() {
        return new KeyPage(this.asObject());
    }
    asObject() {
        return {
            version: this.version === undefined ? undefined : this.version,
        };
    }
}
export class KeyPageIndexQuery {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.key =
            args.key == undefined
                ? undefined
                : args.key instanceof Uint8Array
                    ? args.key
                    : Buffer.from(args.key, "hex");
    }
    copy() {
        return new KeyPageIndexQuery(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
            key: this.key === undefined ? undefined : this.key && Buffer.from(this.key).toString("hex"),
        };
    }
}
export class MajorBlocksQuery {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.start = args.start == undefined ? undefined : args.start;
        this.count = args.count == undefined ? undefined : args.count;
    }
    copy() {
        return new MajorBlocksQuery(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
            start: this.start === undefined ? undefined : this.start,
            count: this.count === undefined ? undefined : this.count,
        };
    }
}
export class MajorQueryResponse {
    constructor(args) {
        this.majorBlockIndex = args.majorBlockIndex == undefined ? undefined : args.majorBlockIndex;
        this.majorBlockTime =
            args.majorBlockTime == undefined
                ? undefined
                : args.majorBlockTime instanceof Date
                    ? args.majorBlockTime
                    : new Date(args.majorBlockTime);
        this.minorBlocks =
            args.minorBlocks == undefined
                ? undefined
                : args.minorBlocks.map((v) => v == undefined ? undefined : v instanceof MinorBlock ? v : new MinorBlock(v));
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new MajorQueryResponse(this.asObject());
    }
    asObject() {
        return {
            majorBlockIndex: this.majorBlockIndex === undefined ? undefined : this.majorBlockIndex,
            majorBlockTime: this.majorBlockTime === undefined ? undefined : this.majorBlockTime,
            minorBlocks: this.minorBlocks === undefined
                ? undefined
                : this.minorBlocks?.map((v) => (v == undefined ? undefined : v.asObject())),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
export class MerkleState {
    constructor(args) {
        this.height = args.height == undefined ? undefined : args.height;
        this.roots =
            args.roots == undefined
                ? undefined
                : args.roots.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
    }
    copy() {
        return new MerkleState(this.asObject());
    }
    asObject() {
        return {
            height: this.height === undefined ? undefined : this.height,
            roots: this.roots === undefined
                ? undefined
                : this.roots?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
        };
    }
}
export class MetricsQuery {
    constructor(args) {
        this.metric = args.metric == undefined ? undefined : args.metric;
        this.duration = args.duration == undefined ? undefined : args.duration;
    }
    copy() {
        return new MetricsQuery(this.asObject());
    }
    asObject() {
        return {
            metric: this.metric === undefined ? undefined : this.metric,
            duration: this.duration === undefined ? undefined : this.duration,
        };
    }
}
export class MetricsResponse {
    constructor(args) {
        this.value = args.value == undefined ? undefined : args.value;
    }
    copy() {
        return new MetricsResponse(this.asObject());
    }
    asObject() {
        return {
            value: this.value === undefined ? undefined : this.value,
        };
    }
}
export class MinorBlock {
    constructor(args) {
        this.blockIndex = args.blockIndex == undefined ? undefined : args.blockIndex;
        this.blockTime =
            args.blockTime == undefined
                ? undefined
                : args.blockTime instanceof Date
                    ? args.blockTime
                    : new Date(args.blockTime);
    }
    copy() {
        return new MinorBlock(this.asObject());
    }
    asObject() {
        return {
            blockIndex: this.blockIndex === undefined ? undefined : this.blockIndex,
            blockTime: this.blockTime === undefined ? undefined : this.blockTime,
        };
    }
}
export class MinorBlocksQuery {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.start = args.start == undefined ? undefined : args.start;
        this.count = args.count == undefined ? undefined : args.count;
        this.txFetchMode =
            args.txFetchMode == undefined ? undefined : TxFetchMode.fromObject(args.txFetchMode);
        this.blockFilterMode =
            args.blockFilterMode == undefined
                ? undefined
                : BlockFilterMode.fromObject(args.blockFilterMode);
    }
    copy() {
        return new MinorBlocksQuery(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
            start: this.start === undefined ? undefined : this.start,
            count: this.count === undefined ? undefined : this.count,
            txFetchMode: this.txFetchMode === undefined ? undefined : TxFetchMode.getName(this.txFetchMode),
            blockFilterMode: this.blockFilterMode === undefined
                ? undefined
                : BlockFilterMode.getName(this.blockFilterMode),
        };
    }
}
export class MinorQueryResponse {
    constructor(args) {
        this.blockIndex = args.blockIndex == undefined ? undefined : args.blockIndex;
        this.blockTime =
            args.blockTime == undefined
                ? undefined
                : args.blockTime instanceof Date
                    ? args.blockTime
                    : new Date(args.blockTime);
        this.txCount = args.txCount == undefined ? undefined : args.txCount;
        this.txIds =
            args.txIds == undefined
                ? undefined
                : args.txIds.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
        this.transactions =
            args.transactions == undefined
                ? undefined
                : args.transactions.map((v) => v == undefined
                    ? undefined
                    : v instanceof TransactionQueryResponse
                        ? v
                        : new TransactionQueryResponse(v));
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new MinorQueryResponse(this.asObject());
    }
    asObject() {
        return {
            blockIndex: this.blockIndex === undefined ? undefined : this.blockIndex,
            blockTime: this.blockTime === undefined ? undefined : this.blockTime,
            txCount: this.txCount === undefined ? undefined : this.txCount,
            txIds: this.txIds === undefined
                ? undefined
                : this.txIds?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
            transactions: this.transactions === undefined
                ? undefined
                : this.transactions?.map((v) => (v == undefined ? undefined : v.asObject())),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
export class MultiResponse {
    constructor(args) {
        this.type = args.type == undefined ? undefined : args.type;
        this.items =
            args.items == undefined ? undefined : args.items.map((v) => (v == undefined ? undefined : v));
        this.start = args.start == undefined ? undefined : args.start;
        this.count = args.count == undefined ? undefined : args.count;
        this.total = args.total == undefined ? undefined : args.total;
        this.otherItems =
            args.otherItems == undefined
                ? undefined
                : args.otherItems.map((v) => (v == undefined ? undefined : v));
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new MultiResponse(this.asObject());
    }
    asObject() {
        return {
            type: this.type === undefined ? undefined : this.type,
            items: this.items === undefined
                ? undefined
                : this.items?.map((v) => (v == undefined ? undefined : v)),
            start: this.start === undefined ? undefined : this.start,
            count: this.count === undefined ? undefined : this.count,
            total: this.total === undefined ? undefined : this.total,
            otherItems: this.otherItems === undefined
                ? undefined
                : this.otherItems?.map((v) => (v == undefined ? undefined : v)),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
export class NetworkDescription {
    constructor(args) {
        this.id = args.id == undefined ? undefined : args.id;
        this.partitions =
            args.partitions == undefined
                ? undefined
                : args.partitions.map((v) => v == undefined
                    ? undefined
                    : v instanceof PartitionDescription
                        ? v
                        : new PartitionDescription(v));
    }
    copy() {
        return new NetworkDescription(this.asObject());
    }
    asObject() {
        return {
            id: this.id === undefined ? undefined : this.id,
            partitions: this.partitions === undefined
                ? undefined
                : this.partitions?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], NetworkDescription.prototype, "id", void 0);
__decorate([
    (encodeAs.field(2).repeatable.reference)
], NetworkDescription.prototype, "partitions", void 0);
export class NodeDescription {
    constructor(args) {
        this.address = args.address == undefined ? undefined : args.address;
        this.type = args.type == undefined ? undefined : config.NodeType.fromObject(args.type);
    }
    copy() {
        return new NodeDescription(this.asObject());
    }
    asObject() {
        return {
            address: this.address === undefined ? undefined : this.address,
            type: this.type === undefined ? undefined : config.NodeType.getName(this.type),
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], NodeDescription.prototype, "address", void 0);
__decorate([
    (encodeAs.field(2).enum)
], NodeDescription.prototype, "type", void 0);
export class PartitionDescription {
    constructor(args) {
        this.id = args.id == undefined ? undefined : args.id;
        this.type = args.type == undefined ? undefined : protocol.PartitionType.fromObject(args.type);
        this.basePort = args.basePort == undefined ? undefined : args.basePort;
        this.nodes =
            args.nodes == undefined
                ? undefined
                : args.nodes.map((v) => v == undefined ? undefined : v instanceof NodeDescription ? v : new NodeDescription(v));
    }
    copy() {
        return new PartitionDescription(this.asObject());
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
], PartitionDescription.prototype, "id", void 0);
__decorate([
    (encodeAs.field(2).enum)
], PartitionDescription.prototype, "type", void 0);
__decorate([
    (encodeAs.field(3).int)
], PartitionDescription.prototype, "basePort", void 0);
__decorate([
    (encodeAs.field(4).repeatable.reference)
], PartitionDescription.prototype, "nodes", void 0);
export class QueryOptions {
    constructor(args) {
        this.expand = args.expand == undefined ? undefined : args.expand;
        this.height = args.height == undefined ? undefined : args.height;
        this.scratch = args.scratch == undefined ? undefined : args.scratch;
        this.prove = args.prove == undefined ? undefined : args.prove;
        this.includeRemote = args.includeRemote == undefined ? undefined : args.includeRemote;
    }
    copy() {
        return new QueryOptions(this.asObject());
    }
    asObject() {
        return {
            expand: this.expand === undefined ? undefined : this.expand,
            height: this.height === undefined ? undefined : this.height,
            scratch: this.scratch === undefined ? undefined : this.scratch,
            prove: this.prove === undefined ? undefined : this.prove,
            includeRemote: this.includeRemote === undefined ? undefined : this.includeRemote,
        };
    }
}
export class QueryPagination {
    constructor(args) {
        this.start = args.start == undefined ? undefined : args.start;
        this.count = args.count == undefined ? undefined : args.count;
    }
    copy() {
        return new QueryPagination(this.asObject());
    }
    asObject() {
        return {
            start: this.start === undefined ? undefined : this.start,
            count: this.count === undefined ? undefined : this.count,
        };
    }
}
export class ResponseDataEntry {
    constructor(args) {
        this.entryHash =
            args.entryHash == undefined
                ? undefined
                : args.entryHash instanceof Uint8Array
                    ? args.entryHash
                    : Buffer.from(args.entryHash, "hex");
        this.entry = args.entry == undefined ? undefined : protocol.DataEntry.fromObject(args.entry);
        this.txId = args.txId == undefined ? undefined : TxID.parse(args.txId);
        this.causeTxId = args.causeTxId == undefined ? undefined : TxID.parse(args.causeTxId);
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new ResponseDataEntry(this.asObject());
    }
    asObject() {
        return {
            entryHash: this.entryHash === undefined
                ? undefined
                : this.entryHash && Buffer.from(this.entryHash).toString("hex"),
            entry: this.entry === undefined ? undefined : this.entry.asObject(),
            txId: this.txId === undefined ? undefined : this.txId.toString(),
            causeTxId: this.causeTxId === undefined ? undefined : this.causeTxId.toString(),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).hash)
], ResponseDataEntry.prototype, "entryHash", void 0);
__decorate([
    (encodeAs.field(2).union)
], ResponseDataEntry.prototype, "entry", void 0);
__decorate([
    (encodeAs.field(3).txid)
], ResponseDataEntry.prototype, "txId", void 0);
__decorate([
    (encodeAs.field(4).txid)
], ResponseDataEntry.prototype, "causeTxId", void 0);
__decorate([
    (encodeAs.field(5).time)
], ResponseDataEntry.prototype, "lastBlockTime", void 0);
export class ResponseDataEntrySet {
    constructor(args) {
        this.dataEntries =
            args.dataEntries == undefined
                ? undefined
                : args.dataEntries.map((v) => v == undefined
                    ? undefined
                    : v instanceof ResponseDataEntry
                        ? v
                        : new ResponseDataEntry(v));
        this.total = args.total == undefined ? undefined : args.total;
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new ResponseDataEntrySet(this.asObject());
    }
    asObject() {
        return {
            dataEntries: this.dataEntries === undefined
                ? undefined
                : this.dataEntries?.map((v) => (v == undefined ? undefined : v.asObject())),
            total: this.total === undefined ? undefined : this.total,
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).repeatable.reference)
], ResponseDataEntrySet.prototype, "dataEntries", void 0);
__decorate([
    (encodeAs.field(2).uint)
], ResponseDataEntrySet.prototype, "total", void 0);
__decorate([
    (encodeAs.field(3).time)
], ResponseDataEntrySet.prototype, "lastBlockTime", void 0);
export class ResponseKeyPageIndex {
    constructor(args) {
        this.authority = args.authority == undefined ? undefined : URL.parse(args.authority);
        this.signer = args.signer == undefined ? undefined : URL.parse(args.signer);
        this.index = args.index == undefined ? undefined : args.index;
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new ResponseKeyPageIndex(this.asObject());
    }
    asObject() {
        return {
            authority: this.authority === undefined ? undefined : this.authority.toString(),
            signer: this.signer === undefined ? undefined : this.signer.toString(),
            index: this.index === undefined ? undefined : this.index,
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).url)
], ResponseKeyPageIndex.prototype, "authority", void 0);
__decorate([
    (encodeAs.field(2).url)
], ResponseKeyPageIndex.prototype, "signer", void 0);
__decorate([
    (encodeAs.field(3).keepEmpty.uint)
], ResponseKeyPageIndex.prototype, "index", void 0);
__decorate([
    (encodeAs.field(4).time)
], ResponseKeyPageIndex.prototype, "lastBlockTime", void 0);
export class SignatureBook {
    constructor(args) {
        this.authority = args.authority == undefined ? undefined : URL.parse(args.authority);
        this.pages =
            args.pages == undefined
                ? undefined
                : args.pages.map((v) => v == undefined ? undefined : v instanceof SignaturePage ? v : new SignaturePage(v));
    }
    copy() {
        return new SignatureBook(this.asObject());
    }
    asObject() {
        return {
            authority: this.authority === undefined ? undefined : this.authority.toString(),
            pages: this.pages === undefined
                ? undefined
                : this.pages?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
export class SignaturePage {
    constructor(args) {
        this.signer =
            args.signer == undefined
                ? undefined
                : args.signer instanceof SignerMetadata
                    ? args.signer
                    : new SignerMetadata(args.signer);
        this.signatures =
            args.signatures == undefined
                ? undefined
                : args.signatures.map((v) => v == undefined ? undefined : protocol.Signature.fromObject(v));
    }
    copy() {
        return new SignaturePage(this.asObject());
    }
    asObject() {
        return {
            signer: this.signer === undefined ? undefined : this.signer.asObject(),
            signatures: this.signatures === undefined
                ? undefined
                : this.signatures?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
export class Signer {
    constructor(args) {
        this.publicKey =
            args.publicKey == undefined
                ? undefined
                : args.publicKey instanceof Uint8Array
                    ? args.publicKey
                    : Buffer.from(args.publicKey, "hex");
        this.timestamp = args.timestamp == undefined ? undefined : args.timestamp;
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.version = args.version == undefined ? undefined : args.version;
        this.signatureType =
            args.signatureType == undefined
                ? undefined
                : protocol.SignatureType.fromObject(args.signatureType);
        this.useSimpleHash = args.useSimpleHash == undefined ? undefined : args.useSimpleHash;
    }
    copy() {
        return new Signer(this.asObject());
    }
    asObject() {
        return {
            publicKey: this.publicKey === undefined
                ? undefined
                : this.publicKey && Buffer.from(this.publicKey).toString("hex"),
            timestamp: this.timestamp === undefined ? undefined : this.timestamp,
            url: this.url === undefined ? undefined : this.url.toString(),
            version: this.version === undefined ? undefined : this.version,
            signatureType: this.signatureType === undefined
                ? undefined
                : protocol.SignatureType.getName(this.signatureType),
            useSimpleHash: this.useSimpleHash === undefined ? undefined : this.useSimpleHash,
        };
    }
}
export class SignerMetadata {
    constructor(args) {
        this.type = args.type == undefined ? undefined : protocol.AccountType.fromObject(args.type);
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.acceptThreshold = args.acceptThreshold == undefined ? undefined : args.acceptThreshold;
    }
    copy() {
        return new SignerMetadata(this.asObject());
    }
    asObject() {
        return {
            type: this.type === undefined ? undefined : protocol.AccountType.getName(this.type),
            url: this.url === undefined ? undefined : this.url.toString(),
            acceptThreshold: this.acceptThreshold === undefined ? undefined : this.acceptThreshold,
        };
    }
}
export class StatusResponse {
    constructor(args) {
        this.ok = args.ok == undefined ? undefined : args.ok;
        this.bvnHeight = args.bvnHeight == undefined ? undefined : args.bvnHeight;
        this.dnHeight = args.dnHeight == undefined ? undefined : args.dnHeight;
        this.bvnTime =
            args.bvnTime == undefined
                ? undefined
                : args.bvnTime instanceof Date
                    ? args.bvnTime
                    : new Date(args.bvnTime);
        this.dnTime =
            args.dnTime == undefined
                ? undefined
                : args.dnTime instanceof Date
                    ? args.dnTime
                    : new Date(args.dnTime);
        this.lastDirectoryAnchorHeight =
            args.lastDirectoryAnchorHeight == undefined ? undefined : args.lastDirectoryAnchorHeight;
        this.bvnRootHash =
            args.bvnRootHash == undefined
                ? undefined
                : args.bvnRootHash instanceof Uint8Array
                    ? args.bvnRootHash
                    : Buffer.from(args.bvnRootHash, "hex");
        this.dnRootHash =
            args.dnRootHash == undefined
                ? undefined
                : args.dnRootHash instanceof Uint8Array
                    ? args.dnRootHash
                    : Buffer.from(args.dnRootHash, "hex");
        this.bvnBptHash =
            args.bvnBptHash == undefined
                ? undefined
                : args.bvnBptHash instanceof Uint8Array
                    ? args.bvnBptHash
                    : Buffer.from(args.bvnBptHash, "hex");
        this.dnBptHash =
            args.dnBptHash == undefined
                ? undefined
                : args.dnBptHash instanceof Uint8Array
                    ? args.dnBptHash
                    : Buffer.from(args.dnBptHash, "hex");
    }
    copy() {
        return new StatusResponse(this.asObject());
    }
    asObject() {
        return {
            ok: this.ok === undefined ? undefined : this.ok,
            bvnHeight: this.bvnHeight === undefined ? undefined : this.bvnHeight,
            dnHeight: this.dnHeight === undefined ? undefined : this.dnHeight,
            bvnTime: this.bvnTime === undefined ? undefined : this.bvnTime,
            dnTime: this.dnTime === undefined ? undefined : this.dnTime,
            lastDirectoryAnchorHeight: this.lastDirectoryAnchorHeight === undefined ? undefined : this.lastDirectoryAnchorHeight,
            bvnRootHash: this.bvnRootHash === undefined
                ? undefined
                : this.bvnRootHash && Buffer.from(this.bvnRootHash).toString("hex"),
            dnRootHash: this.dnRootHash === undefined
                ? undefined
                : this.dnRootHash && Buffer.from(this.dnRootHash).toString("hex"),
            bvnBptHash: this.bvnBptHash === undefined
                ? undefined
                : this.bvnBptHash && Buffer.from(this.bvnBptHash).toString("hex"),
            dnBptHash: this.dnBptHash === undefined
                ? undefined
                : this.dnBptHash && Buffer.from(this.dnBptHash).toString("hex"),
        };
    }
}
export class SyntheticTransactionRequest {
    constructor(args) {
        this.source = args.source == undefined ? undefined : URL.parse(args.source);
        this.destination = args.destination == undefined ? undefined : URL.parse(args.destination);
        this.sequenceNumber = args.sequenceNumber == undefined ? undefined : args.sequenceNumber;
        this.anchor = args.anchor == undefined ? undefined : args.anchor;
    }
    copy() {
        return new SyntheticTransactionRequest(this.asObject());
    }
    asObject() {
        return {
            source: this.source === undefined ? undefined : this.source.toString(),
            destination: this.destination === undefined ? undefined : this.destination.toString(),
            sequenceNumber: this.sequenceNumber === undefined ? undefined : this.sequenceNumber,
            anchor: this.anchor === undefined ? undefined : this.anchor,
        };
    }
}
export class TokenDeposit {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.amount =
            args.amount == undefined
                ? undefined
                : typeof args.amount === "bigint"
                    ? args.amount
                    : BigInt(args.amount);
        this.txid =
            args.txid == undefined
                ? undefined
                : args.txid instanceof Uint8Array
                    ? args.txid
                    : Buffer.from(args.txid, "hex");
    }
    copy() {
        return new TokenDeposit(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
            amount: this.amount === undefined ? undefined : this.amount.toString(),
            txid: this.txid === undefined ? undefined : this.txid && Buffer.from(this.txid).toString("hex"),
        };
    }
}
export class TokenSend {
    constructor(args) {
        this.from = args.from == undefined ? undefined : URL.parse(args.from);
        this.to =
            args.to == undefined
                ? undefined
                : args.to.map((v) => v == undefined ? undefined : v instanceof TokenDeposit ? v : new TokenDeposit(v));
    }
    copy() {
        return new TokenSend(this.asObject());
    }
    asObject() {
        return {
            from: this.from === undefined ? undefined : this.from.toString(),
            to: this.to === undefined
                ? undefined
                : this.to?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
export class TransactionQueryResponse {
    constructor(args) {
        this.type = args.type == undefined ? undefined : args.type;
        this.mainChain =
            args.mainChain == undefined
                ? undefined
                : args.mainChain instanceof MerkleState
                    ? args.mainChain
                    : new MerkleState(args.mainChain);
        this.data = args.data == undefined ? undefined : args.data;
        this.origin = args.origin == undefined ? undefined : URL.parse(args.origin);
        this.transactionHash =
            args.transactionHash == undefined
                ? undefined
                : args.transactionHash instanceof Uint8Array
                    ? args.transactionHash
                    : Buffer.from(args.transactionHash, "hex");
        this.txid = args.txid == undefined ? undefined : TxID.parse(args.txid);
        this.transaction =
            args.transaction == undefined
                ? undefined
                : args.transaction instanceof protocol.Transaction
                    ? args.transaction
                    : new protocol.Transaction(args.transaction);
        this.signatures =
            args.signatures == undefined
                ? undefined
                : args.signatures.map((v) => v == undefined ? undefined : protocol.Signature.fromObject(v));
        this.status =
            args.status == undefined
                ? undefined
                : args.status instanceof protocol.TransactionStatus
                    ? args.status
                    : new protocol.TransactionStatus(args.status);
        this.produced =
            args.produced == undefined
                ? undefined
                : args.produced.map((v) => (v == undefined ? undefined : TxID.parse(v)));
        this.receipts =
            args.receipts == undefined
                ? undefined
                : args.receipts.map((v) => v == undefined ? undefined : v instanceof TxReceipt ? v : new TxReceipt(v));
        this.signatureBooks =
            args.signatureBooks == undefined
                ? undefined
                : args.signatureBooks.map((v) => v == undefined ? undefined : v instanceof SignatureBook ? v : new SignatureBook(v));
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new TransactionQueryResponse(this.asObject());
    }
    asObject() {
        return {
            type: this.type === undefined ? undefined : this.type,
            mainChain: this.mainChain === undefined ? undefined : this.mainChain.asObject(),
            data: this.data === undefined ? undefined : this.data,
            origin: this.origin === undefined ? undefined : this.origin.toString(),
            transactionHash: this.transactionHash === undefined
                ? undefined
                : this.transactionHash && Buffer.from(this.transactionHash).toString("hex"),
            txid: this.txid === undefined ? undefined : this.txid.toString(),
            transaction: this.transaction === undefined ? undefined : this.transaction.asObject(),
            signatures: this.signatures === undefined
                ? undefined
                : this.signatures?.map((v) => (v == undefined ? undefined : v.asObject())),
            status: this.status === undefined ? undefined : this.status.asObject(),
            produced: this.produced === undefined
                ? undefined
                : this.produced?.map((v) => (v == undefined ? undefined : v.toString())),
            receipts: this.receipts === undefined
                ? undefined
                : this.receipts?.map((v) => (v == undefined ? undefined : v.asObject())),
            signatureBooks: this.signatureBooks === undefined
                ? undefined
                : this.signatureBooks?.map((v) => (v == undefined ? undefined : v.asObject())),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
export class TxHistoryQuery {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
        this.start = args.start == undefined ? undefined : args.start;
        this.count = args.count == undefined ? undefined : args.count;
        this.scratch = args.scratch == undefined ? undefined : args.scratch;
    }
    copy() {
        return new TxHistoryQuery(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
            start: this.start === undefined ? undefined : this.start,
            count: this.count === undefined ? undefined : this.count,
            scratch: this.scratch === undefined ? undefined : this.scratch,
        };
    }
}
export class TxReceipt {
    constructor(args) {
        this.localBlock = args.localBlock == undefined ? undefined : args.localBlock;
        this.localBlockTime =
            args.localBlockTime == undefined
                ? undefined
                : args.localBlockTime instanceof Date
                    ? args.localBlockTime
                    : new Date(args.localBlockTime);
        this.directoryBlock = args.directoryBlock == undefined ? undefined : args.directoryBlock;
        this.majorBlock = args.majorBlock == undefined ? undefined : args.majorBlock;
        this.proof =
            args.proof == undefined
                ? undefined
                : args.proof instanceof merkle.Receipt
                    ? args.proof
                    : new merkle.Receipt(args.proof);
        this.error = args.error == undefined ? undefined : args.error;
        this.account = args.account == undefined ? undefined : URL.parse(args.account);
        this.chain = args.chain == undefined ? undefined : args.chain;
    }
    copy() {
        return new TxReceipt(this.asObject());
    }
    asObject() {
        return {
            localBlock: this.localBlock === undefined ? undefined : this.localBlock,
            localBlockTime: this.localBlockTime === undefined ? undefined : this.localBlockTime,
            directoryBlock: this.directoryBlock === undefined ? undefined : this.directoryBlock,
            majorBlock: this.majorBlock === undefined ? undefined : this.majorBlock,
            proof: this.proof === undefined ? undefined : this.proof.asObject(),
            error: this.error === undefined ? undefined : this.error,
            account: this.account === undefined ? undefined : this.account.toString(),
            chain: this.chain === undefined ? undefined : this.chain,
        };
    }
}
__decorate([
    (encodeAs.field(1, 1).uint)
], TxReceipt.prototype, "localBlock", void 0);
__decorate([
    (encodeAs.field(1, 2).time)
], TxReceipt.prototype, "localBlockTime", void 0);
__decorate([
    (encodeAs.field(1, 3).uint)
], TxReceipt.prototype, "directoryBlock", void 0);
__decorate([
    (encodeAs.field(1, 4).uint)
], TxReceipt.prototype, "majorBlock", void 0);
__decorate([
    (encodeAs.field(1, 5).reference)
], TxReceipt.prototype, "proof", void 0);
__decorate([
    (encodeAs.field(1, 6).string)
], TxReceipt.prototype, "error", void 0);
__decorate([
    (encodeAs.field(2).url)
], TxReceipt.prototype, "account", void 0);
__decorate([
    (encodeAs.field(3).string)
], TxReceipt.prototype, "chain", void 0);
export class TxRequest {
    constructor(args) {
        this.checkOnly = args.checkOnly == undefined ? undefined : args.checkOnly;
        this.isEnvelope = args.isEnvelope == undefined ? undefined : args.isEnvelope;
        this.origin = args.origin == undefined ? undefined : URL.parse(args.origin);
        this.signer =
            args.signer == undefined
                ? undefined
                : args.signer instanceof Signer
                    ? args.signer
                    : new Signer(args.signer);
        this.signature =
            args.signature == undefined
                ? undefined
                : args.signature instanceof Uint8Array
                    ? args.signature
                    : Buffer.from(args.signature, "hex");
        this.keyPage =
            args.keyPage == undefined
                ? undefined
                : args.keyPage instanceof KeyPage
                    ? args.keyPage
                    : new KeyPage(args.keyPage);
        this.txHash =
            args.txHash == undefined
                ? undefined
                : args.txHash instanceof Uint8Array
                    ? args.txHash
                    : Buffer.from(args.txHash, "hex");
        this.payload = args.payload == undefined ? undefined : args.payload;
        this.memo = args.memo == undefined ? undefined : args.memo;
        this.metadata =
            args.metadata == undefined
                ? undefined
                : args.metadata instanceof Uint8Array
                    ? args.metadata
                    : Buffer.from(args.metadata, "hex");
    }
    copy() {
        return new TxRequest(this.asObject());
    }
    asObject() {
        return {
            checkOnly: this.checkOnly === undefined ? undefined : this.checkOnly,
            isEnvelope: this.isEnvelope === undefined ? undefined : this.isEnvelope,
            origin: this.origin === undefined ? undefined : this.origin.toString(),
            signer: this.signer === undefined ? undefined : this.signer.asObject(),
            signature: this.signature === undefined
                ? undefined
                : this.signature && Buffer.from(this.signature).toString("hex"),
            keyPage: this.keyPage === undefined ? undefined : this.keyPage.asObject(),
            txHash: this.txHash === undefined
                ? undefined
                : this.txHash && Buffer.from(this.txHash).toString("hex"),
            payload: this.payload === undefined ? undefined : this.payload,
            memo: this.memo === undefined ? undefined : this.memo,
            metadata: this.metadata === undefined
                ? undefined
                : this.metadata && Buffer.from(this.metadata).toString("hex"),
        };
    }
}
export class TxResponse {
    constructor(args) {
        this.transactionHash =
            args.transactionHash == undefined
                ? undefined
                : args.transactionHash instanceof Uint8Array
                    ? args.transactionHash
                    : Buffer.from(args.transactionHash, "hex");
        this.txid = args.txid == undefined ? undefined : TxID.parse(args.txid);
        this.signatureHashes =
            args.signatureHashes == undefined
                ? undefined
                : args.signatureHashes.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
        this.simpleHash =
            args.simpleHash == undefined
                ? undefined
                : args.simpleHash instanceof Uint8Array
                    ? args.simpleHash
                    : Buffer.from(args.simpleHash, "hex");
        this.code = args.code == undefined ? undefined : args.code;
        this.message = args.message == undefined ? undefined : args.message;
        this.delivered = args.delivered == undefined ? undefined : args.delivered;
        this.result = args.result == undefined ? undefined : args.result;
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new TxResponse(this.asObject());
    }
    asObject() {
        return {
            transactionHash: this.transactionHash === undefined
                ? undefined
                : this.transactionHash && Buffer.from(this.transactionHash).toString("hex"),
            txid: this.txid === undefined ? undefined : this.txid.toString(),
            signatureHashes: this.signatureHashes === undefined
                ? undefined
                : this.signatureHashes?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
            simpleHash: this.simpleHash === undefined
                ? undefined
                : this.simpleHash && Buffer.from(this.simpleHash).toString("hex"),
            code: this.code === undefined ? undefined : this.code,
            message: this.message === undefined ? undefined : this.message,
            delivered: this.delivered === undefined ? undefined : this.delivered,
            result: this.result === undefined ? undefined : this.result,
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
export class TxnQuery {
    constructor(args) {
        this.expand = args.expand == undefined ? undefined : args.expand;
        this.height = args.height == undefined ? undefined : args.height;
        this.scratch = args.scratch == undefined ? undefined : args.scratch;
        this.prove = args.prove == undefined ? undefined : args.prove;
        this.includeRemote = args.includeRemote == undefined ? undefined : args.includeRemote;
        this.txid =
            args.txid == undefined
                ? undefined
                : args.txid instanceof Uint8Array
                    ? args.txid
                    : Buffer.from(args.txid, "hex");
        this.txIdUrl = args.txIdUrl == undefined ? undefined : TxID.parse(args.txIdUrl);
        this.wait = args.wait == undefined ? undefined : args.wait;
        this.ignorePending = args.ignorePending == undefined ? undefined : args.ignorePending;
    }
    copy() {
        return new TxnQuery(this.asObject());
    }
    asObject() {
        return {
            expand: this.expand === undefined ? undefined : this.expand,
            height: this.height === undefined ? undefined : this.height,
            scratch: this.scratch === undefined ? undefined : this.scratch,
            prove: this.prove === undefined ? undefined : this.prove,
            includeRemote: this.includeRemote === undefined ? undefined : this.includeRemote,
            txid: this.txid === undefined ? undefined : this.txid && Buffer.from(this.txid).toString("hex"),
            txIdUrl: this.txIdUrl === undefined ? undefined : this.txIdUrl.toString(),
            wait: this.wait === undefined ? undefined : this.wait,
            ignorePending: this.ignorePending === undefined ? undefined : this.ignorePending,
        };
    }
}
export class UrlQuery {
    constructor(args) {
        this.url = args.url == undefined ? undefined : URL.parse(args.url);
    }
    copy() {
        return new UrlQuery(this.asObject());
    }
    asObject() {
        return {
            url: this.url === undefined ? undefined : this.url.toString(),
        };
    }
}
export class VersionResponse {
    constructor(args) {
        this.version = args.version == undefined ? undefined : args.version;
        this.commit = args.commit == undefined ? undefined : args.commit;
        this.versionIsKnown = args.versionIsKnown == undefined ? undefined : args.versionIsKnown;
        this.isTestNet = args.isTestNet == undefined ? undefined : args.isTestNet;
    }
    copy() {
        return new VersionResponse(this.asObject());
    }
    asObject() {
        return {
            version: this.version === undefined ? undefined : this.version,
            commit: this.commit === undefined ? undefined : this.commit,
            versionIsKnown: this.versionIsKnown === undefined ? undefined : this.versionIsKnown,
            isTestNet: this.isTestNet === undefined ? undefined : this.isTestNet,
        };
    }
}
//# sourceMappingURL=types_gen.js.map