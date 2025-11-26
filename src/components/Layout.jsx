import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from '../components/TopBar';

export default function Layout() {
  return (
    <div className="app-container min-h-screen bg-black">
      <TopBar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
