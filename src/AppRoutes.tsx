import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { PreferencesProvider } from './prefs/PreferencesProvider';
import { SelectedTokenProvider } from './contexts/SelectedTokenContext';
import Layout from './components/Layout';
import Trenches from './pages/Trenches';
import Explorer from './pages/Explorer';
import TokenItem from './components/TokenItem';
import { DCKZNFT, DCKZGallery } from './components/DCKZNFT';
import AnalyticsView from './components/AnalyticsView';
import NewMintsFeed from './components/NewMintsFeed';

// Placeholder components for routes
const NFTPage = () => <div className="p-6"><h2>NFT Gallery</h2></div>;
const WalletPage = () => <div className="p-6"><h2>Wallet</h2></div>;
const PortfolioPage = () => <div className="p-6"><h2>Portfolio</h2></div>;
const WalletTrackerPage = () => <div className="p-6"><h2>Wallet Tracker</h2></div>;
const SocialTrackerPage = () => <div className="p-6"><h2>Social Tracker</h2></div>;
const MusicPage = () => <div className="p-6"><h2>Music</h2></div>;
const CommunityPage = () => <div className="p-6"><h2>Community</h2></div>;

// DCK Tools home page
const DCKToolsHome = () => (
  <div className="p-6">
    <h1 className="text-4xl font-bold neon-cyan mb-4">DCK$ TOOLS</h1>
    <p className="text-gray-400">Welcome to DCK Tools - Your Solana Trading Platform</p>
  </div>
);

export default function AppRoutes({ connection, wallet }: any) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <PreferencesProvider>
          <SelectedTokenProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Trenches tokens={[]} connection={connection} wallet={wallet} />} />
                <Route path="/trenches" element={<Trenches tokens={[]} connection={connection} wallet={wallet} />} />
                <Route path="/explorer" element={<Explorer connection={connection} wallet={wallet} />} />
                <Route path="/explorer/:mint" element={<Explorer connection={connection} wallet={wallet} />} />
                <Route path="/token/:contract" element={<TokenItem token={{ contract: 'placeholder' }} />} />
                <Route path="/nft/*" element={<NFTPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/wallet-tracker" element={<WalletTrackerPage />} />
                <Route path="/social-tracker" element={<SocialTrackerPage />} />
                <Route path="/music" element={<MusicPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/dck-tools" element={<DCKToolsHome />} />
              </Route>
            </Routes>
          </SelectedTokenProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
