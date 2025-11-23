import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Theme, neonTheme, platinumTheme } from '../theme';

// Create a context for theming. Provides the current theme and a toggle function.
type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(neonTheme);

  // Persist theme preference in local storage
  useEffect(() => {
    const saved = localStorage.getItem('dck-theme');
    if (saved === 'platinum') {
      setTheme(platinumTheme);
    }
  }, []);

  useEffect(() => {
    // Update CSS variables on theme change
    const root = document.documentElement;
    root.style.setProperty('--bg-color', theme.bgColor);
    root.style.setProperty('--card-bg', theme.cardBg);
    root.style.setProperty('--text-primary', theme.primaryText);
    root.style.setProperty('--text-secondary', theme.secondaryText);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--positive-color', theme.positive);
    root.style.setProperty('--negative-color', theme.negative);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--header-bg', theme.headerBg);
    root.style.setProperty('--banner-bg', theme.bannerBg);

    // Persist preference
    localStorage.setItem('dck-theme', theme.name);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev.name === 'neon' ? platinumTheme : neonTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}