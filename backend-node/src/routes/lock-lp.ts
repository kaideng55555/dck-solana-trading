import type { Express, Request, Response } from 'express';
import { PublicKey, Connection, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { buildInitializeLockerIx } from '../lib/locker';
type Body = { creator: string; lpMint: string; amount: string; unlockAt?: number; };
export function registerLockLPRoutes(app: Express) {
  const RPC_HTTP = process.env.RPC_HTTP || process.env.QUICKNODE_RPC;
  app.post('/lock-lp', async (req: Request, res: Response) => {
    try {
      const b = req.body as Body;
      if (!b?.creator || !b?.lpMint || !b?.amount) return res.status(400).json({ error: 'creator, lpMint, amount required' });
      if (!RPC_HTTP) return res.status(503).json({ error: 'RPC not configured' });
      const conn = new Connection(RPC_HTTP, 'confirmed');
      const creator = new PublicKey(b.creator);
      const lpMint = new PublicKey(b.lpMint);
      const amount = BigInt(b.amount);
      const fromAta = await getAssociatedTokenAddress(lpMint, creator, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
      const { lockerPda, ix: maybeInitIx } = buildInitializeLockerIx({ creator, lpMint, unlockAt: b.unlockAt || 0 });
      const toAta = await getAssociatedTokenAddress(lpMint, lockerPda, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
      const ixs: any[] = []; if (b.unlockAt) ixs.push(maybeInitIx);
      ixs.push(createAssociatedTokenAccountInstruction(creator, toAta, lockerPda, lpMint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
      ixs.push(createTransferInstruction(fromAta, toAta, creator, Number(amount)));
      const { blockhash } = await conn.getLatestBlockhash('processed');
      const msg = new TransactionMessage({ payerKey: creator, recentBlockhash: blockhash, instructions: ixs }).compileToV0Message();
      const tx = new VersionedTransaction(msg);
      res.json({ tx: Buffer.from(tx.serialize()).toString('base64') });
    } catch (e:any) { res.status(500).json({ error: e?.message || 'lock-lp failed' }); }
  });
}
