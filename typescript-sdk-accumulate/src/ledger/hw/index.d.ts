import type Transport from "@ledgerhq/hw-transport";
import type { Observable } from "rxjs";
/**
 * @type Discovery
 * {@link Discovery}
 */
export type Discovery = Observable<{
    type: "add" | "remove";
    id: string;
    name: string;
}>;
/**
 * @type TransportModule
 * {@link TransportModule}
 */
export type TransportModule = {
    id: string;
    open: (id: string) => Promise<Transport> | null | undefined;
    close?: (transport: Transport, id: string) => Promise<void> | null | undefined;
    disconnect: (id: string) => Promise<void> | null | undefined;
    setAllowAutoDisconnect?: (transport: Transport, id: string, allow: boolean) => Promise<void> | null | undefined;
    discovery?: Discovery;
};
export declare const registerTransportModule: (module: TransportModule) => void;
/**
 * @type discoverDevices
 * {@link discoverDevices}
 */
export declare const discoverDevices: (accept?: (mod: TransportModule) => boolean) => Discovery;
export declare const open: (deviceId: string) => Promise<Transport>;
export declare const close: (transport: Transport, deviceId: string) => Promise<void>;
export declare const setAllowAutoDisconnect: (transport: Transport, deviceId: string, allow: boolean) => Promise<void> | null | undefined;
export declare const disconnect: (deviceId: string) => Promise<void>;
