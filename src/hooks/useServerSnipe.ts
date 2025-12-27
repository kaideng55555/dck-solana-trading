import { VersionedTransaction } from '@solana/web3.js';
export function useServerSnipe(connection: any, wallet: any) {
  return { async snipe(params: any, opts: any){ const r=await fetch('/snipe/intent',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(params)}); if(!r.ok) throw new Error(await r.text()); const {tx}=await r.json(); const vtx=VersionedTransaction.deserialize(Buffer.from(tx,'base64')); const signed=await wallet.signTransaction(vtx); return connection.sendRawTransaction(signed.serialize(),{skipPreflight:true,preflightCommitment:'processed'}); } };
}