export default API;
export async function discoverDevices(accept = () => true) {
    const { discoverDevices } = await import("./index");
    return discoverDevices(accept);
}
export async function registerTransportModule(module) {
    const { registerTransportModule } = await import("./index");
    return registerTransportModule(module);
}
export async function API(transport) {
    const { LedgerApi } = await import("./index");
    return new LedgerApi(transport);
}
export async function queryHidWallets() {
    const { queryHidWallets } = await import("./index");
    return queryHidWallets();
}
export async function loadLedgerKey(api, path) {
    const { LedgerKey } = await import("./index");
    return LedgerKey.load(api, path);
}
//# sourceMappingURL=deferred.js.map