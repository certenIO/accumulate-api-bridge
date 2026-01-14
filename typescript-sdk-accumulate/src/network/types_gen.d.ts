import * as protocol from "../core/index.js";
export type GlobalValuesArgs = {
    oracle?: protocol.AcmeOracle | protocol.AcmeOracleArgs;
    globals?: protocol.NetworkGlobals | protocol.NetworkGlobalsArgs;
    network?: protocol.NetworkDefinition | protocol.NetworkDefinitionArgs;
    routing?: protocol.RoutingTable | protocol.RoutingTableArgs;
    executorVersion?: protocol.ExecutorVersionArgs;
    bvnExecutorVersions?: (protocol.PartitionExecutorVersion | protocol.PartitionExecutorVersionArgs | undefined)[];
};
export declare class GlobalValues {
    oracle?: protocol.AcmeOracle;
    globals?: protocol.NetworkGlobals;
    network?: protocol.NetworkDefinition;
    routing?: protocol.RoutingTable;
    executorVersion?: protocol.ExecutorVersion;
    bvnExecutorVersions?: (protocol.PartitionExecutorVersion | undefined)[];
    constructor(args: GlobalValuesArgs);
    copy(): GlobalValues;
    asObject(): GlobalValuesArgs;
}
