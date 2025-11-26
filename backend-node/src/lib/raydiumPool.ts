import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
export async function buildRaydiumCreatePoolIx(p: { connection: Connection; creator: PublicKey; baseMint: PublicKey; quoteMint: PublicKey; initialPrice: number; }): Promise<{ ix: TransactionInstruction; lpMint: PublicKey | null }> {
  return { ix: new TransactionInstruction({ keys: [], programId: PublicKey.default, data: Buffer.alloc(0) }), lpMint: null };
}
export async function buildRaydiumAddLiquidityIxs(p: { connection: Connection; creator: PublicKey; baseMint: PublicKey; quoteMint: PublicKey; baseAmountUi: number; quoteAmountSol: number; }): Promise<TransactionInstruction[]> {
  return [new TransactionInstruction({ keys: [], programId: PublicKey.default, data: Buffer.alloc(0) })];
}
