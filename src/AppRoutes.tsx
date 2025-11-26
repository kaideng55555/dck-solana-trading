import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Trenches from './pages/Trenches';
import Explorer from './pages/Explorer';
export default function AppRoutes({ connection, wallet }: any) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Trenches tokens={[]} connection={connection} wallet={wallet} />} />
        <Route path="/explorer/:mint" element={<Explorer connection={connection} wallet={wallet} />} />
      </Routes>
    </BrowserRouter>
  );
}
