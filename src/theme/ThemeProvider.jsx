// src/theme/ThemeProvider.jsx
import React from "react";

const ThemeCtx = React.createContext({
  theme: "neon",
  intensity: 1,
  setTheme: (_t)=>{},
  setIntensity: (_v)=>{},
  toggle: ()=>{},
});

const THEME_KEY = "theme";
const INT_KEY = "theme_intensity";

function applyToDom(theme, intensity){
  const el = document.documentElement;
  el.setAttribute("data-theme", theme);
  el.style.setProperty("--glow", String(intensity));
  el.style.setProperty("--saturation", String(0.7 + intensity*0.3));
}

export function ThemeProvider({ children, defaultTheme = "neon" }) {
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem(THEME_KEY) || defaultTheme; } catch { return defaultTheme; }
  });
  const [intensity, setIntensity] = React.useState(() => {
    try { return Number(localStorage.getItem(INT_KEY) || "1"); } catch { return 1; }
  });

  React.useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    try { localStorage.setItem(INT_KEY, String(intensity)); } catch {}
    applyToDom(theme, intensity);
  }, [theme, intensity]);

  const value = React.useMemo(() => ({
    theme,
    intensity,
    setTheme,
    setIntensity: (v) => setIntensity(typeof v === "number" ? Math.max(0, Math.min(1, v)) : 1),
    toggle: () => setTheme((t) => (t === "neon" ? "pro" : "neon")),
  }), [theme, intensity]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(){ return React.useContext(ThemeCtx); }
