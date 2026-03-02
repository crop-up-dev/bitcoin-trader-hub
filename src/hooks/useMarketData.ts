import { useState, useEffect, useRef } from 'react';
import { SIMULATED_BASE_PRICES, getSimulatedPrice } from '@/lib/assets';

export interface MarketPrice {
  symbol: string;
  price: number;
  prevPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
}

// Hook for Binance-available assets
export function useBinancePrice(binanceSymbol: string | undefined) {
  const [price, setPrice] = useState(0);
  const [prevPrice, setPrevPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [changePercent, setChangePercent] = useState(0);

  useEffect(() => {
    if (!binanceSymbol) return;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@ticker`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrice(prev => {
        setPrevPrice(prev);
        return parseFloat(data.c);
      });
      setChange(parseFloat(data.p));
      setChangePercent(parseFloat(data.P));
    };
    return () => ws.close();
  }, [binanceSymbol]);

  return { price, prevPrice, change, changePercent };
}

// Hook for simulated prices (forex, stocks, silver)
export function useSimulatedPrice(symbol: string) {
  const [price, setPrice] = useState(() => getSimulatedPrice(symbol));
  const [prevPrice, setPrevPrice] = useState(price);
  const baseRef = useRef(SIMULATED_BASE_PRICES[symbol] || 100);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrice(prev => {
        setPrevPrice(prev);
        // Small random walk
        const delta = (Math.random() - 0.498) * baseRef.current * 0.0008;
        const newPrice = prev + delta;
        return Math.max(newPrice, baseRef.current * 0.9);
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [symbol]);

  const change = price - baseRef.current;
  const changePercent = (change / baseRef.current) * 100;

  return { price, prevPrice, change, changePercent };
}

// Unified hook that picks the right data source
export function useAssetPrice(symbol: string, binanceSymbol?: string) {
  const binance = useBinancePrice(binanceSymbol);
  const simulated = useSimulatedPrice(symbol);

  if (binanceSymbol && binance.price > 0) {
    return binance;
  }
  return simulated;
}
