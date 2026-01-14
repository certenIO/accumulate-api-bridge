export type PeerIDArgs = string;
export declare class PeerID {
    private readonly value;
    constructor(value: string);
    asObject(): string;
    toString(): string;
    static fromObject(value: string | PeerID): PeerID;
}
export type MultiaddrArgs = string | Multiaddr;
export declare class Multiaddr {
    readonly value: string;
    constructor(value: string);
    static fromObject(obj: MultiaddrArgs): Multiaddr;
    asObject(): string;
}
