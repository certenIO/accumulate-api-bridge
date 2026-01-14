var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as protocol from "../core/index.js";
import { encodeAs } from "../encoding/index.js";
export class GlobalValues {
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
        return new GlobalValues(this.asObject());
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
            bvnExecutorVersions: this.bvnExecutorVersions === undefined
                ? undefined
                : this.bvnExecutorVersions?.map((v) => (v == undefined ? undefined : v.asObject())),
        };
    }
}
__decorate([
    (encodeAs.field(1).reference)
], GlobalValues.prototype, "oracle", void 0);
__decorate([
    (encodeAs.field(2).reference)
], GlobalValues.prototype, "globals", void 0);
__decorate([
    (encodeAs.field(3).reference)
], GlobalValues.prototype, "network", void 0);
__decorate([
    (encodeAs.field(4).reference)
], GlobalValues.prototype, "routing", void 0);
__decorate([
    (encodeAs.field(5).enum)
], GlobalValues.prototype, "executorVersion", void 0);
__decorate([
    (encodeAs.field(6).repeatable.reference)
], GlobalValues.prototype, "bvnExecutorVersions", void 0);
//# sourceMappingURL=types_gen.js.map