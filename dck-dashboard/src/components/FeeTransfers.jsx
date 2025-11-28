import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Fee wallet address (from your config)
const FEE_WALLET = import.meta.env.VITE_FEE_WALLET || 'FaciyzhG9zvki2uRxUfrhghGnv2aFBHibsSnRHoeqd9y';
const RPC_URL = import.meta.env.VITE_QUICKNODE_HTTP || 'https://ultra-ultra-fog.solana-mainnet.quiknode.pro/48fa88a641cbd2a15f2e0c4f8d9c96c41c70fcf5/';

export function useFeeTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [totalFees, setTotalFees] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeeHistory = async () => {
      try {
        const connection = new Connection(RPC_URL, 'confirmed');
        const pubkey = new PublicKey(FEE_WALLET);
        
        // Get recent signatures
        const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 20 });
        
        const txDetails = await Promise.all(
          signatures.map(async (sig) => {
            try {
              const tx = await connection.getParsedTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0
              });
              
              if (!tx) return null;
              
              // Find transfers to fee wallet
              const preBalance = tx.meta?.preBalances?.[0] || 0;
              const postBalance = tx.meta?.postBalances?.[0] || 0;
              const change = (postBalance - preBalance) / LAMPORTS_PER_SOL;
              
              if (change > 0) {
                return {
                  signature: sig.signature,
                  amount: change,
                  timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
                  slot: sig.slot,
                };
              }
              return null;
            } catch {
              return null;
            }
          })
        );
        
        const validTransfers = txDetails.filter(Boolean);
        setTransfers(validTransfers);
        setTotalFees(validTransfers.reduce((sum, t) => sum + t.amount, 0));
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch fee history:', err);
        setLoading(false);
      }
    };

    fetchFeeHistory();
    const interval = setInterval(fetchFeeHistory, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  return { transfers, totalFees, loading };
}

export default function FeeTransferHistory() {
  const { transfers, totalFees, loading } = useFeeTransfers();

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">💰 Fee Transfers</h3>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">💰 Fee Transfers</h3>
        <div className="text-right">
          <div className="text-xs text-gray-400">Total Collected</div>
          <div className="text-lg font-bold text-green-400">{totalFees.toFixed(4)} SOL</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-2 font-mono truncate">
        Wallet: {FEE_WALLET}
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {transfers.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No fee transfers yet</div>
        ) : (
          transfers.map((tx) => (
            <div 
              key={tx.signature} 
              className="flex items-center justify-between bg-[#252525] rounded p-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-semibold">+{tx.amount.toFixed(4)} SOL</span>
                <a 
                  href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 text-xs"
                >
                  View ↗
                </a>
              </div>
              <span className="text-gray-500 text-xs">
                {new Date(tx.timestamp).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
