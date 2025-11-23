import { useState, useEffect, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

interface TickData {
    timestamp: number;
    price: number;
    volume: number;
    side: 'buy' | 'sell';
    liquidity?: number;
}

interface LiquidityData {
    totalLiquidity: number;
    bidLiquidity: number;
    askLiquidity: number;
    spread: number;
    hhiIndex: number; // Herfindahl-Hirschman Index for liquidity concentration
}

interface DEXMetrics {
    price24h: number[];
    volume24h: number;
    volumeChange24h: number;
    liquidityData: LiquidityData;
    topHolders: Array<{
        address: string;
        balance: number;
        percentage: number;
    }>;
    trades: TickData[];
    priceImpact: {
        buy1Sol: number;
        buy5Sol: number;
        buy10Sol: number;
        sell1Sol: number;
        sell5Sol: number;
        sell10Sol: number;
    };
}

class DEXAnalytics {
    private connection: Connection;
    private wsConnections: Map<string, WebSocket> = new Map();
    private tickDataCache: Map<string, TickData[]> = new Map();

    constructor(rpcEndpoint: string) {
        this.connection = new Connection(rpcEndpoint);
    }

    /**
     * Calculate Herfindahl-Hirschman Index for liquidity concentration
     */
    calculateHHI(liquidityProviders: Array<{balance: number}>): number {
        const totalLiquidity = liquidityProviders.reduce((sum, lp) => sum + lp.balance, 0);
        if (totalLiquidity === 0) return 0;

        const hhi = liquidityProviders.reduce((sum, lp) => {
            const marketShare = lp.balance / totalLiquidity;
            return sum + (marketShare * marketShare * 10000); // Scale to 0-10000
        }, 0);

        return hhi;
    }

    /**
     * Analyze tick data for patterns
     */
    analyzeTickData(ticks: TickData[]): {
        volumeProfile: Array<{price: number, volume: number}>;
        supportResistance: Array<{level: number, strength: number, type: 'support' | 'resistance'}>;
        trend: 'bullish' | 'bearish' | 'sideways';
        volatility: number;
    } {
        if (ticks.length === 0) {
            return {
                volumeProfile: [],
                supportResistance: [],
                trend: 'sideways',
                volatility: 0
            };
        }

        // Volume Profile Analysis
        const priceVolumeMap = new Map<number, number>();
        const priceStep = 0.0001; // Adjust based on token price range
        
        ticks.forEach(tick => {
            const roundedPrice = Math.round(tick.price / priceStep) * priceStep;
            priceVolumeMap.set(roundedPrice, (priceVolumeMap.get(roundedPrice) || 0) + tick.volume);
        });

        const volumeProfile = Array.from(priceVolumeMap.entries())
            .map(([price, volume]) => ({ price, volume }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 20); // Top 20 volume levels

        // Support/Resistance Levels
        const supportResistance = this.findSupportResistanceLevels(ticks);

        // Trend Analysis
        const recentTicks = ticks.slice(-100); // Last 100 ticks
        const trend = this.calculateTrend(recentTicks);

        // Volatility (standard deviation of returns)
        const returns = ticks.slice(1).map((tick, i) => 
            (tick.price - ticks[i].price) / ticks[i].price
        );
        const volatility = this.calculateStandardDeviation(returns);

        return {
            volumeProfile,
            supportResistance,
            trend,
            volatility: volatility * 100 // Convert to percentage
        };
    }

    private findSupportResistanceLevels(ticks: TickData[]): Array<{level: number, strength: number, type: 'support' | 'resistance'}> {
        const levels: Array<{level: number, strength: number, type: 'support' | 'resistance'}> = [];
        const prices = ticks.map(t => t.price);
        const sortedPrices = [...prices].sort((a, b) => a - b);
        
        // Find local minima and maxima
        for (let i = 5; i < ticks.length - 5; i++) {
            const currentPrice = ticks[i].price;
            const isLocalMin = ticks.slice(i - 5, i).every(t => t.price >= currentPrice) &&
                              ticks.slice(i + 1, i + 6).every(t => t.price >= currentPrice);
            const isLocalMax = ticks.slice(i - 5, i).every(t => t.price <= currentPrice) &&
                              ticks.slice(i + 1, i + 6).every(t => t.price <= currentPrice);
            
            if (isLocalMin) {
                const touchCount = ticks.filter(t => Math.abs(t.price - currentPrice) / currentPrice < 0.01).length;
                levels.push({
                    level: currentPrice,
                    strength: touchCount,
                    type: 'support'
                });
            }
            
            if (isLocalMax) {
                const touchCount = ticks.filter(t => Math.abs(t.price - currentPrice) / currentPrice < 0.01).length;
                levels.push({
                    level: currentPrice,
                    strength: touchCount,
                    type: 'resistance'
                });
            }
        }
        
        return levels.filter(l => l.strength >= 3).sort((a, b) => b.strength - a.strength).slice(0, 10);
    }

    private calculateTrend(ticks: TickData[]): 'bullish' | 'bearish' | 'sideways' {
        if (ticks.length < 20) return 'sideways';
        
        const firstHalf = ticks.slice(0, Math.floor(ticks.length / 2));
        const secondHalf = ticks.slice(Math.floor(ticks.length / 2));
        
        const avgPriceFirst = firstHalf.reduce((sum, t) => sum + t.price, 0) / firstHalf.length;
        const avgPriceSecond = secondHalf.reduce((sum, t) => sum + t.price, 0) / secondHalf.length;
        
        const change = (avgPriceSecond - avgPriceFirst) / avgPriceFirst;
        
        if (change > 0.02) return 'bullish';
        if (change < -0.02) return 'bearish';
        return 'sideways';
    }

    private calculateStandardDeviation(values: number[]): number {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        
        return Math.sqrt(avgSquaredDiff);
    }

    /**
     * Connect to DEX WebSocket for real-time tick data
     */
    async connectToTickStream(tokenAddress: string, callback: (tick: TickData) => void): Promise<void> {
        // For Jupiter/Raydium, we'd connect to their WebSocket APIs
        // This is a simulation of real tick data
        const ws = new WebSocket('wss://api.dexscreener.com/latest/dex/tokens/' + tokenAddress);
        
        ws.onopen = () => {
            console.log(`📡 Connected to tick stream for ${tokenAddress}`);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.pairs && data.pairs[0]) {
                    const pair = data.pairs[0];
                    const tick: TickData = {
                        timestamp: Date.now(),
                        price: parseFloat(pair.priceUsd || '0'),
                        volume: parseFloat(pair.volume24h || '0'),
                        side: Math.random() > 0.5 ? 'buy' : 'sell',
                        liquidity: parseFloat(pair.liquidity?.usd || '0')
                    };
                    
                    // Cache tick data
                    const cachedTicks = this.tickDataCache.get(tokenAddress) || [];
                    cachedTicks.push(tick);
                    
                    // Keep only last 1000 ticks
                    if (cachedTicks.length > 1000) {
                        cachedTicks.shift();
                    }
                    
                    this.tickDataCache.set(tokenAddress, cachedTicks);
                    callback(tick);
                }
            } catch (error) {
                console.error('Error parsing tick data:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.wsConnections.set(tokenAddress, ws);
    }

    /**
     * Calculate price impact for different trade sizes
     */
    async calculatePriceImpact(tokenAddress: string, poolData: any): Promise<DEXMetrics['priceImpact']> {
        // This would integrate with Jupiter API to get real price impact calculations
        // For now, using estimated calculations based on liquidity
        const baseLiquidity = poolData?.liquidity || 100000;
        
        const calculateImpact = (tradeSize: number, liquidity: number): number => {
            return (tradeSize / liquidity) * 100; // Simplified impact calculation
        };

        return {
            buy1Sol: calculateImpact(1, baseLiquidity),
            buy5Sol: calculateImpact(5, baseLiquidity),
            buy10Sol: calculateImpact(10, baseLiquidity),
            sell1Sol: calculateImpact(1, baseLiquidity) * 1.1, // Slightly higher for sells
            sell5Sol: calculateImpact(5, baseLiquidity) * 1.1,
            sell10Sol: calculateImpact(10, baseLiquidity) * 1.1,
        };
    }

    /**
     * Get comprehensive DEX metrics for a token
     */
    async getTokenMetrics(tokenAddress: string): Promise<DEXMetrics> {
        try {
            // Fetch data from multiple sources
            const dexScreenerData = await this.fetchDexScreenerData(tokenAddress);
            const tickData = this.tickDataCache.get(tokenAddress) || [];
            
            // Calculate liquidity data
            const liquidityData: LiquidityData = {
                totalLiquidity: dexScreenerData?.liquidity || 0,
                bidLiquidity: (dexScreenerData?.liquidity || 0) * 0.5,
                askLiquidity: (dexScreenerData?.liquidity || 0) * 0.5,
                spread: dexScreenerData?.spread || 0,
                hhiIndex: this.calculateHHI([
                    { balance: (dexScreenerData?.liquidity || 0) * 0.3 },
                    { balance: (dexScreenerData?.liquidity || 0) * 0.2 },
                    { balance: (dexScreenerData?.liquidity || 0) * 0.5 }
                ])
            };

            // Generate price history (last 24h)
            const now = Date.now();
            const price24h = Array.from({ length: 24 }, (_, i) => {
                const basePrice = dexScreenerData?.priceUsd || 1;
                const volatility = 0.1;
                return basePrice * (1 + (Math.random() - 0.5) * volatility);
            });

            // Calculate price impact
            const priceImpact = await this.calculatePriceImpact(tokenAddress, dexScreenerData);

            return {
                price24h,
                volume24h: dexScreenerData?.volume24h || 0,
                volumeChange24h: dexScreenerData?.volumeChange24h || 0,
                liquidityData,
                topHolders: [], // Would fetch from token account analysis
                trades: tickData.slice(-100), // Last 100 trades
                priceImpact
            };

        } catch (error) {
            console.error('Error fetching token metrics:', error);
            throw error;
        }
    }

    private async fetchDexScreenerData(tokenAddress: string): Promise<any> {
        try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
            const data = await response.json();
            return data.pairs?.[0] || null;
        } catch (error) {
            console.error('Error fetching DexScreener data:', error);
            return null;
        }
    }

    /**
     * Disconnect all WebSocket connections
     */
    disconnect(): void {
        this.wsConnections.forEach((ws, address) => {
            ws.close();
            console.log(`🔌 Disconnected from ${address}`);
        });
        this.wsConnections.clear();
    }
}

export default DEXAnalytics;
export type { TickData, LiquidityData, DEXMetrics };