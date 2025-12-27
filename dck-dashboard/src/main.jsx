import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import TokenDashboard from './TokenDashboard';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TokenDashboard />
  </StrictMode>,
);
