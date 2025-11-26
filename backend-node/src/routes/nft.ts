// backend-node/src/routes/nft.ts
import type { Express, Request, Response } from "express";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import {
  MPL_TOKEN_METADATA_PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  createMetadataAccountV3,
  updateMetadataAccountV2
} from "@metaplex-foundation/mpl-token-metadata";

const RPC = process.env.RPC_HTTP || process.env.QUICKNODE_RPC || "";

export function registerNftRoutes(app: Express) {
  app.post("/nft/mint-intent", async (req: Request, res: Response) => {
    try {
      const { owner, name, symbol, uri } = req.body || {};
      if (!owner || !name || !symbol || !uri) return res.status(400).json({ error: "owner,name,symbol,uri required" });
      if (!RPC) return res.status(503).json({ error: "RPC not configured" });
      const conn = new Connection(RPC, "confirmed");
      const ownerPk = new PublicKey(owner);

      const seed = `dck-${Date.now().toString(36)}`.slice(0, 32);
      const mintPk = await PublicKey.createWithSeed(ownerPk, seed, TOKEN_PROGRAM_ID);
      const ex = await conn.getAccountInfo(mintPk);
      if (ex) return res.status(409).json({ error: "mint exists for seed", mint: mintPk.toBase58(), seed });

      const rent = await getMinimumBalanceForRentExemptMint(conn);
      const ixs: any[] = [];

      ixs.push(SystemProgram.createAccountWithSeed({
        fromPubkey: ownerPk, basePubkey: ownerPk, seed,
        newAccountPubkey: mintPk, lamports: rent, space: MINT_SIZE, programId: TOKEN_PROGRAM_ID,
      }));
      ixs.push(createInitializeMintInstruction(mintPk, 0, ownerPk, ownerPk));
      const ata = await getAssociatedTokenAddress(mintPk, ownerPk, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
      ixs.push(createAssociatedTokenAccountInstruction(ownerPk, ata, ownerPk, mintPk, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
      ixs.push(createMintToInstruction(mintPk, ata, ownerPk, 1));

      const [metadataPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintPk.toBuffer()],
        TOKEN_METADATA_PROGRAM_ID
      );
      ixs.push(createCreateMetadataAccountV3Instruction({
        metadata: metadataPda, mint: mintPk, mintAuthority: ownerPk, payer: ownerPk, updateAuthority: ownerPk,
      }, { createMetadataAccountArgsV3: {
        data: { name, symbol, uri, sellerFeeBasisPoints: 0, creators: null, collection: null, uses: null },
        collectionDetails: null, isMutable: true
      }}));

      const { blockhash } = await conn.getLatestBlockhash("processed");
      const msg = new TransactionMessage({ payerKey: ownerPk, recentBlockhash: blockhash, instructions: ixs }).compileToV0Message();
      const vtx = new VersionedTransaction(msg);
      const tx = Buffer.from(vtx.serialize()).toString("base64");
      res.json({ tx, mint: mintPk.toBase58(), seed });
    } catch (e: any) { res.status(500).json({ error: e?.message || "mint-intent failed" }); }
  });

  app.post("/nft/reveal-intent", async (req: Request, res: Response) => {
    try {
      const { owner, mint, uri, name, symbol } = req.body || {};
      if (!owner || !mint || !uri) return res.status(400).json({ error: "owner,mint,uri required" });
      if (!RPC) return res.status(503).json({ error: "RPC not configured" });
      const conn = new Connection(RPC, "confirmed");
      const ownerPk = new PublicKey(owner);
      const mintPk = new PublicKey(mint);

      const [metadataPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintPk.toBuffer()],
        TOKEN_METADATA_PROGRAM_ID
      );
      const ix = createUpdateMetadataAccountV2Instruction({ metadata: metadataPda, updateAuthority: ownerPk }, {
        updateMetadataAccountArgsV2: {
          data: { name: name || "", symbol: symbol || "", uri, sellerFeeBasisPoints: 0, creators: null, collection: null, uses: null },
          updateAuthority: ownerPk, primarySaleHappened: null, isMutable: true
        }
      });
      const { blockhash } = await conn.getLatestBlockhash("processed");
      const msg = new TransactionMessage({ payerKey: ownerPk, recentBlockhash: blockhash, instructions: [ix] }).compileToV0Message();
      const vtx = new VersionedTransaction(msg);
      const tx = Buffer.from(vtx.serialize()).toString("base64");
      res.json({ tx });
    } catch (e: any) { res.status(500).json({ error: e?.message || "reveal-intent failed" }); }
  });

  app.get("/nft/wallet", async (req: Request, res: Response) => {
    try {
      const ownerStr = String(req.query.owner || "");
      if (!ownerStr) return res.status(400).json({ error: "owner required" });
      if (!RPC) return res.status(503).json({ error: "RPC not configured" });
      const owner = new PublicKey(ownerStr);
      const conn = new Connection(RPC, "confirmed");
      const { TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
      const resp = await conn.getParsedTokenAccountsByOwner(owner, { programId: (TOKEN_PROGRAM_ID as any) });
      const items: any[] = [];
      for (const it of resp.value.slice(0, 100)) {
        const info: any = it.account.data.parsed.info;
        const dec = Number(info.tokenAmount.decimals);
        const amt = Number(info.tokenAmount.amount);
        const mint = info.mint as string;
        if (dec === 0 && amt >= 1) {
          try {
            const [metadataPda] = PublicKey.findProgramAddressSync(
              [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), new PublicKey(mint).toBuffer()],
              TOKEN_METADATA_PROGRAM_ID
            );
            const meta = await Metadata.fromAccountAddress(conn, metadataPda);
            const name = meta.data.name?.trim() || mint.slice(0, 8);
            const uri = meta.data.uri?.trim();
            let image: string | undefined;
            if (uri) {
              try { const j = await fetch(uri).then(r=>r.json()).catch(()=>null); image = j?.image; } catch {}
            }
            items.push({ id: mint, name, image });
          } catch { items.push({ id: mint }); }
        }
      }
      res.json({ items });
    } catch (e: any) { res.status(500).json({ error: e?.message || "wallet lookup failed" }); }
  });
}
