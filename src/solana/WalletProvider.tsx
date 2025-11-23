import { FC, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';

export const WalletContextProvider: FC<{children: ReactNode}> = ({ children }) => {
  const wallets = useMemo(() => [], []);

  const endpoint = useMemo(() => {
    return (import.meta as any).env.VITE_SOLANA_RPC_URL || 
           (import.meta as any).env.VITE_RPC_URL || 
           'https://api.mainnet-beta.solana.com';
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
