import { URL } from "../address/index.js";
import { Client } from "../api_v2/index.js";
import { CreateToken } from "../core/index.js";
import { Receipt } from "../merkle/index.js";
export declare function constructIssuerProof(client: Client, issuer: string | URL): Promise<{
    receipt: Receipt;
    transaction: CreateToken;
}>;
