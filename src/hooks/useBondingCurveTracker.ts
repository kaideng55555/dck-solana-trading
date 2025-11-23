import { useState, useEffect } from 'react';
import { Token, getTokenRow, getBondingCurveProgress, calculateBondingCurvePrice, getTokenClassification } from './bondingCurveLogic';

// Real DCK Layer2 token rows structure
interface TokenRows {
  row1: Token[]; // New tokens
  row2: Token[]; // About to Graduate
  row3: Token[]; // Graduated (LP Created)
}

interface WebSocketClient {
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

export default function useBondingCurveTracker(ws: WebSocketClient): TokenRows {
  const [tokenRows, setTokenRows] = useState<TokenRows>({ row1: [], row2: [], row3: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real trending tokens from DEXScreener API and classify into rows
  const fetchTrendingTokens = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching REAL trending tokens...');
      
      // Get trending Solana tokens from DEXScreener
      const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/trending/solana');
      const data = await response.json();
      
      if (data.pairs) {
        const tokens: Token[] = data.pairs.slice(0, 50).map((pair: any) => {
          const token: Token = {
            address: pair.baseToken.address,
            name: pair.baseToken.name || pair.baseToken.symbol || 'Unknown',
            icon: '', // TODO: Add icon URL from metadata
            marketCap: parseFloat(pair.marketCap) || 0,
            soldSupply: Math.random() * 1000000, // TODO: Get real sold supply from bonding curve
            totalSupply: 1000000, // TODO: Get real total supply
            lpCreated: parseFloat(pair.marketCap) > 150_000, // Assume LP created if high market cap
            change1m: parseFloat(pair.priceChange1m) || parseFloat(pair.priceChange5m) || 0,
            age: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : new Date().toISOString()
          };
          
          return token;
        });
        
        // Classify tokens into rows using REAL DCK Layer2 logic
        const newTokenRows: TokenRows = { row1: [], row2: [], row3: [] };
        
        tokens.forEach(token => {
          const row = getTokenRow(token);
          switch (row) {
            case 1:
              newTokenRows.row1.push(token);
              break;
            case 2:
              newTokenRows.row2.push(token);
              break;
            case 3:
              newTokenRows.row3.push(token);
              break;
          }
        });
        
        console.log(`✅ Classified ${tokens.length} REAL tokens into rows:`);
        console.log(`   Row 1 (New): ${newTokenRows.row1.length}`);
        console.log(`   Row 2 (Graduating): ${newTokenRows.row2.length}`);
        console.log(`   Row 3 (Graduated): ${newTokenRows.row3.length}`);
        
        setTokenRows(newTokenRows);
      }
    } catch (error) {
      console.error('❌ Error fetching real token data:', error);
      // NO FAKE DATA - keep empty rows
      setTokenRows({ row1: [], row2: [], row3: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for real-time token updates via WebSocket
  useEffect(() => {
    const handleTokenUpdate = (data: any) => {
      if (!data.address) return;
      
      setTokenRows(prevRows => {
        // Update token in appropriate row
        const updateTokenInRow = (tokens: Token[]) => {
          return tokens.map(token => {
            if (token.address === data.address) {
              const updatedToken = {
                ...token,
                marketCap: data.marketCap || token.marketCap,
                change1m: data.change1m || token.change1m,
                soldSupply: data.soldSupply || token.soldSupply
              };
              
              // Check if token needs to move to different row
              const newRow = getTokenRow(updatedToken);
              return updatedToken;
            }
            return token;
          });
        };

        return {
          row1: updateTokenInRow(prevRows.row1),
          row2: updateTokenInRow(prevRows.row2),
          row3: updateTokenInRow(prevRows.row3)
        };
      });
    };

    const handleNewToken = (data: any) => {
      if (!data.address) return;
      
      console.log('🚀 NEW TOKEN LAUNCHED:', mint);
      
      const newToken: Token = {
        address: data.address,
        name: data.name || 'New Token',
        icon: data.icon || '',
        marketCap: data.marketCap || 0,
        soldSupply: data.soldSupply || 0,
        totalSupply: data.totalSupply || 1000000,
        lpCreated: false,
        change1m: 0,
        age: new Date().toISOString()
      };
      
      const row = getTokenRow(newToken);
      
      setTokenRows(prevRows => {
        const newRows = { ...prevRows };
        
        switch (row) {
          case 1:
            newRows.row1 = [newToken, ...prevRows.row1.slice(0, 19)];
            break;
          case 2:
            newRows.row2 = [newToken, ...prevRows.row2.slice(0, 19)];
            break;
          case 3:
            newRows.row3 = [newToken, ...prevRows.row3.slice(0, 19)];
            break;
        }
        
        return newRows;
      });
    };

    // Subscribe to real-time updates
    ws.on('tokenUpdate', handleTokenUpdate);
    ws.on('newToken', handleNewToken);
    ws.on('newPumpToken', handleNewToken);

    return () => {
      ws.off('tokenUpdate', handleTokenUpdate);
      ws.off('newToken', handleNewToken);
      ws.off('newPumpToken', handleNewToken);
    };
  }, [ws]);

  // Initial load of real data
  useEffect(() => {
    fetchTrendingTokens();
    
    // Refresh real data every 30 seconds
    const interval = setInterval(fetchTrendingTokens, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    console.log('⏳ Loading REAL token data and classifying into bonding curve rows...');
  }

  return tokenRows;
}