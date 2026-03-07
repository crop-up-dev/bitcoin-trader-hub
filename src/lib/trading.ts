import { USE_BACKEND } from './api-config';
import { tradingAPI } from './api';

export interface Trade {
  id: string;
  timestamp: number;
  pair: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price: number;
  amount: number;
  total: number;
}

export interface Portfolio {
  usdtBalance: number;
  btcBalance: number;
  trades: Trade[];
  balanceHistory: { timestamp: number; balance: number }[];
}

const STORAGE_KEY = 'btc-trading-portfolio';

const DEFAULT_PORTFOLIO: Portfolio = {
  usdtBalance: 10000,
  btcBalance: 0,
  trades: [],
  balanceHistory: [{ timestamp: Date.now(), balance: 10000 }],
};

export function loadPortfolio(): Portfolio {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return { ...DEFAULT_PORTFOLIO };
}

export async function fetchPortfolio(): Promise<Portfolio> {
  if (USE_BACKEND) {
    const res = await tradingAPI.loadPortfolio();
    if (res.ok && res.data) return res.data;
  }
  return loadPortfolio();
}

export function savePortfolio(portfolio: Portfolio) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  if (USE_BACKEND) {
    tradingAPI.savePortfolio(portfolio);
  }
}

export function executeTrade(
  portfolio: Portfolio,
  side: 'buy' | 'sell',
  type: 'market' | 'limit',
  price: number,
  amount: number
): Portfolio {
  const total = price * amount;
  const newPortfolio = { ...portfolio };

  if (side === 'buy') {
    if (total > portfolio.usdtBalance) throw new Error('Insufficient USDT balance');
    newPortfolio.usdtBalance = portfolio.usdtBalance - total;
    newPortfolio.btcBalance = portfolio.btcBalance + amount;
  } else {
    if (amount > portfolio.btcBalance) throw new Error('Insufficient BTC balance');
    newPortfolio.usdtBalance = portfolio.usdtBalance + total;
    newPortfolio.btcBalance = portfolio.btcBalance - amount;
  }

  const trade: Trade = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    pair: 'BTC/USDT',
    side,
    type,
    price,
    amount,
    total,
  };

  newPortfolio.trades = [trade, ...portfolio.trades];
  const totalValue = newPortfolio.usdtBalance + newPortfolio.btcBalance * price;
  newPortfolio.balanceHistory = [
    ...portfolio.balanceHistory,
    { timestamp: Date.now(), balance: totalValue },
  ];

  savePortfolio(newPortfolio);

  // Also send to backend if enabled
  if (USE_BACKEND) {
    tradingAPI.executeTrade(side, type, price, amount);
  }

  return newPortfolio;
}

export function getAverageEntryPrice(trades: Trade[]): number {
  const buys = trades.filter(t => t.side === 'buy');
  if (buys.length === 0) return 0;
  const totalCost = buys.reduce((sum, t) => sum + t.total, 0);
  const totalAmount = buys.reduce((sum, t) => sum + t.amount, 0);
  return totalAmount > 0 ? totalCost / totalAmount : 0;
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatUSD(num: number): string {
  return `$${formatNumber(num)}`;
}

export function formatBTC(num: number): string {
  return formatNumber(num, 6);
}
