var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Record } from "./unions_gen.js";
import { AccumulateTxID as TxID } from "../address/txid.js";
import { AccumulateURL as URL } from "../address/url.js";
import { Buffer } from "../common/buffer.js";
import * as protocol from "../core/index.js";
import { encodeAs } from "../encoding/index.js";
import * as errors2 from "../errors/index.js";
import * as merkle from "../merkle/index.js";
import * as messaging from "../messaging/index.js";
import * as core from "../network/index.js";
import { EventType, KnownPeerStatus, QueryType, RecordType, } from "./enums_gen.js";
import * as p2p from "./p2p.js";
export class AccountRecord {
    constructor(args) {
        this.recordType = RecordType.Account;
        this.account =
            args.account == undefined ? undefined : protocol.Account.fromObject(args.account);
        this.directory =
            args.directory == undefined
                ? undefined
                : args.directory instanceof (RecordRange)
                    ? args.directory
                    : new RecordRange(args.directory);
        this.pending =
            args.pending == undefined
                ? undefined
                : args.pending instanceof (RecordRange)
                    ? args.pending
                    : new RecordRange(args.pending);
        this.receipt =
            args.receipt == undefined
                ? undefined
                : args.receipt instanceof Receipt
                    ? args.receipt
                    : new Receipt(args.receipt);
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new AccountRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "account",
            account: this.account === undefined ? undefined : this.account.asObject(),
            directory: this.directory === undefined ? undefined : this.directory.asObject(),
            pending: this.pending === undefined ? undefined : this.pending.asObject(),
            receipt: this.receipt === undefined ? undefined : this.receipt.asObject(),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], AccountRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).union)
], AccountRecord.prototype, "account", void 0);
__decorate([
    (encodeAs.field(3).reference)
], AccountRecord.prototype, "directory", void 0);
__decorate([
    (encodeAs.field(4).reference)
], AccountRecord.prototype, "pending", void 0);
__decorate([
    (encodeAs.field(5).reference)
], AccountRecord.prototype, "receipt", void 0);
__decorate([
    (encodeAs.field(6).time)
], AccountRecord.prototype, "lastBlockTime", void 0);
export class AnchorSearchQuery {
    constructor(args) {
        this.queryType = QueryType.AnchorSearch;
        this.anchor =
            args.anchor == undefined
                ? undefined
                : args.anchor instanceof Uint8Array
                    ? args.anchor
                    : Buffer.from(args.anchor, "hex");
        this.includeReceipt =
            args.includeReceipt == undefined
                ? undefined
                : args.includeReceipt instanceof ReceiptOptions
                    ? args.includeReceipt
                    : new ReceiptOptions(args.includeReceipt);
    }
    copy() {
        return new AnchorSearchQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "anchorSearch",
            anchor: this.anchor === undefined
                ? undefined
                : this.anchor && Buffer.from(this.anchor).toString("hex"),
            includeReceipt: this.includeReceipt === undefined ? undefined : this.includeReceipt.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], AnchorSearchQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).bytes)
], AnchorSearchQuery.prototype, "anchor", void 0);
__decorate([
    (encodeAs.field(3).reference)
], AnchorSearchQuery.prototype, "includeReceipt", void 0);
export class BlockEvent {
    constructor(args) {
        this.eventType = EventType.Block;
        this.partition = args.partition == undefined ? undefined : args.partition;
        this.index = args.index == undefined ? undefined : args.index;
        this.time =
            args.time == undefined
                ? undefined
                : args.time instanceof Date
                    ? args.time
                    : new Date(args.time);
        this.major = args.major == undefined ? undefined : args.major;
        this.entries =
            args.entries == undefined
                ? undefined
                : args.entries.map((v) => v == undefined
                    ? undefined
                    : v instanceof (ChainEntryRecord)
                        ? v
                        : new ChainEntryRecord(v));
    }
    copy() {
        return new BlockEvent(this.asObject());
    }
    asObject() {
        return {
            eventType: "block",
            partition: this.partition === undefined ? undefined : this.partition,
            index: this.index === undefined ? undefined : this.index,
            time: this.time === undefined ? undefined : this.time,
            major: this.major === undefined ? undefined : this.major,
            entries: this.entries === undefined
                ? undefined
                : this.entries?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(EventType))
], BlockEvent.prototype, "eventType", void 0);
__decorate([
    (encodeAs.field(2).string)
], BlockEvent.prototype, "partition", void 0);
__decorate([
    (encodeAs.field(3).uint)
], BlockEvent.prototype, "index", void 0);
__decorate([
    (encodeAs.field(4).time)
], BlockEvent.prototype, "time", void 0);
__decorate([
    (encodeAs.field(5).uint)
], BlockEvent.prototype, "major", void 0);
__decorate([
    (encodeAs.field(6).repeatable.reference)
], BlockEvent.prototype, "entries", void 0);
export class BlockQuery {
    constructor(args) {
        this.queryType = QueryType.Block;
        this.minor = args.minor == undefined ? undefined : args.minor;
        this.major = args.major == undefined ? undefined : args.major;
        this.minorRange =
            args.minorRange == undefined
                ? undefined
                : args.minorRange instanceof RangeOptions
                    ? args.minorRange
                    : new RangeOptions(args.minorRange);
        this.majorRange =
            args.majorRange == undefined
                ? undefined
                : args.majorRange instanceof RangeOptions
                    ? args.majorRange
                    : new RangeOptions(args.majorRange);
        this.entryRange =
            args.entryRange == undefined
                ? undefined
                : args.entryRange instanceof RangeOptions
                    ? args.entryRange
                    : new RangeOptions(args.entryRange);
        this.omitEmpty = args.omitEmpty == undefined ? undefined : args.omitEmpty;
    }
    copy() {
        return new BlockQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "block",
            minor: this.minor === undefined ? undefined : this.minor,
            major: this.major === undefined ? undefined : this.major,
            minorRange: this.minorRange === undefined ? undefined : this.minorRange.asObject(),
            majorRange: this.majorRange === undefined ? undefined : this.majorRange.asObject(),
            entryRange: this.entryRange === undefined ? undefined : this.entryRange.asObject(),
            omitEmpty: this.omitEmpty === undefined ? undefined : this.omitEmpty,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], BlockQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).uint)
], BlockQuery.prototype, "minor", void 0);
__decorate([
    (encodeAs.field(3).uint)
], BlockQuery.prototype, "major", void 0);
__decorate([
    (encodeAs.field(4).reference)
], BlockQuery.prototype, "minorRange", void 0);
__decorate([
    (encodeAs.field(5).reference)
], BlockQuery.prototype, "majorRange", void 0);
__decorate([
    (encodeAs.field(6).reference)
], BlockQuery.prototype, "entryRange", void 0);
__decorate([
    (encodeAs.field(7).bool)
], BlockQuery.prototype, "omitEmpty", void 0);
export class ChainEntryRecord {
    constructor(args) {
        this.recordType = RecordType.ChainEntry;
        this.account = args.account == undefined ? undefined : URL.parse(args.account);
        this.name = args.name == undefined ? undefined : args.name;
        this.type = args.type == undefined ? undefined : merkle.ChainType.fromObject(args.type);
        this.index = args.index == undefined ? undefined : args.index;
        this.entry =
            args.entry == undefined
                ? undefined
                : args.entry instanceof Uint8Array
                    ? args.entry
                    : Buffer.from(args.entry, "hex");
        this.value = args.value == undefined ? undefined : Record.fromObject(args.value);
        this.receipt =
            args.receipt == undefined
                ? undefined
                : args.receipt instanceof Receipt
                    ? args.receipt
                    : new Receipt(args.receipt);
        this.state =
            args.state == undefined
                ? undefined
                : args.state.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new ChainEntryRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "chainEntry",
            account: this.account === undefined ? undefined : this.account.toString(),
            name: this.name === undefined ? undefined : this.name,
            type: this.type === undefined ? undefined : merkle.ChainType.getName(this.type),
            index: this.index === undefined ? undefined : this.index,
            entry: this.entry === undefined
                ? undefined
                : this.entry && Buffer.from(this.entry).toString("hex"),
            value: this.value === undefined ? undefined : this.value.asObject(),
            receipt: this.receipt === undefined ? undefined : this.receipt.asObject(),
            state: this.state === undefined
                ? undefined
                : this.state?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], ChainEntryRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).url)
], ChainEntryRecord.prototype, "account", void 0);
__decorate([
    (encodeAs.field(3).string)
], ChainEntryRecord.prototype, "name", void 0);
__decorate([
    (encodeAs.field(4).enum)
], ChainEntryRecord.prototype, "type", void 0);
__decorate([
    (encodeAs.field(5).keepEmpty.uint)
], ChainEntryRecord.prototype, "index", void 0);
__decorate([
    (encodeAs.field(6).hash)
], ChainEntryRecord.prototype, "entry", void 0);
__decorate([
    (encodeAs.field(7).union)
], ChainEntryRecord.prototype, "value", void 0);
__decorate([
    (encodeAs.field(8).reference)
], ChainEntryRecord.prototype, "receipt", void 0);
__decorate([
    (encodeAs.field(9).repeatable.bytes)
], ChainEntryRecord.prototype, "state", void 0);
__decorate([
    (encodeAs.field(10).time)
], ChainEntryRecord.prototype, "lastBlockTime", void 0);
export class ChainQuery {
    constructor(args) {
        this.queryType = QueryType.Chain;
        this.name = args.name == undefined ? undefined : args.name;
        this.index = args.index == undefined ? undefined : args.index;
        this.entry =
            args.entry == undefined
                ? undefined
                : args.entry instanceof Uint8Array
                    ? args.entry
                    : Buffer.from(args.entry, "hex");
        this.range =
            args.range == undefined
                ? undefined
                : args.range instanceof RangeOptions
                    ? args.range
                    : new RangeOptions(args.range);
        this.includeReceipt =
            args.includeReceipt == undefined
                ? undefined
                : args.includeReceipt instanceof ReceiptOptions
                    ? args.includeReceipt
                    : new ReceiptOptions(args.includeReceipt);
    }
    copy() {
        return new ChainQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "chain",
            name: this.name === undefined ? undefined : this.name,
            index: this.index === undefined ? undefined : this.index,
            entry: this.entry === undefined
                ? undefined
                : this.entry && Buffer.from(this.entry).toString("hex"),
            range: this.range === undefined ? undefined : this.range.asObject(),
            includeReceipt: this.includeReceipt === undefined ? undefined : this.includeReceipt.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], ChainQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).string)
], ChainQuery.prototype, "name", void 0);
__decorate([
    (encodeAs.field(3).uint)
], ChainQuery.prototype, "index", void 0);
__decorate([
    (encodeAs.field(4).bytes)
], ChainQuery.prototype, "entry", void 0);
__decorate([
    (encodeAs.field(5).reference)
], ChainQuery.prototype, "range", void 0);
__decorate([
    (encodeAs.field(6).reference)
], ChainQuery.prototype, "includeReceipt", void 0);
export class ChainRecord {
    constructor(args) {
        this.recordType = RecordType.Chain;
        this.name = args.name == undefined ? undefined : args.name;
        this.type = args.type == undefined ? undefined : merkle.ChainType.fromObject(args.type);
        this.count = args.count == undefined ? undefined : args.count;
        this.state =
            args.state == undefined
                ? undefined
                : args.state.map((v) => v == undefined ? undefined : v instanceof Uint8Array ? v : Buffer.from(v, "hex"));
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new ChainRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "chain",
            name: this.name === undefined ? undefined : this.name,
            type: this.type === undefined ? undefined : merkle.ChainType.getName(this.type),
            count: this.count === undefined ? undefined : this.count,
            state: this.state === undefined
                ? undefined
                : this.state?.map((v) => v == undefined ? undefined : v && Buffer.from(v).toString("hex")),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], ChainRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).string)
], ChainRecord.prototype, "name", void 0);
__decorate([
    (encodeAs.field(3).enum)
], ChainRecord.prototype, "type", void 0);
__decorate([
    (encodeAs.field(4).uint)
], ChainRecord.prototype, "count", void 0);
__decorate([
    (encodeAs.field(5).repeatable.bytes)
], ChainRecord.prototype, "state", void 0);
__decorate([
    (encodeAs.field(6).time)
], ChainRecord.prototype, "lastBlockTime", void 0);
export class ConsensusPeerInfo {
    constructor(args) {
        this.nodeID = args.nodeID == undefined ? undefined : args.nodeID;
        this.host = args.host == undefined ? undefined : args.host;
        this.port = args.port == undefined ? undefined : args.port;
    }
    copy() {
        return new ConsensusPeerInfo(this.asObject());
    }
    asObject() {
        return {
            nodeID: this.nodeID === undefined ? undefined : this.nodeID,
            host: this.host === undefined ? undefined : this.host,
            port: this.port === undefined ? undefined : this.port,
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], ConsensusPeerInfo.prototype, "nodeID", void 0);
__decorate([
    (encodeAs.field(2).string)
], ConsensusPeerInfo.prototype, "host", void 0);
__decorate([
    (encodeAs.field(3).uint)
], ConsensusPeerInfo.prototype, "port", void 0);
export class ConsensusStatus {
    constructor(args) {
        this.ok = args.ok == undefined ? undefined : args.ok;
        this.lastBlock =
            args.lastBlock == undefined
                ? undefined
                : args.lastBlock instanceof LastBlock
                    ? args.lastBlock
                    : new LastBlock(args.lastBlock);
        this.version = args.version == undefined ? undefined : args.version;
        this.commit = args.commit == undefined ? undefined : args.commit;
        this.nodeKeyHash =
            args.nodeKeyHash == undefined
                ? undefined
                : args.nodeKeyHash instanceof Uint8Array
                    ? args.nodeKeyHash
                    : Buffer.from(args.nodeKeyHash, "hex");
        this.validatorKeyHash =
            args.validatorKeyHash == undefined
                ? undefined
                : args.validatorKeyHash instanceof Uint8Array
                    ? args.validatorKeyHash
                    : Buffer.from(args.validatorKeyHash, "hex");
        this.partitionID = args.partitionID == undefined ? undefined : args.partitionID;
        this.partitionType =
            args.partitionType == undefined
                ? undefined
                : protocol.PartitionType.fromObject(args.partitionType);
        this.peers =
            args.peers == undefined
                ? undefined
                : args.peers.map((v) => v == undefined
                    ? undefined
                    : v instanceof ConsensusPeerInfo
                        ? v
                        : new ConsensusPeerInfo(v));
    }
    copy() {
        return new ConsensusStatus(this.asObject());
    }
    asObject() {
        return {
            ok: this.ok === undefined ? undefined : this.ok,
            lastBlock: this.lastBlock === undefined ? undefined : this.lastBlock.asObject(),
            version: this.version === undefined ? undefined : this.version,
            commit: this.commit === undefined ? undefined : this.commit,
            nodeKeyHash: this.nodeKeyHash === undefined
                ? undefined
                : this.nodeKeyHash && Buffer.from(this.nodeKeyHash).toString("hex"),
            validatorKeyHash: this.validatorKeyHash === undefined
                ? undefined
                : this.validatorKeyHash && Buffer.from(this.validatorKeyHash).toString("hex"),
            partitionID: this.partitionID === undefined ? undefined : this.partitionID,
            partitionType: this.partitionType === undefined
                ? undefined
                : protocol.PartitionType.getName(this.partitionType),
            peers: this.peers === undefined
                ? undefined
                : this.peers?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).bool)
], ConsensusStatus.prototype, "ok", void 0);
__decorate([
    (encodeAs.field(2).reference)
], ConsensusStatus.prototype, "lastBlock", void 0);
__decorate([
    (encodeAs.field(3).string)
], ConsensusStatus.prototype, "version", void 0);
__decorate([
    (encodeAs.field(4).string)
], ConsensusStatus.prototype, "commit", void 0);
__decorate([
    (encodeAs.field(5).hash)
], ConsensusStatus.prototype, "nodeKeyHash", void 0);
__decorate([
    (encodeAs.field(6).hash)
], ConsensusStatus.prototype, "validatorKeyHash", void 0);
__decorate([
    (encodeAs.field(7).string)
], ConsensusStatus.prototype, "partitionID", void 0);
__decorate([
    (encodeAs.field(8).enum)
], ConsensusStatus.prototype, "partitionType", void 0);
__decorate([
    (encodeAs.field(9).repeatable.reference)
], ConsensusStatus.prototype, "peers", void 0);
export class ConsensusStatusOptions {
    constructor(args) {
        this.nodeID = args.nodeID == undefined ? undefined : args.nodeID;
        this.partition = args.partition == undefined ? undefined : args.partition;
        this.includePeers = args.includePeers == undefined ? undefined : args.includePeers;
        this.includeAccumulate =
            args.includeAccumulate == undefined ? undefined : args.includeAccumulate;
    }
    copy() {
        return new ConsensusStatusOptions(this.asObject());
    }
    asObject() {
        return {
            nodeID: this.nodeID === undefined ? undefined : this.nodeID,
            partition: this.partition === undefined ? undefined : this.partition,
            includePeers: this.includePeers === undefined ? undefined : this.includePeers,
            includeAccumulate: this.includeAccumulate === undefined ? undefined : this.includeAccumulate,
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], ConsensusStatusOptions.prototype, "nodeID", void 0);
__decorate([
    (encodeAs.field(2).string)
], ConsensusStatusOptions.prototype, "partition", void 0);
__decorate([
    (encodeAs.field(3).bool)
], ConsensusStatusOptions.prototype, "includePeers", void 0);
__decorate([
    (encodeAs.field(4).bool)
], ConsensusStatusOptions.prototype, "includeAccumulate", void 0);
export class DataQuery {
    constructor(args) {
        this.queryType = QueryType.Data;
        this.index = args.index == undefined ? undefined : args.index;
        this.entry =
            args.entry == undefined
                ? undefined
                : args.entry instanceof Uint8Array
                    ? args.entry
                    : Buffer.from(args.entry, "hex");
        this.range =
            args.range == undefined
                ? undefined
                : args.range instanceof RangeOptions
                    ? args.range
                    : new RangeOptions(args.range);
    }
    copy() {
        return new DataQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "data",
            index: this.index === undefined ? undefined : this.index,
            entry: this.entry === undefined
                ? undefined
                : this.entry && Buffer.from(this.entry).toString("hex"),
            range: this.range === undefined ? undefined : this.range.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], DataQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).uint)
], DataQuery.prototype, "index", void 0);
__decorate([
    (encodeAs.field(3).bytes)
], DataQuery.prototype, "entry", void 0);
__decorate([
    (encodeAs.field(4).reference)
], DataQuery.prototype, "range", void 0);
export class DefaultQuery {
    constructor(args) {
        this.queryType = QueryType.Default;
        this.includeReceipt =
            args.includeReceipt == undefined
                ? undefined
                : args.includeReceipt instanceof ReceiptOptions
                    ? args.includeReceipt
                    : new ReceiptOptions(args.includeReceipt);
    }
    copy() {
        return new DefaultQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "default",
            includeReceipt: this.includeReceipt === undefined ? undefined : this.includeReceipt.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], DefaultQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).reference)
], DefaultQuery.prototype, "includeReceipt", void 0);
export class DelegateSearchQuery {
    constructor(args) {
        this.queryType = QueryType.DelegateSearch;
        this.delegate = args.delegate == undefined ? undefined : URL.parse(args.delegate);
    }
    copy() {
        return new DelegateSearchQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "delegateSearch",
            delegate: this.delegate === undefined ? undefined : this.delegate.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], DelegateSearchQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).url)
], DelegateSearchQuery.prototype, "delegate", void 0);
export class DirectoryQuery {
    constructor(args) {
        this.queryType = QueryType.Directory;
        this.range =
            args.range == undefined
                ? undefined
                : args.range instanceof RangeOptions
                    ? args.range
                    : new RangeOptions(args.range);
    }
    copy() {
        return new DirectoryQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "directory",
            range: this.range === undefined ? undefined : this.range.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], DirectoryQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).reference)
], DirectoryQuery.prototype, "range", void 0);
export class ErrorEvent {
    constructor(args) {
        this.eventType = EventType.Error;
        this.err =
            args.err == undefined
                ? undefined
                : args.err instanceof errors2.Error
                    ? args.err
                    : new errors2.Error(args.err);
    }
    copy() {
        return new ErrorEvent(this.asObject());
    }
    asObject() {
        return {
            eventType: "error",
            err: this.err === undefined ? undefined : this.err.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(EventType))
], ErrorEvent.prototype, "eventType", void 0);
__decorate([
    (encodeAs.field(2).reference)
], ErrorEvent.prototype, "err", void 0);
export class ErrorRecord {
    constructor(args) {
        this.recordType = RecordType.Error;
        this.value =
            args.value == undefined
                ? undefined
                : args.value instanceof errors2.Error
                    ? args.value
                    : new errors2.Error(args.value);
    }
    copy() {
        return new ErrorRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "error",
            value: this.value === undefined ? undefined : this.value.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], ErrorRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).reference)
], ErrorRecord.prototype, "value", void 0);
export class FaucetOptions {
    constructor(args) {
        this.token = args.token == undefined ? undefined : URL.parse(args.token);
    }
    copy() {
        return new FaucetOptions(this.asObject());
    }
    asObject() {
        return {
            token: this.token === undefined ? undefined : this.token.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).url)
], FaucetOptions.prototype, "token", void 0);
export class FindServiceOptions {
    constructor(args) {
        this.network = args.network == undefined ? undefined : args.network;
        this.service =
            args.service == undefined
                ? undefined
                : args.service instanceof ServiceAddress
                    ? args.service
                    : new ServiceAddress(args.service);
        this.known = args.known == undefined ? undefined : args.known;
        this.timeout = args.timeout == undefined ? undefined : args.timeout;
    }
    copy() {
        return new FindServiceOptions(this.asObject());
    }
    asObject() {
        return {
            network: this.network === undefined ? undefined : this.network,
            service: this.service === undefined ? undefined : this.service.asObject(),
            known: this.known === undefined ? undefined : this.known,
            timeout: this.timeout === undefined ? undefined : this.timeout,
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], FindServiceOptions.prototype, "network", void 0);
__decorate([
    (encodeAs.field(2).reference)
], FindServiceOptions.prototype, "service", void 0);
__decorate([
    (encodeAs.field(3).bool)
], FindServiceOptions.prototype, "known", void 0);
__decorate([
    (encodeAs.field(4).duration)
], FindServiceOptions.prototype, "timeout", void 0);
export class FindServiceResult {
    constructor(args) {
        this.peerID = args.peerID == undefined ? undefined : p2p.PeerID.fromObject(args.peerID);
        this.status = args.status == undefined ? undefined : KnownPeerStatus.fromObject(args.status);
        this.addresses =
            args.addresses == undefined
                ? undefined
                : args.addresses.map((v) => (v == undefined ? undefined : p2p.Multiaddr.fromObject(v)));
    }
    copy() {
        return new FindServiceResult(this.asObject());
    }
    asObject() {
        return {
            peerID: this.peerID === undefined ? undefined : this.peerID.asObject(),
            status: this.status === undefined ? undefined : KnownPeerStatus.getName(this.status),
            addresses: this.addresses === undefined
                ? undefined
                : this.addresses?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).union)
], FindServiceResult.prototype, "peerID", void 0);
__decorate([
    (encodeAs.field(2).enum)
], FindServiceResult.prototype, "status", void 0);
__decorate([
    (encodeAs.field(3).repeatable.union)
], FindServiceResult.prototype, "addresses", void 0);
export class GlobalsEvent {
    constructor(args) {
        this.eventType = EventType.Globals;
        this.old =
            args.old == undefined
                ? undefined
                : args.old instanceof core.GlobalValues
                    ? args.old
                    : new core.GlobalValues(args.old);
        this.new =
            args.new == undefined
                ? undefined
                : args.new instanceof core.GlobalValues
                    ? args.new
                    : new core.GlobalValues(args.new);
    }
    copy() {
        return new GlobalsEvent(this.asObject());
    }
    asObject() {
        return {
            eventType: "globals",
            old: this.old === undefined ? undefined : this.old.asObject(),
            new: this.new === undefined ? undefined : this.new.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(EventType))
], GlobalsEvent.prototype, "eventType", void 0);
__decorate([
    (encodeAs.field(2).reference)
], GlobalsEvent.prototype, "old", void 0);
__decorate([
    (encodeAs.field(3).reference)
], GlobalsEvent.prototype, "new", void 0);
export class IndexEntryRecord {
    constructor(args) {
        this.recordType = RecordType.IndexEntry;
        this.value =
            args.value == undefined
                ? undefined
                : args.value instanceof protocol.IndexEntry
                    ? args.value
                    : new protocol.IndexEntry(args.value);
    }
    copy() {
        return new IndexEntryRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "indexEntry",
            value: this.value === undefined ? undefined : this.value.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], IndexEntryRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).reference)
], IndexEntryRecord.prototype, "value", void 0);
export class KeyRecord {
    constructor(args) {
        this.recordType = RecordType.Key;
        this.authority = args.authority == undefined ? undefined : URL.parse(args.authority);
        this.signer = args.signer == undefined ? undefined : URL.parse(args.signer);
        this.version = args.version == undefined ? undefined : args.version;
        this.index = args.index == undefined ? undefined : args.index;
        this.entry =
            args.entry == undefined
                ? undefined
                : args.entry instanceof protocol.KeySpec
                    ? args.entry
                    : new protocol.KeySpec(args.entry);
    }
    copy() {
        return new KeyRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "key",
            authority: this.authority === undefined ? undefined : this.authority.toString(),
            signer: this.signer === undefined ? undefined : this.signer.toString(),
            version: this.version === undefined ? undefined : this.version,
            index: this.index === undefined ? undefined : this.index,
            entry: this.entry === undefined ? undefined : this.entry.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], KeyRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).url)
], KeyRecord.prototype, "authority", void 0);
__decorate([
    (encodeAs.field(3).url)
], KeyRecord.prototype, "signer", void 0);
__decorate([
    (encodeAs.field(4).uint)
], KeyRecord.prototype, "version", void 0);
__decorate([
    (encodeAs.field(5).uint)
], KeyRecord.prototype, "index", void 0);
__decorate([
    (encodeAs.field(6).reference)
], KeyRecord.prototype, "entry", void 0);
export class LastBlock {
    constructor(args) {
        this.height = args.height == undefined ? undefined : args.height;
        this.time =
            args.time == undefined
                ? undefined
                : args.time instanceof Date
                    ? args.time
                    : new Date(args.time);
        this.chainRoot =
            args.chainRoot == undefined
                ? undefined
                : args.chainRoot instanceof Uint8Array
                    ? args.chainRoot
                    : Buffer.from(args.chainRoot, "hex");
        this.stateRoot =
            args.stateRoot == undefined
                ? undefined
                : args.stateRoot instanceof Uint8Array
                    ? args.stateRoot
                    : Buffer.from(args.stateRoot, "hex");
        this.directoryAnchorHeight =
            args.directoryAnchorHeight == undefined ? undefined : args.directoryAnchorHeight;
    }
    copy() {
        return new LastBlock(this.asObject());
    }
    asObject() {
        return {
            height: this.height === undefined ? undefined : this.height,
            time: this.time === undefined ? undefined : this.time,
            chainRoot: this.chainRoot === undefined
                ? undefined
                : this.chainRoot && Buffer.from(this.chainRoot).toString("hex"),
            stateRoot: this.stateRoot === undefined
                ? undefined
                : this.stateRoot && Buffer.from(this.stateRoot).toString("hex"),
            directoryAnchorHeight: this.directoryAnchorHeight === undefined ? undefined : this.directoryAnchorHeight,
        };
    }
}
__decorate([
    (encodeAs.field(1).int)
], LastBlock.prototype, "height", void 0);
__decorate([
    (encodeAs.field(2).time)
], LastBlock.prototype, "time", void 0);
__decorate([
    (encodeAs.field(3).hash)
], LastBlock.prototype, "chainRoot", void 0);
__decorate([
    (encodeAs.field(4).hash)
], LastBlock.prototype, "stateRoot", void 0);
__decorate([
    (encodeAs.field(5).uint)
], LastBlock.prototype, "directoryAnchorHeight", void 0);
export class MajorBlockRecord {
    constructor(args) {
        this.recordType = RecordType.MajorBlock;
        this.index = args.index == undefined ? undefined : args.index;
        this.time =
            args.time == undefined
                ? undefined
                : args.time instanceof Date
                    ? args.time
                    : new Date(args.time);
        this.minorBlocks =
            args.minorBlocks == undefined
                ? undefined
                : args.minorBlocks instanceof (RecordRange)
                    ? args.minorBlocks
                    : new RecordRange(args.minorBlocks);
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new MajorBlockRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "majorBlock",
            index: this.index === undefined ? undefined : this.index,
            time: this.time === undefined ? undefined : this.time,
            minorBlocks: this.minorBlocks === undefined ? undefined : this.minorBlocks.asObject(),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], MajorBlockRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).uint)
], MajorBlockRecord.prototype, "index", void 0);
__decorate([
    (encodeAs.field(3).time)
], MajorBlockRecord.prototype, "time", void 0);
__decorate([
    (encodeAs.field(4).reference)
], MajorBlockRecord.prototype, "minorBlocks", void 0);
__decorate([
    (encodeAs.field(5).time)
], MajorBlockRecord.prototype, "lastBlockTime", void 0);
export class MessageHashSearchQuery {
    constructor(args) {
        this.queryType = QueryType.MessageHashSearch;
        this.hash =
            args.hash == undefined
                ? undefined
                : args.hash instanceof Uint8Array
                    ? args.hash
                    : Buffer.from(args.hash, "hex");
    }
    copy() {
        return new MessageHashSearchQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "messageHashSearch",
            hash: this.hash === undefined ? undefined : this.hash && Buffer.from(this.hash).toString("hex"),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], MessageHashSearchQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).hash)
], MessageHashSearchQuery.prototype, "hash", void 0);
export class MessageRecord {
    constructor(args) {
        this.recordType = RecordType.Message;
        this.id = args.id == undefined ? undefined : TxID.parse(args.id);
        this.message =
            args.message == undefined ? undefined : messaging.Message.fromObject(args.message);
        this.status = args.status == undefined ? undefined : errors2.Status.fromObject(args.status);
        this.error =
            args.error == undefined
                ? undefined
                : args.error instanceof errors2.Error
                    ? args.error
                    : new errors2.Error(args.error);
        this.result =
            args.result == undefined ? undefined : protocol.TransactionResult.fromObject(args.result);
        this.received = args.received == undefined ? undefined : args.received;
        this.produced =
            args.produced == undefined
                ? undefined
                : args.produced instanceof (RecordRange)
                    ? args.produced
                    : new RecordRange(args.produced);
        this.cause =
            args.cause == undefined
                ? undefined
                : args.cause instanceof (RecordRange)
                    ? args.cause
                    : new RecordRange(args.cause);
        this.signatures =
            args.signatures == undefined
                ? undefined
                : args.signatures instanceof (RecordRange)
                    ? args.signatures
                    : new RecordRange(args.signatures);
        this.historical = args.historical == undefined ? undefined : args.historical;
        this.sequence =
            args.sequence == undefined
                ? undefined
                : args.sequence instanceof messaging.SequencedMessage
                    ? args.sequence
                    : new messaging.SequencedMessage(args.sequence);
        this.sourceReceipt =
            args.sourceReceipt == undefined
                ? undefined
                : args.sourceReceipt instanceof merkle.Receipt
                    ? args.sourceReceipt
                    : new merkle.Receipt(args.sourceReceipt);
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new MessageRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "message",
            id: this.id === undefined ? undefined : this.id.toString(),
            message: this.message === undefined ? undefined : this.message.asObject(),
            status: this.status === undefined ? undefined : errors2.Status.getName(this.status),
            error: this.error === undefined ? undefined : this.error.asObject(),
            result: this.result === undefined ? undefined : this.result.asObject(),
            received: this.received === undefined ? undefined : this.received,
            produced: this.produced === undefined ? undefined : this.produced.asObject(),
            cause: this.cause === undefined ? undefined : this.cause.asObject(),
            signatures: this.signatures === undefined ? undefined : this.signatures.asObject(),
            historical: this.historical === undefined ? undefined : this.historical,
            sequence: this.sequence === undefined ? undefined : this.sequence.asObject(),
            sourceReceipt: this.sourceReceipt === undefined ? undefined : this.sourceReceipt.asObject(),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], MessageRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).txid)
], MessageRecord.prototype, "id", void 0);
__decorate([
    (encodeAs.field(3).union)
], MessageRecord.prototype, "message", void 0);
__decorate([
    (encodeAs.field(4).enum)
], MessageRecord.prototype, "status", void 0);
__decorate([
    (encodeAs.field(5).reference)
], MessageRecord.prototype, "error", void 0);
__decorate([
    (encodeAs.field(6).union)
], MessageRecord.prototype, "result", void 0);
__decorate([
    (encodeAs.field(7).uint)
], MessageRecord.prototype, "received", void 0);
__decorate([
    (encodeAs.field(8).reference)
], MessageRecord.prototype, "produced", void 0);
__decorate([
    (encodeAs.field(9).reference)
], MessageRecord.prototype, "cause", void 0);
__decorate([
    (encodeAs.field(10).reference)
], MessageRecord.prototype, "signatures", void 0);
__decorate([
    (encodeAs.field(11).bool)
], MessageRecord.prototype, "historical", void 0);
__decorate([
    (encodeAs.field(12).reference)
], MessageRecord.prototype, "sequence", void 0);
__decorate([
    (encodeAs.field(13).reference)
], MessageRecord.prototype, "sourceReceipt", void 0);
__decorate([
    (encodeAs.field(14).time)
], MessageRecord.prototype, "lastBlockTime", void 0);
export class MinorBlockRecord {
    constructor(args) {
        this.recordType = RecordType.MinorBlock;
        this.index = args.index == undefined ? undefined : args.index;
        this.time =
            args.time == undefined
                ? undefined
                : args.time instanceof Date
                    ? args.time
                    : new Date(args.time);
        this.source = args.source == undefined ? undefined : URL.parse(args.source);
        this.entries =
            args.entries == undefined
                ? undefined
                : args.entries instanceof (RecordRange)
                    ? args.entries
                    : new RecordRange(args.entries);
        this.anchored =
            args.anchored == undefined
                ? undefined
                : args.anchored instanceof (RecordRange)
                    ? args.anchored
                    : new RecordRange(args.anchored);
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new MinorBlockRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "minorBlock",
            index: this.index === undefined ? undefined : this.index,
            time: this.time === undefined ? undefined : this.time,
            source: this.source === undefined ? undefined : this.source.toString(),
            entries: this.entries === undefined ? undefined : this.entries.asObject(),
            anchored: this.anchored === undefined ? undefined : this.anchored.asObject(),
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], MinorBlockRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).uint)
], MinorBlockRecord.prototype, "index", void 0);
__decorate([
    (encodeAs.field(3).time)
], MinorBlockRecord.prototype, "time", void 0);
__decorate([
    (encodeAs.field(4).url)
], MinorBlockRecord.prototype, "source", void 0);
__decorate([
    (encodeAs.field(5).reference)
], MinorBlockRecord.prototype, "entries", void 0);
__decorate([
    (encodeAs.field(6).reference)
], MinorBlockRecord.prototype, "anchored", void 0);
__decorate([
    (encodeAs.field(7).time)
], MinorBlockRecord.prototype, "lastBlockTime", void 0);
export class NetworkStatus {
    constructor(args) {
        this.oracle =
            args.oracle == undefined
                ? undefined
                : args.oracle instanceof protocol.AcmeOracle
                    ? args.oracle
                    : new protocol.AcmeOracle(args.oracle);
        this.globals =
            args.globals == undefined
                ? undefined
                : args.globals instanceof protocol.NetworkGlobals
                    ? args.globals
                    : new protocol.NetworkGlobals(args.globals);
        this.network =
            args.network == undefined
                ? undefined
                : args.network instanceof protocol.NetworkDefinition
                    ? args.network
                    : new protocol.NetworkDefinition(args.network);
        this.routing =
            args.routing == undefined
                ? undefined
                : args.routing instanceof protocol.RoutingTable
                    ? args.routing
                    : new protocol.RoutingTable(args.routing);
        this.executorVersion =
            args.executorVersion == undefined
                ? undefined
                : protocol.ExecutorVersion.fromObject(args.executorVersion);
        this.directoryHeight = args.directoryHeight == undefined ? undefined : args.directoryHeight;
        this.majorBlockHeight = args.majorBlockHeight == undefined ? undefined : args.majorBlockHeight;
        this.bvnExecutorVersions =
            args.bvnExecutorVersions == undefined
                ? undefined
                : args.bvnExecutorVersions.map((v) => v == undefined
                    ? undefined
                    : v instanceof protocol.PartitionExecutorVersion
                        ? v
                        : new protocol.PartitionExecutorVersion(v));
    }
    copy() {
        return new NetworkStatus(this.asObject());
    }
    asObject() {
        return {
            oracle: this.oracle === undefined ? undefined : this.oracle.asObject(),
            globals: this.globals === undefined ? undefined : this.globals.asObject(),
            network: this.network === undefined ? undefined : this.network.asObject(),
            routing: this.routing === undefined ? undefined : this.routing.asObject(),
            executorVersion: this.executorVersion === undefined
                ? undefined
                : protocol.ExecutorVersion.getName(this.executorVersion),
            directoryHeight: this.directoryHeight === undefined ? undefined : this.directoryHeight,
            majorBlockHeight: this.majorBlockHeight === undefined ? undefined : this.majorBlockHeight,
            bvnExecutorVersions: this.bvnExecutorVersions === undefined
                ? undefined
                : this.bvnExecutorVersions?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).reference)
], NetworkStatus.prototype, "oracle", void 0);
__decorate([
    (encodeAs.field(2).reference)
], NetworkStatus.prototype, "globals", void 0);
__decorate([
    (encodeAs.field(3).reference)
], NetworkStatus.prototype, "network", void 0);
__decorate([
    (encodeAs.field(4).reference)
], NetworkStatus.prototype, "routing", void 0);
__decorate([
    (encodeAs.field(5).enum)
], NetworkStatus.prototype, "executorVersion", void 0);
__decorate([
    (encodeAs.field(6).uint)
], NetworkStatus.prototype, "directoryHeight", void 0);
__decorate([
    (encodeAs.field(7).uint)
], NetworkStatus.prototype, "majorBlockHeight", void 0);
__decorate([
    (encodeAs.field(8).repeatable.reference)
], NetworkStatus.prototype, "bvnExecutorVersions", void 0);
export class NetworkStatusOptions {
    constructor(args) {
        this.partition = args.partition == undefined ? undefined : args.partition;
    }
    copy() {
        return new NetworkStatusOptions(this.asObject());
    }
    asObject() {
        return {
            partition: this.partition === undefined ? undefined : this.partition,
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], NetworkStatusOptions.prototype, "partition", void 0);
export class NodeInfo {
    constructor(args) {
        this.peerID = args.peerID == undefined ? undefined : p2p.PeerID.fromObject(args.peerID);
        this.network = args.network == undefined ? undefined : args.network;
        this.services =
            args.services == undefined
                ? undefined
                : args.services.map((v) => v == undefined ? undefined : v instanceof ServiceAddress ? v : new ServiceAddress(v));
        this.version = args.version == undefined ? undefined : args.version;
        this.commit = args.commit == undefined ? undefined : args.commit;
    }
    copy() {
        return new NodeInfo(this.asObject());
    }
    asObject() {
        return {
            peerID: this.peerID === undefined ? undefined : this.peerID.asObject(),
            network: this.network === undefined ? undefined : this.network,
            services: this.services === undefined
                ? undefined
                : this.services?.map((v) => (v == undefined ? undefined : v.asObject())),
            version: this.version === undefined ? undefined : this.version,
            commit: this.commit === undefined ? undefined : this.commit,
        };
    }
}
__decorate([
    (encodeAs.field(1).union)
], NodeInfo.prototype, "peerID", void 0);
__decorate([
    (encodeAs.field(2).string)
], NodeInfo.prototype, "network", void 0);
__decorate([
    (encodeAs.field(3).repeatable.reference)
], NodeInfo.prototype, "services", void 0);
__decorate([
    (encodeAs.field(4).string)
], NodeInfo.prototype, "version", void 0);
__decorate([
    (encodeAs.field(5).string)
], NodeInfo.prototype, "commit", void 0);
export class NodeInfoOptions {
    constructor(args) {
        this.peerID = args.peerID == undefined ? undefined : p2p.PeerID.fromObject(args.peerID);
    }
    copy() {
        return new NodeInfoOptions(this.asObject());
    }
    asObject() {
        return {
            peerID: this.peerID === undefined ? undefined : this.peerID.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).union)
], NodeInfoOptions.prototype, "peerID", void 0);
export class PendingQuery {
    constructor(args) {
        this.queryType = QueryType.Pending;
        this.range =
            args.range == undefined
                ? undefined
                : args.range instanceof RangeOptions
                    ? args.range
                    : new RangeOptions(args.range);
    }
    copy() {
        return new PendingQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "pending",
            range: this.range === undefined ? undefined : this.range.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], PendingQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).reference)
], PendingQuery.prototype, "range", void 0);
export class PublicKeyHashSearchQuery {
    constructor(args) {
        this.queryType = QueryType.PublicKeyHashSearch;
        this.publicKeyHash =
            args.publicKeyHash == undefined
                ? undefined
                : args.publicKeyHash instanceof Uint8Array
                    ? args.publicKeyHash
                    : Buffer.from(args.publicKeyHash, "hex");
    }
    copy() {
        return new PublicKeyHashSearchQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "publicKeyHashSearch",
            publicKeyHash: this.publicKeyHash === undefined
                ? undefined
                : this.publicKeyHash && Buffer.from(this.publicKeyHash).toString("hex"),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], PublicKeyHashSearchQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).bytes)
], PublicKeyHashSearchQuery.prototype, "publicKeyHash", void 0);
export class PublicKeySearchQuery {
    constructor(args) {
        this.queryType = QueryType.PublicKeySearch;
        this.publicKey =
            args.publicKey == undefined
                ? undefined
                : args.publicKey instanceof Uint8Array
                    ? args.publicKey
                    : Buffer.from(args.publicKey, "hex");
        this.type = args.type == undefined ? undefined : protocol.SignatureType.fromObject(args.type);
    }
    copy() {
        return new PublicKeySearchQuery(this.asObject());
    }
    asObject() {
        return {
            queryType: "publicKeySearch",
            publicKey: this.publicKey === undefined
                ? undefined
                : this.publicKey && Buffer.from(this.publicKey).toString("hex"),
            type: this.type === undefined ? undefined : protocol.SignatureType.getName(this.type),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(QueryType))
], PublicKeySearchQuery.prototype, "queryType", void 0);
__decorate([
    (encodeAs.field(2).bytes)
], PublicKeySearchQuery.prototype, "publicKey", void 0);
__decorate([
    (encodeAs.field(3).enum)
], PublicKeySearchQuery.prototype, "type", void 0);
export class RangeOptions {
    constructor(args) {
        this.start = args.start == undefined ? undefined : args.start;
        this.count = args.count == undefined ? undefined : args.count;
        this.expand = args.expand == undefined ? undefined : args.expand;
        this.fromEnd = args.fromEnd == undefined ? undefined : args.fromEnd;
    }
    copy() {
        return new RangeOptions(this.asObject());
    }
    asObject() {
        return {
            start: this.start === undefined ? undefined : this.start,
            count: this.count === undefined ? undefined : this.count,
            expand: this.expand === undefined ? undefined : this.expand,
            fromEnd: this.fromEnd === undefined ? undefined : this.fromEnd,
        };
    }
}
__decorate([
    (encodeAs.field(1).uint)
], RangeOptions.prototype, "start", void 0);
__decorate([
    (encodeAs.field(2).uint)
], RangeOptions.prototype, "count", void 0);
__decorate([
    (encodeAs.field(3).bool)
], RangeOptions.prototype, "expand", void 0);
__decorate([
    (encodeAs.field(4).bool)
], RangeOptions.prototype, "fromEnd", void 0);
export class Receipt {
    constructor(args) {
        this.start =
            args.start == undefined
                ? undefined
                : args.start instanceof Uint8Array
                    ? args.start
                    : Buffer.from(args.start, "hex");
        this.startIndex = args.startIndex == undefined ? undefined : args.startIndex;
        this.end =
            args.end == undefined
                ? undefined
                : args.end instanceof Uint8Array
                    ? args.end
                    : Buffer.from(args.end, "hex");
        this.endIndex = args.endIndex == undefined ? undefined : args.endIndex;
        this.anchor =
            args.anchor == undefined
                ? undefined
                : args.anchor instanceof Uint8Array
                    ? args.anchor
                    : Buffer.from(args.anchor, "hex");
        this.entries =
            args.entries == undefined
                ? undefined
                : args.entries.map((v) => v == undefined
                    ? undefined
                    : v instanceof merkle.ReceiptEntry
                        ? v
                        : new merkle.ReceiptEntry(v));
        this.localBlock = args.localBlock == undefined ? undefined : args.localBlock;
        this.localBlockTime =
            args.localBlockTime == undefined
                ? undefined
                : args.localBlockTime instanceof Date
                    ? args.localBlockTime
                    : new Date(args.localBlockTime);
        this.majorBlock = args.majorBlock == undefined ? undefined : args.majorBlock;
    }
    copy() {
        return new Receipt(this.asObject());
    }
    asObject() {
        return {
            start: this.start === undefined
                ? undefined
                : this.start && Buffer.from(this.start).toString("hex"),
            startIndex: this.startIndex === undefined ? undefined : this.startIndex,
            end: this.end === undefined ? undefined : this.end && Buffer.from(this.end).toString("hex"),
            endIndex: this.endIndex === undefined ? undefined : this.endIndex,
            anchor: this.anchor === undefined
                ? undefined
                : this.anchor && Buffer.from(this.anchor).toString("hex"),
            entries: this.entries === undefined
                ? undefined
                : this.entries?.map((v) => (v == undefined ? undefined : v.asObject())),
            localBlock: this.localBlock === undefined ? undefined : this.localBlock,
            localBlockTime: this.localBlockTime === undefined ? undefined : this.localBlockTime,
            majorBlock: this.majorBlock === undefined ? undefined : this.majorBlock,
        };
    }
}
__decorate([
    (encodeAs.field(1, 1).bytes)
], Receipt.prototype, "start", void 0);
__decorate([
    (encodeAs.field(1, 2).int)
], Receipt.prototype, "startIndex", void 0);
__decorate([
    (encodeAs.field(1, 3).bytes)
], Receipt.prototype, "end", void 0);
__decorate([
    (encodeAs.field(1, 4).int)
], Receipt.prototype, "endIndex", void 0);
__decorate([
    (encodeAs.field(1, 5).bytes)
], Receipt.prototype, "anchor", void 0);
__decorate([
    (encodeAs.field(1, 6).repeatable.reference)
], Receipt.prototype, "entries", void 0);
__decorate([
    (encodeAs.field(2).uint)
], Receipt.prototype, "localBlock", void 0);
__decorate([
    (encodeAs.field(3).time)
], Receipt.prototype, "localBlockTime", void 0);
__decorate([
    (encodeAs.field(4).uint)
], Receipt.prototype, "majorBlock", void 0);
export class ReceiptOptions {
    constructor(args) {
        this.forAny = args.forAny == undefined ? undefined : args.forAny;
        this.forHeight = args.forHeight == undefined ? undefined : args.forHeight;
    }
    copy() {
        return new ReceiptOptions(this.asObject());
    }
    asObject() {
        return {
            forAny: this.forAny === undefined ? undefined : this.forAny,
            forHeight: this.forHeight === undefined ? undefined : this.forHeight,
        };
    }
}
__decorate([
    (encodeAs.field(1).bool)
], ReceiptOptions.prototype, "forAny", void 0);
__decorate([
    (encodeAs.field(2).uint)
], ReceiptOptions.prototype, "forHeight", void 0);
export class RecordRange {
    constructor(args) {
        this.recordType = RecordType.Range;
        this.records =
            args.records == undefined
                ? undefined
                : args.records.map((v) => (v == undefined ? undefined : Record.fromObject(v)));
        this.start = args.start == undefined ? undefined : args.start;
        this.total = args.total == undefined ? undefined : args.total;
        this.lastBlockTime =
            args.lastBlockTime == undefined
                ? undefined
                : args.lastBlockTime instanceof Date
                    ? args.lastBlockTime
                    : new Date(args.lastBlockTime);
    }
    copy() {
        return new RecordRange(this.asObject());
    }
    asObject() {
        return {
            recordType: "range",
            records: this.records === undefined
                ? undefined
                : this.records?.map((v) => (v == undefined ? undefined : v.asObject())),
            start: this.start === undefined ? undefined : this.start,
            total: this.total === undefined ? undefined : this.total,
            lastBlockTime: this.lastBlockTime === undefined ? undefined : this.lastBlockTime,
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], RecordRange.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).repeatable.union)
], RecordRange.prototype, "records", void 0);
__decorate([
    (encodeAs.field(3).keepEmpty.uint)
], RecordRange.prototype, "start", void 0);
__decorate([
    (encodeAs.field(4).keepEmpty.uint)
], RecordRange.prototype, "total", void 0);
__decorate([
    (encodeAs.field(5).time)
], RecordRange.prototype, "lastBlockTime", void 0);
export class ServiceAddress {
    constructor(args) {
        this.type = args.type == undefined ? undefined : args.type;
        this.argument = args.argument == undefined ? undefined : args.argument;
    }
    copy() {
        return new ServiceAddress(this.asObject());
    }
    asObject() {
        return {
            type: this.type === undefined ? undefined : this.type,
            argument: this.argument === undefined ? undefined : this.argument,
        };
    }
}
__decorate([
    (encodeAs.field(1).uint)
], ServiceAddress.prototype, "type", void 0);
__decorate([
    (encodeAs.field(2).string)
], ServiceAddress.prototype, "argument", void 0);
export class SignatureSetRecord {
    constructor(args) {
        this.recordType = RecordType.SignatureSet;
        this.account =
            args.account == undefined ? undefined : protocol.Account.fromObject(args.account);
        this.signatures =
            args.signatures == undefined
                ? undefined
                : args.signatures instanceof (RecordRange)
                    ? args.signatures
                    : new RecordRange(args.signatures);
    }
    copy() {
        return new SignatureSetRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "signatureSet",
            account: this.account === undefined ? undefined : this.account.asObject(),
            signatures: this.signatures === undefined ? undefined : this.signatures.asObject(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], SignatureSetRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).union)
], SignatureSetRecord.prototype, "account", void 0);
__decorate([
    (encodeAs.field(3).reference)
], SignatureSetRecord.prototype, "signatures", void 0);
export class Submission {
    constructor(args) {
        this.status =
            args.status == undefined
                ? undefined
                : args.status instanceof protocol.TransactionStatus
                    ? args.status
                    : new protocol.TransactionStatus(args.status);
        this.success = args.success == undefined ? undefined : args.success;
        this.message = args.message == undefined ? undefined : args.message;
    }
    copy() {
        return new Submission(this.asObject());
    }
    asObject() {
        return {
            status: this.status === undefined ? undefined : this.status.asObject(),
            success: this.success === undefined ? undefined : this.success,
            message: this.message === undefined ? undefined : this.message,
        };
    }
}
__decorate([
    (encodeAs.field(1).reference)
], Submission.prototype, "status", void 0);
__decorate([
    (encodeAs.field(2).bool)
], Submission.prototype, "success", void 0);
__decorate([
    (encodeAs.field(3).string)
], Submission.prototype, "message", void 0);
export class SubmitOptions {
    constructor(args) {
        this.verify = args.verify == undefined ? undefined : args.verify;
        this.wait = args.wait == undefined ? undefined : args.wait;
    }
    copy() {
        return new SubmitOptions(this.asObject());
    }
    asObject() {
        return {
            verify: this.verify === undefined ? undefined : this.verify,
            wait: this.wait === undefined ? undefined : this.wait,
        };
    }
}
__decorate([
    (encodeAs.field(1).bool)
], SubmitOptions.prototype, "verify", void 0);
__decorate([
    (encodeAs.field(2).bool)
], SubmitOptions.prototype, "wait", void 0);
export class SubscribeOptions {
    constructor(args) {
        this.partition = args.partition == undefined ? undefined : args.partition;
        this.account = args.account == undefined ? undefined : URL.parse(args.account);
    }
    copy() {
        return new SubscribeOptions(this.asObject());
    }
    asObject() {
        return {
            partition: this.partition === undefined ? undefined : this.partition,
            account: this.account === undefined ? undefined : this.account.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).string)
], SubscribeOptions.prototype, "partition", void 0);
__decorate([
    (encodeAs.field(2).url)
], SubscribeOptions.prototype, "account", void 0);
export class TxIDRecord {
    constructor(args) {
        this.recordType = RecordType.TxID;
        this.value = args.value == undefined ? undefined : TxID.parse(args.value);
    }
    copy() {
        return new TxIDRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "txID",
            value: this.value === undefined ? undefined : this.value.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], TxIDRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).txid)
], TxIDRecord.prototype, "value", void 0);
export class UrlRecord {
    constructor(args) {
        this.recordType = RecordType.Url;
        this.value = args.value == undefined ? undefined : URL.parse(args.value);
    }
    copy() {
        return new UrlRecord(this.asObject());
    }
    asObject() {
        return {
            recordType: "url",
            value: this.value === undefined ? undefined : this.value.toString(),
        };
    }
}
__decorate([
    (encodeAs.field(1).keepEmpty.enum.of(RecordType))
], UrlRecord.prototype, "recordType", void 0);
__decorate([
    (encodeAs.field(2).url)
], UrlRecord.prototype, "value", void 0);
export class ValidateOptions {
    constructor(args) {
        this.full = args.full == undefined ? undefined : args.full;
    }
    copy() {
        return new ValidateOptions(this.asObject());
    }
    asObject() {
        return {
            full: this.full === undefined ? undefined : this.full,
        };
    }
}
__decorate([
    (encodeAs.field(1).bool)
], ValidateOptions.prototype, "full", void 0);
//# sourceMappingURL=types_gen.js.map