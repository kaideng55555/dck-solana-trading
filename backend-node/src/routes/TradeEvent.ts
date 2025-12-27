export type TradeEvent = { contract: string; side: 'buy' | 'sell'; amountUi: number; priceUi: number; ts: number; wallet?: string; };
