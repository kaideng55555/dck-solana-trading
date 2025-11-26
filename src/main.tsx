import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { WalletContextProvider } from './solana/WalletProvider'
import './index.css'
import './styles/neon.css'
import './styles/effects.css'
import './styles/switch.css'
import './styles/theme.css'
import './styles/animations_extra.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WalletContextProvider>
    <App />
  </WalletContextProvider>
)
