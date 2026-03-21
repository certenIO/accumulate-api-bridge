#!/usr/bin/env node
// Fund a Sui testnet CertenAccountV3 contract wallet using the sponsor account.
//
// This calls the contract's deposit_sui() entry function so the SUI lands
// in the account's internal sui_balance (not just as loose coins).
//
// Usage: node scripts/fund-sui-wallet.mjs [account_object_id] [amount_sui]
//
// Defaults:
//   account:  0xd4cb8a530a82183684ebecc493fe0635fe636574efafa1702dd8d649509a076e
//   amount:   0.05 SUI

import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';

const SPONSOR_PRIVATE_KEY = process.env.SUI_SPONSOR_PRIVATE_KEY
  || 'suiprivkey1qpdvxf3yzluhe9hsh0pcp8xpce8gkemwwcvhgn9xmzcch2qgssfcslsje0l';

const RPC_URL = process.env.SUI_TESTNET_RPC_URL
  || 'https://fullnode.testnet.sui.io:443';

const FACTORY_PACKAGE = process.env.SUI_FACTORY_PACKAGE
  || '0xf9f8f5c8349e04404631531f2420cd45805934839867daa1f4c043ec06b6ade2';

const DEFAULT_ACCOUNT = '0xd4cb8a530a82183684ebecc493fe0635fe636574efafa1702dd8d649509a076e';
const DEFAULT_AMOUNT_SUI = '0.05';

async function main() {
  const accountId = process.argv[2] || DEFAULT_ACCOUNT;
  const amountSui = parseFloat(process.argv[3] || DEFAULT_AMOUNT_SUI);
  const amountMist = BigInt(Math.round(amountSui * 1_000_000_000));

  console.log(`Sui Testnet - Fund CertenAccountV3`);
  console.log(`  Account:  ${accountId}`);
  console.log(`  Amount:   ${amountSui} SUI (${amountMist} MIST)`);
  console.log();

  // Decode sponsor keypair
  const { secretKey } = decodeSuiPrivateKey(SPONSOR_PRIVATE_KEY);
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);
  const sponsorAddress = keypair.getPublicKey().toSuiAddress();
  console.log(`  Sponsor:  ${sponsorAddress}`);

  // Connect to testnet
  const client = new SuiJsonRpcClient({ url: RPC_URL });

  // Check sponsor balance
  const sponsorBalance = await client.getBalance({ owner: sponsorAddress });
  const sponsorSui = Number(sponsorBalance.totalBalance) / 1_000_000_000;
  console.log(`  Sponsor balance: ${sponsorSui.toFixed(4)} SUI`);

  if (BigInt(sponsorBalance.totalBalance) < amountMist + BigInt(10_000_000)) {
    console.error(`ERROR: Sponsor balance too low to send ${amountSui} SUI + gas`);
    process.exit(1);
  }

  // Check contract's internal sui_balance before deposit
  const balanceBefore = await getContractBalance(client, accountId);
  console.log(`  Account sui_balance (before): ${balanceBefore} SUI`);
  console.log();

  // Build transaction: split coin, then call deposit_sui on the contract
  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [amountMist]);
  tx.moveCall({
    target: `${FACTORY_PACKAGE}::certen_account_v3::deposit_sui`,
    arguments: [
      tx.object(accountId),  // account: &mut CertenAccountV3
      coin,                   // coin: Coin<SUI>
    ],
  });

  // Sign and execute
  console.log(`Depositing ${amountSui} SUI via deposit_sui()...`);
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });

  const digest = result.digest;
  console.log(`  TX digest: ${digest}`);

  // Wait for finalization
  await client.waitForTransaction({ digest });
  console.log(`  Finalized!`);

  // Check contract's internal sui_balance after deposit
  const balanceAfter = await getContractBalance(client, accountId);
  console.log(`  Account sui_balance (after): ${balanceAfter} SUI`);
  console.log();
  console.log(`Done. Explorer: https://suiscan.xyz/testnet/tx/${digest}`);
}

async function getContractBalance(client, accountId) {
  try {
    const tx = new Transaction();
    tx.moveCall({
      target: `${FACTORY_PACKAGE}::certen_account_v3::get_balance`,
      arguments: [tx.object(accountId)],
    });
    const result = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });
    if (result.results?.[0]?.returnValues?.[0]) {
      const bytes = result.results[0].returnValues[0][0];
      // u64 little-endian
      const buf = Buffer.from(bytes);
      const mist = buf.readBigUInt64LE(0);
      return (Number(mist) / 1_000_000_000).toFixed(4);
    }
  } catch {
    // Fall back to reading object content
    try {
      const obj = await client.getObject({ id: accountId, options: { showContent: true } });
      const suiBalance = obj.data?.content?.fields?.sui_balance || '0';
      return (Number(suiBalance) / 1_000_000_000).toFixed(4);
    } catch {
      return 'unknown';
    }
  }
  return 'unknown';
}

main().catch((err) => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});
