import { Connection, PublicKey, VersionedTransaction, TransactionMessage, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js'
import { Raydium, Router, toFeeConfig, toApiV3Token, TokenAmount, Token, LogLevel, setLoggerLevel } from '@raydium-io/raydium-sdk-v2'
setLoggerLevel('Raydium_tradeV2', LogLevel.Error)
export async function buildSwapTxBase64(conn: Connection, owner: PublicKey, inputMint: string, outputMint: string, amountInAtomic: string, slippageBps: number, priorityFeeMicros?: number) {
  const raydium = await Raydium.load({ connection: conn, owner })
  const poolData = await raydium.tradeV2.fetchRoutePoolBasicInfo()
  const inputToken = toApiV3Token(inputMint)
  const outputToken = toApiV3Token(outputMint)
  const inputAmount = new TokenAmount(Token.fromMint(inputMint, 0), amountInAtomic)
  const route = await Router.route({ inputMint: inputToken.mint, outputMint: outputToken.mint, amount: inputAmount, slippage: toFeeConfig({ feeBps: slippageBps }), poolInfosCache: poolData })
  if (!route || route.paths.length === 0) throw new Error('No route found')
  const { routesIxs } = await raydium.tradeV2.routeSwap({ routeInfo: route, ownerInfo: { wallet: owner } })
  const userIxs: TransactionInstruction[] = routesIxs.flatMap(r => r.ixs)
  const ixs: TransactionInstruction[] = []
  if (priorityFeeMicros && priorityFeeMicros > 0) ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFeeMicros }))
  ixs.push(...userIxs)
  const { blockhash } = await conn.getLatestBlockhash('processed')
  const msg = new TransactionMessage({ payerKey: owner, recentBlockhash: blockhash, instructions: ixs }).compileToV0Message()
  const vtx = new VersionedTransaction(msg)
  return { tx: Buffer.from(vtx.serialize()).toString('base64'), routeSummary: { hops: route.paths.length, inMint: inputMint, outMint: outputMint } }
}
