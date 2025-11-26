import type { Express, Request, Response } from 'express';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint, MINT_SIZE, createInitializeMintInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token';
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID, createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { buildRaydiumCreatePoolIx, buildRaydiumAddLiquidityIxs } from '../lib/raydiumPool';
import { buildInitializeLockerIx } from '../lib/locker';
type LaunchBody = { name: string; symbol: string; decimals: number; metadataUri: string; supply: number; initialPrice: number; liqSol: number; lockDurationSec: number; feeBps?: number; creator: string; mint?: string; removeFreezeAuthority?: boolean; };
export function registerLaunchRoutes(app: Express) {
  const RPC_HTTP = process.env.RPC_HTTP || process.env.QUICKNODE_RPC;
  app.post('/launch', async (req: Request, res: Response) => {
    try {
      const b = req.body as LaunchBody;
      if (!b?.creator) return res.status(400).json({ error: 'creator required' });
      if (!b?.name || !b?.symbol || !b?.metadataUri) return res.status(400).json({ error: 'name/symbol/metadataUri required' });
      if (b.decimals == null) return res.status(400).json({ error: 'decimals required' });
      if (!b.supply || !b.initialPrice || !b.liqSol) return res.status(400).json({ error: 'supply/initialPrice/liqSol required' });
      if (!RPC_HTTP) return res.status(503).json({ error: 'RPC not configured' });
      const conn = new Connection(RPC_HTTP, 'confirmed');
      const creator = new PublicKey(b.creator);
      const decimals = Number(b.decimals);
      const supplyUi = Number(b.supply);
      const amountBase = BigInt(Math.floor(supplyUi * (10 ** decimals)));
      const removeFreeze = b.removeFreezeAuthority !== false;
      const mintPub = b.mint ? new PublicKey(b.mint) : PublicKey.unique();
      const lamports = await getMinimumBalanceForRentExemptMint(conn);
      const ixs1: any[] = [];
      ixs1.push(SystemProgram.createAccount({ fromPubkey: creator, newAccountPubkey: mintPub, lamports, space: MINT_SIZE, programId: TOKEN_PROGRAM_ID }));
      ixs1.push(createInitializeMintInstruction(mintPub, decimals, creator, creator));
      const creatorBaseAta = await getAssociatedTokenAddress(mintPub, creator, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
      ixs1.push(createAssociatedTokenAccountInstruction(creator, creatorBaseAta, creator, mintPub, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
      ixs1.push(createMintToInstruction(mintPub, creatorBaseAta, creator, amountBase as unknown as bigint));
      const [metadataPda] = PublicKey.findProgramAddressSync([Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintPub.toBuffer()], TOKEN_METADATA_PROGRAM_ID);
      ixs1.push(createCreateMetadataAccountV3Instruction({ metadata: metadataPda, mint: mintPub, mintAuthority: creator, payer: creator, updateAuthority: creator }, { createMetadataAccountArgsV3: { data: { name: b.name, symbol: b.symbol, uri: b.metadataUri, sellerFeeBasisPoints: 0, creators: null, collection: null, uses: null }, collectionDetails: null, isMutable: true } }));
      const { blockhash: bh1 } = await conn.getLatestBlockhash('processed');
      const msg1 = new TransactionMessage({ payerKey: creator, recentBlockhash: bh1, instructions: ixs1 }).compileToV0Message();
      const tx1 = new VersionedTransaction(msg1);
      const ixs2: any[] = []; ixs2.push(createSetAuthorityInstruction(mintPub, creator, AuthorityType.MintTokens, null)); if (removeFreeze) ixs2.push(createSetAuthorityInstruction(mintPub, creator, AuthorityType.FreezeAccount, null));
      const { blockhash: bh2 } = await conn.getLatestBlockhash('processed');
      const msg2 = new TransactionMessage({ payerKey: creator, recentBlockhash: bh2, instructions: ixs2 }).compileToV0Message();
      const tx2 = new VersionedTransaction(msg2);
      const { ix: createPoolIx, lpMint } = await buildRaydiumCreatePoolIx({ connection: conn, creator, baseMint: mintPub, quoteMint: PublicKey.default, initialPrice: b.initialPrice });
      const { blockhash: bh3 } = await conn.getLatestBlockhash('processed');
      const msg3 = new TransactionMessage({ payerKey: creator, recentBlockhash: bh3, instructions: [createPoolIx] }).compileToV0Message();
      const tx3 = new VersionedTransaction(msg3);
      const addLiqIxs = await buildRaydiumAddLiquidityIxs({ connection: conn, creator, baseMint: mintPub, quoteMint: PublicKey.default, baseAmountUi: supplyUi, quoteAmountSol: b.liqSol });
      const { blockhash: bh4 } = await conn.getLatestBlockhash('processed');
      const msg4 = new TransactionMessage({ payerKey: creator, recentBlockhash: bh4, instructions: addLiqIxs }).compileToV0Message();
      const tx4 = new VersionedTransaction(msg4);
      const unlockAt = Math.floor(Date.now()/1000) + Number(b.lockDurationSec || 0);
      const { ix: initLockerIx } = buildInitializeLockerIx({ creator, lpMint, unlockAt });
      const { blockhash: bh5 } = await conn.getLatestBlockhash('processed');
      const msg5 = new TransactionMessage({ payerKey: creator, recentBlockhash: bh5, instructions: [initLockerIx] }).compileToV0Message();
      const tx5 = new VersionedTransaction(msg5);
      const toB64 = (tx: VersionedTransaction) => Buffer.from(tx.serialize()).toString('base64');
      res.json({ txs: [toB64(tx1), toB64(tx2), toB64(tx3), toB64(tx4), toB64(tx5)], summary: { mint: mintPub.toBase58(), lpMint: lpMint?.toBase58() || null, creatorBaseAta: creatorBaseAta.toBase58(), unlockAt } });
    } catch (e:any) { res.status(500).json({ error: e?.message || 'launch failed' }); }
  });
}
