// src/prefs/PreferencesProvider.jsx
import React from "react";

const PrefsCtx = React.createContext({
  prefs: { fxEnabled: true },
  toggleFx: () => {},
  updatePrefs: (_p) => {},
});

const PREFS_KEY = "user_prefs";

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = React.useState(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      return stored ? JSON.parse(stored) : { fxEnabled: true };
    } catch {
      return { fxEnabled: true };
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  const value = React.useMemo(() => ({
    prefs,
    toggleFx: () => setPrefs(p => ({ ...p, fxEnabled: !p.fxEnabled })),
    updatePrefs: (updates) => setPrefs(p => ({ ...p, ...updates })),
  }), [prefs]);

  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export function usePrefs() {
  return React.useContext(PrefsCtx);
}
