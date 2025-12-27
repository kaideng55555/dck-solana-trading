import React, { useState } from 'react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const LAMPORTS_PER_SOL = 1_000_000_000;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Quick snipe button - Uses Jupiter via XME for client-signed swaps
 * @param {{mint: string, amountSol?: number}} props
 */
export default function QuickSnipeButton({ mint, amountSol = 0.01 }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSnipe = async () => {
    if (!mint) return;

    setLoading(true);
    setResult(null);

    try {
      // Get user's wallet
      const wallet = window.solana;
      await wallet.connect({ onlyIfTrusted: false });
      const userPublicKey = wallet.publicKey.toString();

      console.log('💱 Getting swap quote from XME...');

      // Get quote + swap transaction from XME
      const response = await fetch(`${API_URL}/xme/trade/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMint: SOL_MINT,
          outputMint: mint,
          amount: Math.floor(amountSol * LAMPORTS_PER_SOL),
          slippageBps: 50, // 0.5% slippage
          userPublicKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Quote failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.ok || !data.swapTransaction) {
        throw new Error(data.error || 'Failed to get swap transaction');
      }

      console.log('📝 Signing transaction with Phantom...');

      // Deserialize transaction
      const swapTransactionBuf = Buffer.from(data.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Sign transaction with Phantom
      const signedTransaction = await wallet.signTransaction(transaction);

      console.log('📤 Sending signed transaction...');

      // Send transaction
      const txid = await wallet.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      console.log('✅ Transaction sent:', txid);

      setResult({ 
        ok: true,
        signature: txid,
        outAmount: data.quote.outAmount,
      });
      
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      console.error('❌ Snipe failed:', error);
      setResult({ error: error.message || 'Swap failed' });
      setTimeout(() => setResult(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSnipe}
        disabled={loading || !mint}
        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
          loading
            ? 'bg-gray-600 text-gray-400 cursor-wait'
            : 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white hover:from-cyan-400 hover:to-pink-400'
        }`}
      >
        {loading ? '⚡ Sniping...' : `⚡ Snipe ${amountSol} SOL`}
      </button>
      
      {result && (
        <div
          className={`absolute top-full mt-2 right-0 px-3 py-2 rounded text-xs font-mono whitespace-nowrap z-50 ${
            result.error
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-green-500/20 text-green-400 border border-green-500/50'
          }`}
        >
          {result.error ? (
            `❌ ${result.error}`
          ) : (
            <>
              ✅ Sniped! TX: {result.signature?.slice(0, 8)}...
              <a
                href={`https://solscan.io/tx/${result.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 underline hover:text-green-300"
              >
                View →
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

