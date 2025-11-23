export interface Theme {
  name: string;
  bgColor: string;
  cardBg: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  positive: string;
  negative: string;
  border: string;
  headerBg: string;
  bannerBg: string;
}

export const neonTheme: Theme = {
  name: 'neon',
  bgColor: '#0a0a0a',
  cardBg: '#1a1a1a',
  primaryText: '#ffffff',
  secondaryText: '#cccccc',
  accent: '#ff0080',
  positive: '#00ff80',
  negative: '#ff4080',
  border: '#333333',
  headerBg: '#050505',
  bannerBg: '#1a0a1a'
};

export const platinumTheme: Theme = {
  name: 'platinum',
  bgColor: '#f5f5f5',
  cardBg: '#ffffff',
  primaryText: '#2c2c2c',
  secondaryText: '#666666',
  accent: '#6366f1',
  positive: '#10b981',
  negative: '#ef4444',
  border: '#e5e5e5',
  headerBg: '#ffffff',
  bannerBg: '#f9fafb'
};