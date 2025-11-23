import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the main title', () => {
    render(<App />);
    expect(screen.getByText('DCK$ TOOLS')).toBeInTheDocument();
  });

  it('renders navigation tabs', () => {
    render(<App />);
    expect(screen.getByText('🚀 TRADING')).toBeInTheDocument();
    expect(screen.getByText('🎯 CREATE TOKEN')).toBeInTheDocument();
    expect(screen.getByText('📈 ANALYTICS')).toBeInTheDocument();
  });
});
