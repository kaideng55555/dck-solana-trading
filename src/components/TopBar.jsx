// src/components/TopBar.jsx
import React from "react";
import { useTheme } from "../theme/ThemeProvider";
import { usePrefs } from "../prefs/PreferencesProvider";
import { Link } from "react-router-dom";

export default function TopBar() {
  const { theme, toggle, intensity, setIntensity } = useTheme();
  const { prefs, toggleFx } = usePrefs();

  return (
    <div className="sticky top-0 z-30 w-full h-16 backdrop-blur border-b border-[rgba(255,28,247,0.4)] bg-black/60 flex items-center justify-between px-6">
      <Link to="/dck-tools" className="text-2xl font-bold bg-gradient-to-r from-[#FF1CF7] to-[#00E5FF] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,28,247,0.6)]">
        DCK$
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleFx}
          className={"px-2 py-1 rounded-xl border text-xs transition " + (prefs.fxEnabled
            ? "border-[rgba(0,229,255,0.5)] text-[#00E5FF] hover:shadow-[0_0_12px_rgba(0,229,255,0.6)]"
            : "border-white/30 text-pink-200/70")}
          title="Toggle visual FX"
        >
          FX: {prefs.fxEnabled ? "ON" : "OFF"}
        </button>

        <div className="flex items-center gap-2 text-xs text-pink-200/80">
          <span>Glow</span>
          <input
            type="range"
            min={0} max={100}
            value={Math.round(intensity*100)}
            onChange={(e)=>setIntensity(Number(e.target.value)/100)}
            className="w-24 accent-[#FF1CF7]"
            title="Adjust neon intensity"
          />
        </div>

        <button
          onClick={toggle}
          className="px-2 py-1 rounded-xl border border-[rgba(255,28,247,0.4)] text-[#FF1CF7] hover:shadow-[0_0_12px_rgba(255,28,247,0.6)] text-xs transition"
          title="Toggle Pro Mode"
        >
          {theme === "pro" ? "Pro: ON" : "Pro: OFF"}
        </button>

        <Link to="/settings" className="px-2 py-1 rounded-xl border border-white/20 text-pink-100 hover:border-white/40 text-xs">
          Settings
        </Link>
      </div>
    </div>
  );
}
