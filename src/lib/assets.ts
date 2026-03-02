// Asset definitions for all supported classes

export type AssetClass = 'crypto' | 'commodities' | 'forex' | 'stocks' | 'neft';

export interface AssetDefinition {
  symbol: string;
  binanceSymbol?: string; // if available on Binance
  name: string;
  class: AssetClass;
  icon: string;
  color: string;
  decimals: number;
  unit: string;
}

export const CRYPTO_ASSETS: AssetDefinition[] = [
  { symbol: 'BTC', binanceSymbol: 'btcusdt', name: 'Bitcoin', class: 'crypto', icon: '₿', color: 'hsl(35, 95%, 55%)', decimals: 6, unit: 'BTC' },
  { symbol: 'ETH', binanceSymbol: 'ethusdt', name: 'Ethereum', class: 'crypto', icon: 'Ξ', color: 'hsl(225, 60%, 58%)', decimals: 4, unit: 'ETH' },
  { symbol: 'SOL', binanceSymbol: 'solusdt', name: 'Solana', class: 'crypto', icon: 'S', color: 'hsl(270, 80%, 60%)', decimals: 4, unit: 'SOL' },
  { symbol: 'XRP', binanceSymbol: 'xrpusdt', name: 'XRP', class: 'crypto', icon: 'X', color: 'hsl(210, 10%, 50%)', decimals: 4, unit: 'XRP' },
  { symbol: 'ADA', binanceSymbol: 'adausdt', name: 'Cardano', class: 'crypto', icon: 'A', color: 'hsl(210, 70%, 55%)', decimals: 4, unit: 'ADA' },
];

export const COMMODITY_ASSETS: AssetDefinition[] = [
  { symbol: 'GOLD', binanceSymbol: 'xauusdt', name: 'Gold', class: 'commodities', icon: '🥇', color: 'hsl(45, 90%, 50%)', decimals: 2, unit: 'oz' },
  { symbol: 'SILVER', name: 'Silver', class: 'commodities', icon: '🥈', color: 'hsl(210, 10%, 65%)', decimals: 2, unit: 'oz' },
];

export const FOREX_ASSETS: AssetDefinition[] = [
  { symbol: 'EURUSD', binanceSymbol: 'eurusdt', name: 'EUR/USD', class: 'forex', icon: '€', color: 'hsl(220, 70%, 55%)', decimals: 5, unit: '' },
  { symbol: 'GBPUSD', binanceSymbol: 'gbpusdt', name: 'GBP/USD', class: 'forex', icon: '£', color: 'hsl(350, 60%, 50%)', decimals: 5, unit: '' },
  { symbol: 'USDJPY', name: 'USD/JPY', class: 'forex', icon: '¥', color: 'hsl(0, 70%, 50%)', decimals: 3, unit: '' },
  { symbol: 'AUDUSD', name: 'AUD/USD', class: 'forex', icon: 'A$', color: 'hsl(120, 50%, 45%)', decimals: 5, unit: '' },
];

export const STOCK_ASSETS: AssetDefinition[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', class: 'stocks', icon: '', color: 'hsl(0, 0%, 60%)', decimals: 2, unit: '' },
  { symbol: 'TSLA', name: 'Tesla Inc.', class: 'stocks', icon: 'T', color: 'hsl(0, 70%, 55%)', decimals: 2, unit: '' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', class: 'stocks', icon: 'G', color: 'hsl(130, 60%, 45%)', decimals: 2, unit: '' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', class: 'stocks', icon: 'M', color: 'hsl(200, 80%, 45%)', decimals: 2, unit: '' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', class: 'stocks', icon: 'A', color: 'hsl(30, 90%, 50%)', decimals: 2, unit: '' },
];

export const ALL_ASSETS = [...CRYPTO_ASSETS, ...COMMODITY_ASSETS, ...FOREX_ASSETS, ...STOCK_ASSETS];

// Simulated base prices for non-Binance assets
export const SIMULATED_BASE_PRICES: Record<string, number> = {
  SILVER: 31.25,
  USDJPY: 149.85,
  AUDUSD: 0.6542,
  AAPL: 227.50,
  TSLA: 248.30,
  GOOGL: 175.60,
  MSFT: 415.80,
  AMZN: 198.40,
};

// Generate a realistic fluctuating price
export function getSimulatedPrice(symbol: string, basePrice?: number): number {
  const base = basePrice || SIMULATED_BASE_PRICES[symbol] || 100;
  const now = Date.now();
  const fluctuation = Math.sin(now / 5000) * 0.002 + Math.sin(now / 13000) * 0.001 + (Math.random() - 0.5) * 0.001;
  return base * (1 + fluctuation);
}
