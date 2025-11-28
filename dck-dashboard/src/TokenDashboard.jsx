import React, { useEffect, useState } from 'react';
import TokenChart from './components/TokenChart';
import LivePriceDisplay from './components/LivePrice';
import RealTimeMints from './components/RealTimeMints';
import FeeTransferHistory from './components/FeeTransfers';

// Example token mint (replace with your actual token)
const TOKEN_MINT = '5e9hKLBwE5iA5Dnujcv7iHYjqU15YEnjB6HXQZnoqbMK';

export default function TokenDashboard() {
  const [mintEvents, setMintEvents] = useState([]);

  // TODO: Replace with real on-chain fetch or webhook later
  useEffect(() => {
    setMintEvents([
      { time: "Today", amount: "1M", fee: "50K" },
      { time: "Yesterday", amount: "500K", fee: "25K" }
    ]);
  }, []);

  return (
    <div className="p-6 text-white bg-[#121212] min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-pink-500">💎 DCK Token Dashboard</h1>
      
      {/* Live Price Section */}
      <div className="mb-6">
        <LivePriceDisplay tokenMint={TOKEN_MINT} symbol="DIA" />
      </div>

      <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded mb-4">
        Connect Wallet (Coming Soon)
      </button>
      
      {/* Chart */}
      <TokenChart />
      
      {/* Grid for Real-Time Mints and Fee Transfers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <RealTimeMints />
        <FeeTransferHistory />
      </div>
      
      {/* Legacy mint events */}
      <div className="mt-6">
        <h2 className="text-xl mb-2">Recent Mints (Legacy)</h2>
        <ul className="list-disc ml-4">
          {mintEvents.map((e, i) => (
            <li key={i}>{e.time}: Minted {e.amount} — Fee {e.fee}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
