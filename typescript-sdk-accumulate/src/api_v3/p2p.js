/* eslint-disable @typescript-eslint/no-namespace */
export class PeerID {
    constructor(value) {
        this.value = value;
    }
    asObject() {
        return this.value;
    }
    toString() {
        return this.value;
    }
    static fromObject(value) {
        if (value instanceof PeerID)
            return value;
        return new this(value);
    }
}
export class Multiaddr {
    constructor(value) {
        this.value = value;
    }
    static fromObject(obj) {
        if (obj instanceof Multiaddr) {
            return obj;
        }
        return new Multiaddr(obj);
    }
    asObject() {
        return this.value;
    }
}
//# sourceMappingURL=p2p.js.map