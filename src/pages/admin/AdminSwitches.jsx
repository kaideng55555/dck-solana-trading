// src/pages/admin/AdminSwitches.jsx
import React, { useEffect, useState } from "react";

function useAdminToken(){
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  return { token, setToken };
}

export default function AdminSwitches(){
  const { token, setToken } = useAdminToken();
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(()=>{
    if (!token) return;
    fetch("/admin/config", { headers: { "x-admin-token": token } })
      .then(r=>r.json()).then(j=> setCfg(j.config)).catch(()=>{});
  }, [token]);

  const save = async (patch) => {
    setSaving(true);
    try{
      const body = JSON.stringify({ ...cfg, ...patch, ALLOWED_WALLETS_LIST: undefined });
      const res = await fetch("/admin/config", { method:"POST", headers: { "content-type":"application/json", "x-admin-token": token }, body });
      const j = await res.json();
      if (j.ok) {
        setCfg(j.saved);
        setMsg("Saved ✓");
        setTimeout(()=>setMsg(""), 1500);
      } else { setMsg(j.error || "Error"); }
    } catch(e){ setMsg("Error"); }
    finally{ setSaving(false); }
  };

  if (!token){
    const AdminLogin = require("../../components/AdminLogin.jsx").default;
    return <div className="p-6 text-white"><AdminLogin onAuth={setToken} /></div>;
  }
  if (!cfg) return <div className="p-6 text-pink-200">Loading…</div>;

  return (
    <div className="relative w-full h-full bg-black text-white overflow-auto">
      <div className="absolute inset-0 bg-[url('/assets/cyber.png')] bg-cover bg-center opacity-40 -z-10" />
      <div className="px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-pink-400">Admin • Trading Switches</h1>
          <div className="text-blue-300">{msg}</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-pink-500/40 bg-black/70 p-4">
            <div className="text-xl text-blue-300 font-semibold mb-3">Access</div>
            <label className="flex items-center gap-3 mb-3">
              <input type="checkbox" checked={cfg.TRADING_PUBLIC === "1"} onChange={e=> save({ TRADING_PUBLIC: e.target.checked ? "1":"0" })} />
              <span>Public Trading</span>
            </label>
            <div className="mt-2">
              <div className="text-sm text-pink-300 mb-1">Allowlisted Wallets (CSV)</div>
              <textarea
                className="w-full h-24 p-2 rounded-xl bg-black/60 border border-pink-500/30 text-pink-200"
                value={cfg.ALLOWED_WALLETS}
                onChange={e=> setCfg({...cfg, ALLOWED_WALLETS: e.target.value})}
              />
              <button disabled={saving}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-500/80 hover:bg-blue-400 text-black font-semibold"
                onClick={()=> save({ ALLOWED_WALLETS: cfg.ALLOWED_WALLETS })}
              >Save Wallets</button>
            </div>
          </div>

          <div className="rounded-3xl border border-pink-500/40 bg-black/70 p-4">
            <div className="text-xl text-blue-300 font-semibold mb-3">Safety Thresholds</div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">Min Liquidity (USD)
                <input className="mt-1 w-full px-3 py-2 rounded-lg bg-black/60 border border-pink-500/30 text-pink-200"
                  type="number" value={cfg.MIN_LIQ_USD} onChange={e=> setCfg({...cfg, MIN_LIQ_USD: e.target.value})} />
              </label>
              <label className="text-sm">Min Token Age (min)
                <input className="mt-1 w-full px-3 py-2 rounded-lg bg-black/60 border border-pink-500/30 text-pink-200"
                  type="number" value={cfg.MIN_TOKEN_AGE_MINUTES} onChange={e=> setCfg({...cfg, MIN_TOKEN_AGE_MINUTES: e.target.value})} />
              </label>
              <label className="text-sm">Max Tax (%)
                <input className="mt-1 w-full px-3 py-2 rounded-lg bg-black/60 border border-pink-500/30 text-pink-200"
                  type="number" value={cfg.MAX_TAX_PCT} onChange={e=> setCfg({...cfg, MAX_TAX_PCT: e.target.value})} />
              </label>
              <label className="text-sm">Min Risk Score (0-100)
                <input className="mt-1 w-full px-3 py-2 rounded-lg bg-black/60 border border-pink-500/30 text-pink-200"
                  type="number" min="0" max="100" value={cfg.MIN_RISK_SCORE} onChange={e=> setCfg({...cfg, MIN_RISK_SCORE: e.target.value})} />
              </label>
            </div>
            <button disabled={saving}
              className="mt-3 px-4 py-2 rounded-xl bg-pink-500/80 hover:bg-pink-400 text-black font-semibold"
              onClick={()=> save({
                MIN_LIQ_USD: cfg.MIN_LIQ_USD,
                MIN_TOKEN_AGE_MINUTES: cfg.MIN_TOKEN_AGE_MINUTES,
                MAX_TAX_PCT: cfg.MAX_TAX_PCT,
                MIN_RISK_SCORE: cfg.MIN_RISK_SCORE,
              })}
            >Save Thresholds</button>
          </div>
        </div>
      </div>
    </div>
  );
}
