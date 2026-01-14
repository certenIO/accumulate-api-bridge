/**
 * Returns a SHA-256 hasher.
 */
export declare function sha256(): {
    add(data: Uint8Array): void;
    digest(): Uint8Array;
};
/**
 * Returns the SHA-256 hash of the input data.
 */
export declare function sha256(data: Uint8Array): Uint8Array;
/**
 * HMAC-SHA256 implementation.
 */
export declare function hmac_sha256(key: Uint8Array, message: Uint8Array): Uint8Array;
