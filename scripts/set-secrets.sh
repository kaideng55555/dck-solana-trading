import React, { useState } from 'react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const LAMPORTS_PER_SOL = 1_000_000_000;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const BIRDEYE_API_KEY = import.meta.env.VITE_BIRDEYE_API_KEY;echo ""
o "⚠️  Replace placeholder values with your actual credentials!"
/**
 * Quick snipe button - Uses Jupiter via XME for client-signed swaps
 * @param {{mint: string, amountSol?: number}} propserver configuration
 */
export default function QuickSnipeButton({ mint, amountSol = 0.01 }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSnipe = async () => {path:"
    if (!mint) return;echo "  1) ~/.ssh/id_ed25519 (recommended)"
rsa"
    setLoading(true);th"
    setResult(null);read -p "Choice [1]: " KEY_CHOICE
E=${KEY_CHOICE:-1}
    try {
      // Get user's wallet
      const wallet = window.solana;
      await wallet.connect({ onlyIfTrusted: false });
      const userPublicKey = wallet.publicKey.toString();    SSH_KEY_PATH="$HOME/.ssh/id_rsa"
 3072 bits for security."
      console.log('💱 Getting swap quote from XME...');    ;;

      // Get quote + swap transaction from XME
      const response = await fetch(`${API_URL}/xme/trade/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },$SSH_KEY_PATH"
        body: JSON.stringify({
          inputMint: SOL_MINT,
          outputMint: mint,
          amount: Math.floor(amountSol * LAMPORTS_PER_SOL),/api]: " DEPLOY_PATH_API
          slippageBps: 50, // 0.5% slippage_PATH_API:-/opt/dcktoken/api}
          userPublicKey,
        }),QuickNode HTTP URL: " QUICKNODE_HTTP
      });read -p "QuickNode WSS URL: " QUICKNODE_WSS

      if (!response.ok) {" SLACK_WEBHOOK_URL
        throw new Error(`Quote failed: ${response.status}`);
      }echo ""

      const data = await response.json();
      OY_HOST"
      if (!data.ok || !data.swapTransaction) {
        throw new Error(data.error || 'Failed to get swap transaction');et set SSH_PRIVATE_KEY -R "$REPO" -b "$(cat $SSH_KEY_PATH)"
      }gh secret set DEPLOY_PATH_API -R "$REPO" -b "$DEPLOY_PATH_API"

      console.log('📝 Signing transaction with Phantom...');gh secret set QUICKNODE_WSS -R "$REPO" -b "$QUICKNODE_WSS"

      // Deserialize transaction
      const swapTransactionBuf = Buffer.from(data.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);fi

      // Sign transaction with Phantom
      const signedTransaction = await wallet.signTransaction(transaction);echo "✅ Secrets configured!"

      console.log('📤 Sending signed transaction...');echo "📋 Configured secrets:"

      // Send transaction
      const txid = await wallet.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,. Prepare server: ssh $DEPLOY_USER@$DEPLOY_HOST 'sudo mkdir -p $DEPLOY_PATH_API'"
      });echo "  2. Trigger deploy: gh workflow run deploy-api-pm2.yml -R $REPO --ref main"
O"
      console.log('✅ Transaction sent:', txid);
NzaC1lZDI1NTE5AAAAIKa9GuINAXtNKm1lT/6yHqgAF51koOWXVl+LPRx+9qR6 kaideng55555@github.com
      setResult({         ok: true,        signature: txid,        outAmount: data.quote.outAmount,      });            setTimeout(() => setResult(null), 5000);    } catch (error) {      console.error('❌ Snipe failed:', error);      setResult({ error: error.message || 'Swap failed' });      setTimeout(() => setResult(null), 5000);    } finally {      setLoading(false);    }  };  return (    <div className="relative">      <button        onClick={handleSnipe}        disabled={loading || !mint}        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${          loading            ? 'bg-gray-600 text-gray-400 cursor-wait'            : 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white hover:from-cyan-400 hover:to-pink-400'        }`}      >        {loading ? '⚡ Sniping...' : `⚡ Snipe ${amountSol} SOL`}      </button>            {result && (        <div          className={`absolute top-full mt-2 right-0 px-3 py-2 rounded text-xs font-mono whitespace-nowrap z-50 ${            result.error              ? 'bg-red-500/20 text-red-400 border border-red-500/50'              : 'bg-green-500/20 text-green-400 border border-green-500/50'          }`}        >          {result.error ? (            `❌ ${result.error}`          ) : (            <>              ✅ Sniped! TX: {result.signature?.slice(0, 8)}...              <a                href={`https://solscan.io/tx/${result.signature}`}                target="_blank"                rel="noopener noreferrer"                className="ml-2 underline hover:text-green-300"              >                View →              </a>            </>          )}        </div>      )}    </div>  );}
