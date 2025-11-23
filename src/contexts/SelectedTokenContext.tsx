import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Token } from '../hooks/bondingCurveLogic';

interface SelectedTokenContextValue {
  selectedToken: Token | null;
  setSelectedToken: (token: Token | null) => void;
}

const SelectedTokenContext = createContext<SelectedTokenContextValue | undefined>(undefined);

export function SelectedTokenProvider({ children }: { children: ReactNode }) {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  return (
    <SelectedTokenContext.Provider value={{ selectedToken, setSelectedToken }}>
      {children}
    </SelectedTokenContext.Provider>
  );
}

export function useSelectedToken() {
  const context = useContext(SelectedTokenContext);
  if (!context) {
    throw new Error('useSelectedToken must be used within SelectedTokenProvider');
  }
  return context;
}