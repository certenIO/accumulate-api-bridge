import { EMPTY, merge } from "rxjs";
import { catchError } from "rxjs/operators";
const modules = [];
export const registerTransportModule = (module) => {
    modules.push(module);
};
/**
 * @type discoverDevices
 * {@link discoverDevices}
 */
export const discoverDevices = (accept = () => true) => {
    const all = [];
    for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        if (m.discovery && accept(m)) {
            all.push(m.discovery);
        }
    }
    return merge(...all.map((o) => o.pipe(catchError((e) => {
        console.warn(`One Transport provider failed: ${e}`);
        return EMPTY;
    }))));
};
export const open = (deviceId) => {
    for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const p = m.open(deviceId);
        if (p)
            return p;
    }
    return Promise.reject(new Error(`Can't find handler to open ${deviceId}`));
};
export const close = (transport, deviceId) => {
    for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const p = m.close && m.close(transport, deviceId);
        if (p)
            return p;
    }
    // fallback on an actual close
    return transport.close();
};
export const setAllowAutoDisconnect = (transport, deviceId, allow) => {
    for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const p = m.setAllowAutoDisconnect && m.setAllowAutoDisconnect(transport, deviceId, allow);
        if (p)
            return p;
    }
    return null;
};
export const disconnect = (deviceId) => {
    for (let i = 0; i < modules.length; i++) {
        const dis = modules[i].disconnect;
        const p = dis(deviceId);
        if (p) {
            return p;
        }
    }
    return Promise.reject(new Error(`Can't find handler to disconnect ${deviceId}`));
};
//# sourceMappingURL=index.js.map