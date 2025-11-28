import React from "react";
import AdminNav from "../../components/AdminNav";
import AdminLogin from "../../components/AdminLogin";

export default function AdminHome() {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
  return (
    <div className="relative w-full h-full bg-black text-white overflow-auto">
      <div className="absolute inset-0 bg-[url('/assets/cyber.png')] bg-cover bg-center opacity-40 -z-10" />
      <div className="px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-pink-400">Admin</h1>
          <AdminNav />
        </div>
        {!token ? (
          <div className="max-w-xl"><AdminLogin onAuth={()=>location.reload()} /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <a href="/admin/switches" className="p-6 rounded-3xl bg-black/70 border border-pink-500/40 hover:shadow-[0_0_16px_rgba(236,72,153,0.8)] transition">
              <div className="text-xl text-white font-semibold">Trading Switches</div>
              <div className="text-sm text-pink-300 mt-1">Public/closed beta, allowlist, safety thresholds</div>
            </a>
            <a href="/admin/fees" className="p-6 rounded-3xl bg-black/70 border border-pink-500/40 hover:shadow-[0_0_16px_rgba(236,72,153,0.8)] transition">
              <div className="text-xl text-white font-semibold">Fees Dashboard</div>
              <div className="text-sm text-pink-300 mt-1">Live + daily totals</div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
