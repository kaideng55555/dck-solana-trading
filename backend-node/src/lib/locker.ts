import { PublicKey, TransactionInstruction, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
const LOCKER_PROGRAM_ID = new PublicKey(process.env.LOCKER_PROGRAM_ID || '11111111111111111111111111111111');
export function buildInitializeLockerIx(p: { creator: PublicKey; lpMint: PublicKey | null; unlockAt: number }) {
  const [lockerPda] = PublicKey.findProgramAddressSync([Buffer.from('locker'), (p.lpMint ?? PublicKey.default).toBuffer()], LOCKER_PROGRAM_ID);
  const data = Buffer.alloc(16);
  const keys = [
    { pubkey: lockerPda, isSigner: false, isWritable: true },
    { pubkey: p.creator, isSigner: true, isWritable: false },
    { pubkey: p.lpMint ?? PublicKey.default, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];
  const ix = new TransactionInstruction({ programId: LOCKER_PROGRAM_ID, keys, data });
  return { ix, lockerPda };
}
