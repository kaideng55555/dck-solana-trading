import {
  Connection,
  clusterApiUrl,
  Keypair,
  PublicKey
} from "@solana/web3.js";

import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer
} from "@solana/spl-token";

import fs from "fs";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// 👉 Replace with your actual fee wallet address
const FEE_WALLET = new PublicKey("6MmJ9bAR2nrZQB3kdForaNirMuupPXpovJB3X8jzK29K");

function saveKeypair(keypair, filename = "wallet.json") {
  fs.writeFileSync(filename, JSON.stringify(Array.from(keypair.secretKey)));
  console.log(`✅ Keypair saved to ${filename}`);
}

function generateKeypair() {
  const keypair = Keypair.generate();
  console.log("📦 Wallet Address:", keypair.publicKey.toBase58());
  saveKeypair(keypair);
}

async function createToken(name, symbol, decimals, supply, secretKeyString) {
  const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKeyString)));

  const mint = await createMint(connection, payer, payer.publicKey, null, parseInt(decimals));
  console.log(`✅ Token Mint Created: ${mint.toBase58()}`);

  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  const feeAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, FEE_WALLET);

  const fullAmount = parseInt(supply) * 10 ** parseInt(decimals);
  const feeAmount = Math.floor(fullAmount * 0.05);
  const userAmount = fullAmount - feeAmount;

  await mintTo(connection, payer, mint, tokenAccount.address, payer, fullAmount);
  console.log(`✅ Minted ${supply} ${symbol} tokens to ${tokenAccount.address.toBase58()}`);

  await transfer(connection, payer, tokenAccount.address, feeAccount.address, payer, feeAmount);
  console.log(`✅ Sent ${feeAmount / 10 ** decimals} tokens to fee wallet: ${FEE_WALLET.toBase58()}`);
}

// CLI Handling
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  switch (command) {
    case "generate-keypair":
      generateKeypair();
      break;

    case "create":
      if (args.length < 6) {
        console.log("❌ Usage:");
        console.log('   node mint-token.js create "Token Name" "SYMBOL" 6 1000000 "[PRIVATE_KEY_JSON]"');
        process.exit(1);
      }
      const [_, name, symbol, decimals, supply, secretKeyJSON] = args;
      await createToken(name, symbol, decimals, supply, secretKeyJSON);
      break;

    default:
      console.log("❌ Unknown command.");
      console.log("Try:");
      console.log("   node mint-token.js generate-keypair");
      console.log('   node mint-token.js create "Token Name" "SYMBOL" 6 1000000 "[PRIVATE_KEY_JSON]"');
  }
})();
VITE_QUICKNODE_HTTP=https://solana-mainnet.quiknode.pro/your-actual-key