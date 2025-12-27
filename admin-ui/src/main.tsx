import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

node scripts/mintToken.js create "DCK Coin" "DCK" 6 1000000 "YOUR_PRIVATE_KEY"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
