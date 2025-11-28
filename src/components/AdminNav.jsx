import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function AdminNav() {
  const { pathname } = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin';
  };
  
  const Item = ({ to, children }) => (
    <Link
      to={to}
      className={
        "px-3 py-2 rounded-xl text-sm transition-all " +
        (pathname === to
          ? "bg-pink-500/30 text-white border border-pink-500/50 shadow-[0_0_8px_rgba(236,72,153,0.5)]"
          : "text-pink-300 hover:text-white hover:bg-pink-500/10 border border-transparent hover:border-pink-500/30")
      }
    >
      {children}
    </Link>
  );
  
  return (
    <div className="flex items-center gap-2">
      <Item to="/admin">Home</Item>
      <Item to="/admin/switches">Trading Switches</Item>
      <Item to="/admin/fees">Fees</Item>
      <button
        onClick={handleLogout}
        className="px-3 py-2 rounded-xl text-sm text-pink-300 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/50 transition-all"
      >
        Logout
      </button>
    </div>
  );
}
