/**
 * CERTEN API Bridge - Credential Generator for Kermit Testnet
 *
 * This script generates all required credentials and funds them using the Kermit faucet.
 * Run with: npx ts-node --esm scripts/generate-credentials.ts
 */

import { api_v3, ED25519Key, Signer, TxID, URLArgs } from "accumulate.js";
import { MessageRecord, RpcError } from "accumulate.js/api_v3";
import { Transaction } from "accumulate.js/core";
import { Error as Error2, Status } from "accumulate.js/errors";
import * as fs from 'fs';
import * as path from 'path';

// Kermit testnet endpoint
const KERMIT_ENDPOINT = "http://206.191.154.164/v3";
const client = new api_v3.JsonRpcClient(KERMIT_ENDPOINT);

const waitTime = 1000;
const waitLimit = 120000 / waitTime;

interface GeneratedCredentials {
  // Primary Lite Identity (for paying fees)
  ACCUM_PRIV_KEY: string;
  ACCUM_PUBLIC_KEY: string;
  ACCUM_PUBLIC_KEY_HASH: string;
  ACCUM_LTA: string;
  ACCUM_LID: string;

  // Network config
  ACCUM_ENDPOINT: string;
  ACCUM_ENDPOINT_V2: string;

  // Balances
  acmeBalance: number;
  creditsBalance: number;
}

async function generateCredentials(): Promise<GeneratedCredentials> {
  console.log("=== CERTEN API Bridge Credential Generator ===\n");
  console.log(`Network: Kermit Testnet (${KERMIT_ENDPOINT})\n`);

  // Step 1: Generate primary key pair
  console.log("Step 1: Generating ED25519 key pair...\n");

  const key = ED25519Key.generate();
  const lid = Signer.forLite(key);
  const lta = lid.url.join("ACME");

  const privateKeyHex = Buffer.from(key.address.privateKey).toString('hex');
  const publicKeyHex = Buffer.from(key.address.publicKey).toString('hex');
  const publicKeyHashHex = Buffer.from(key.address.publicKeyHash).toString('hex');

  console.log("Key Information:");
  console.log("-".repeat(70));
  console.log(`Public Key:      ${publicKeyHex}`);
  console.log(`Private Key:     ${privateKeyHex.substring(0, 20)}...${privateKeyHex.substring(privateKeyHex.length - 20)}`);
  console.log(`Public Key Hash: ${publicKeyHashHex}`);
  console.log(`LID URL:         ${lid.url.toString()}`);
  console.log(`LTA URL:         ${lta.toString()}`);
  console.log("-".repeat(70));
  console.log();

  // Step 2: Fund LTA with ACME using faucet (30 calls for ~3000 ACME)
  console.log("Step 2: Funding LTA with ACME (30 faucet calls)...\n");

  const targetFaucetCalls = 30;
  let successfulFaucetCalls = 0;

  for (let i = 0; i < targetFaucetCalls; i++) {
    try {
      process.stdout.write(`Faucet call ${i + 1}/${targetFaucetCalls}... `);
      const res = await client.faucet(lta);

      if (res.status && res.status.txID) {
        await waitForTransaction(res.status.txID, false);
        successfulFaucetCalls++;
        console.log("OK");
      } else {
        console.log("No txID");
      }

      // Small delay between faucet calls
      if (i < targetFaucetCalls - 1) {
        await sleep(1500);
      }
    } catch (error: any) {
      console.log(`FAILED: ${error.message || error}`);
      // Continue with remaining calls
    }
  }

  console.log(`\nFaucet Summary: ${successfulFaucetCalls}/${targetFaucetCalls} calls successful\n`);

  // Step 3: Wait for account creation and check balance
  console.log("Step 3: Waiting for account creation...\n");
  await sleep(5000);

  let acmeBalance = 0;
  for (let i = 0; i < 15; i++) {
    try {
      const balanceQuery = await client.query(lta);
      acmeBalance = (balanceQuery as any).account?.balance || 0;
      console.log(`Balance check ${i + 1}: ${acmeBalance} ACME tokens`);

      if (acmeBalance > 0) {
        console.log(`Account funded successfully!\n`);
        break;
      }
    } catch (error) {
      console.log(`Account not yet available, retrying... (${i + 1}/15)`);
    }
    await sleep(3000);
  }

  if (acmeBalance === 0) {
    throw new Error("Failed to fund account - no ACME balance after faucet calls");
  }

  // Step 4: Purchase credits for LID (1,000,000 credits)
  console.log("Step 4: Purchasing 1,000,000 credits for LID...\n");

  await sleep(5000); // Wait for balance to settle

  const { oracle } = await client.networkStatus();
  const targetCredits = 1000000; // 1 million credits
  const creditsAmount = ((targetCredits * 10 ** 2) / oracle!.price!) * 10 ** 8;

  console.log(`Oracle price: ${oracle!.price!}`);
  console.log(`Purchasing ${targetCredits} credits...\n`);

  const txn = new Transaction({
    header: {
      principal: lta,
    },
    body: {
      type: "addCredits",
      recipient: lid.url,
      amount: creditsAmount,
      oracle: oracle!.price!,
    },
  });

  const sig = await lid.sign(txn, { timestamp: Date.now() * 1000 });
  const submitRes = await client.submit({ transaction: [txn], signatures: [sig] });

  for (const r of submitRes) {
    if (!r.success) {
      throw new Error(`Credits purchase failed: ${r.message}`);
    }
    if (r.status?.txID) {
      await waitForTransaction(r.status.txID, true);
    }
  }

  // Verify credits
  await sleep(3000);
  let creditsBalance = 0;
  try {
    const creditsQuery = await client.query(lid.url);
    creditsBalance = (creditsQuery as any).account?.creditBalance || 0;
    console.log(`\nLID Credits: ${creditsBalance} credits`);
  } catch (error) {
    console.log("Could not verify credits balance");
  }

  // Check final ACME balance
  try {
    const finalBalanceQuery = await client.query(lta);
    acmeBalance = (finalBalanceQuery as any).account?.balance || 0;
    console.log(`LTA ACME Balance: ${acmeBalance} tokens\n`);
  } catch (error) {
    console.log("Could not verify final ACME balance");
  }

  const credentials: GeneratedCredentials = {
    ACCUM_PRIV_KEY: privateKeyHex,
    ACCUM_PUBLIC_KEY: publicKeyHex,
    ACCUM_PUBLIC_KEY_HASH: publicKeyHashHex,
    ACCUM_LTA: lta.toString(),
    ACCUM_LID: lid.url.toString(),
    ACCUM_ENDPOINT: KERMIT_ENDPOINT,
    ACCUM_ENDPOINT_V2: KERMIT_ENDPOINT.replace('/v3', '/v2'),
    acmeBalance,
    creditsBalance,
  };

  return credentials;
}

