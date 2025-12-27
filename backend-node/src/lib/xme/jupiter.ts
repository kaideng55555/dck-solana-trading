import fetch from 'node-fetch';

const JUPITER_API = process.env.JUPITER_API || 'https://quote-api.jup.ag';
const PRIORITY_FEE_LAMPORTS = Number(process.env.PRIORITY_FEE_LAMPORTS || 5000);

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

export interface SwapRequest {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  userPublicKey: string;
}

export interface SwapResponse {
  quote: JupiterQuote;
  swapTransaction: string; // Base64 encoded transaction
}

/**
 * Get quote from Jupiter aggregator
 */
export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<JupiterQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    });

    const response = await fetch(`${JUPITER_API}/v6/quote?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Jupiter quote error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data as JupiterQuote;
  } catch (error: any) {
    console.error('❌ Failed to get Jupiter quote:', error.message);
    return null;
  }
}

/**
 * Get swap transaction from Jupiter (client-sign mode)
 * User will sign and submit transaction from frontend
 */
export async function getSwapTransaction(
  quote: JupiterQuote,
  userPublicKey: string,
  priorityFeeLamports?: number
): Promise<string | null> {
  try {
    const body: any = {
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      prioritizationFeeLamports: priorityFeeLamports || PRIORITY_FEE_LAMPORTS,
    };

    const response = await fetch(`${JUPITER_API}/v6/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Jupiter swap error:', response.status, errorText);
      return null;
    }

    const data: any = await response.json();
    return data.swapTransaction; // Base64 encoded transaction
  } catch (error: any) {
    console.error('❌ Failed to get swap transaction:', error.message);
    return null;
  }
}

/**
 * Combined helper: Get quote + swap transaction for client signing
 */
export async function getSwapQuoteAndTransaction(
  request: SwapRequest
): Promise<SwapResponse | null> {
  const { inputMint, outputMint, amount, slippageBps = 50, userPublicKey } = request;

  // Get quote
  const quote = await getJupiterQuote(inputMint, outputMint, amount, slippageBps);
  if (!quote) {
    return null;
  }

  // Get swap transaction
  const swapTransaction = await getSwapTransaction(quote, userPublicKey);
  if (!swapTransaction) {
    return null;
  }

  return {
    quote,
    swapTransaction,
  };
}
