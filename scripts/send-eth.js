/**
 * Send ETH from sponsor wallet to abstract account
 */
import { ethers } from 'ethers';

async function main() {
  // Configuration from .env
  const RPC_URL = 'https://sepolia.infura.io/v3/134d77bd32a6425daa26c797b2f8b64a';
  const PRIVATE_KEY = '0xe449fdd03d6acf9df4b605c49f984334c4166080212e69e688c45f9c8084e0bc';
  const FROM_ADDRESS = '0x32422604b797f0a135d8F28B84Ce72EefA185FC8';
  const TO_ADDRESS = '0x6e534F011cfE4ff88A7529fc8002520b9F46C1f2';
  const AMOUNT_ETH = '0.1';

  console.log('='.repeat(60));
  console.log('ETH Transfer Script');
  console.log('='.repeat(60));
  console.log(`From: ${FROM_ADDRESS}`);
  console.log(`To:   ${TO_ADDRESS}`);
  console.log(`Amount: ${AMOUNT_ETH} ETH`);
  console.log('='.repeat(60));

  // Connect to Sepolia
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Check balances before
  const balanceBefore = await provider.getBalance(FROM_ADDRESS);
  console.log(`\nSponsor balance before: ${ethers.formatEther(balanceBefore)} ETH`);

  const targetBalanceBefore = await provider.getBalance(TO_ADDRESS);
  console.log(`Abstract account balance before: ${ethers.formatEther(targetBalanceBefore)} ETH`);

  // Check if we have enough
  const amountWei = ethers.parseEther(AMOUNT_ETH);
  if (balanceBefore < amountWei) {
    console.error(`\n❌ Insufficient balance! Have ${ethers.formatEther(balanceBefore)} ETH, need ${AMOUNT_ETH} ETH`);
    process.exit(1);
  }

  // Send transaction
  console.log(`\nSending ${AMOUNT_ETH} ETH...`);

  const tx = await wallet.sendTransaction({
    to: TO_ADDRESS,
    value: amountWei,
  });

  console.log(`Transaction hash: ${tx.hash}`);
  console.log('Waiting for confirmation...');

  const receipt = await tx.wait();
  console.log(`\n✅ Transaction confirmed in block ${receipt.blockNumber}`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);

  // Check balances after
  const balanceAfter = await provider.getBalance(FROM_ADDRESS);
  console.log(`\nSponsor balance after: ${ethers.formatEther(balanceAfter)} ETH`);

  const targetBalanceAfter = await provider.getBalance(TO_ADDRESS);
  console.log(`Abstract account balance after: ${ethers.formatEther(targetBalanceAfter)} ETH`);

  console.log('\n' + '='.repeat(60));
  console.log('Transfer complete!');
  console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