async function waitForTransaction(txid: TxID | URLArgs, verbose: boolean = true) {
  if (verbose) {
    console.log(`Waiting for transaction ${txid}...`);
  }

  for (let i = 0; i < waitLimit; i++) {
    try {
      const r = (await client.query(txid)) as MessageRecord;
      const status = r.status;

      if (status && (status === Status.Delivered || (status as any) === 201 || (status as any).code === "delivered")) {
        if (verbose) {
          console.log(`Transaction completed successfully`);
        }
        return r;
      }

      await sleep(waitTime);
    } catch (error: any) {
      const err2 = isClientError(error);
      if (err2.code === Status.NotFound) {
        await sleep(waitTime);
        continue;
      }
      throw new Error(`Transaction failed: ${err2.message}`);
    }
  }

  throw new Error(`Transaction still pending after ${(waitTime * waitLimit) / 1000} seconds`);
}

function isClientError(error: any) {
  if (!(error instanceof RpcError)) throw error;
  if (error.code > -33000) throw error;

  let err2;
  try {
    err2 = new Error2(error.data);
  } catch (_) {
    throw error;
  }
  if (err2.code && err2.code >= 500) {
    throw err2;
  }
  return err2;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateEnvFile(credentials: GeneratedCredentials): string {
  return `# CERTEN API Bridge - Generated Credentials for Kermit Testnet
# Generated: ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# =============================================================================
# NETWORK CONFIGURATION (Kermit Testnet)
# =============================================================================
ACCUM_ENDPOINT=${credentials.ACCUM_ENDPOINT}
ACCUM_ENDPOINT_V2=${credentials.ACCUM_ENDPOINT_V2}

# =============================================================================
# ACCUMULATE CREDENTIALS
# =============================================================================
ACCUM_PUBLIC_KEY=${credentials.ACCUM_PUBLIC_KEY}
ACCUM_PRIV_KEY=${credentials.ACCUM_PRIV_KEY}
ACCUM_PUBLIC_KEY_HASH=${credentials.ACCUM_PUBLIC_KEY_HASH}

# Lite Token Account (holds ACME for fees)
ACCUM_LTA=${credentials.ACCUM_LTA}

# Lite Identity (for signing transactions)
ACCUM_LID=${credentials.ACCUM_LID}

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=8085
CORS_ORIGINS=http://localhost:3001,http://localhost:3000,https://certen-web.web.app

# =============================================================================
# BALANCES AT GENERATION TIME
# =============================================================================
# ACME Balance: ${credentials.acmeBalance} tokens
# Credits Balance: ${credentials.creditsBalance} credits

# =============================================================================
# OPTIONAL SETTINGS
# =============================================================================
LOG_LEVEL=debug
DEBUG_TRANSACTIONS=true
`;
}

// Main execution
async function main() {
  try {
    const credentials = await generateCredentials();

    // Generate .env file content
    const envContent = generateEnvFile(credentials);

    // Write .env file
    const envPath = path.resolve(process.cwd(), '.env');
    fs.writeFileSync(envPath, envContent);
    console.log(`\n.env file written to: ${envPath}`);

    // Also write credentials to a JSON file for backup
    const credentialsPath = path.resolve(process.cwd(), 'data', 'credentials.json');
    fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    console.log(`Credentials backup written to: ${credentialsPath}`);

    console.log("\n=== Credential Generation Complete ===");
    console.log("\nSummary:");
    console.log("-".repeat(50));
    console.log(`LID:     ${credentials.ACCUM_LID}`);
    console.log(`LTA:     ${credentials.ACCUM_LTA}`);
    console.log(`ACME:    ${credentials.acmeBalance} tokens`);
    console.log(`Credits: ${credentials.creditsBalance} credits`);
    console.log("-".repeat(50));
    console.log("\nYou can now start the API bridge with: npm start");

  } catch (error) {
    console.error("\nCredential generation failed:", error);
    process.exit(1);
  }
}

main();
