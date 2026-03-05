import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useBinanceKlines, useBinanceTicker, SUPPORTED_ASSETS, TickerData } from '@/hooks/useBinanceData';
import { formatNumber, formatUSD } from '@/lib/trading';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1M' },
];

const PriceChart = ({ symbol = 'btcusdt' }: { symbol?: string }) => {
  const [interval, setInterval] = useState('1h');
  const klines = useBinanceKlines(symbol, interval);
  const { ticker, prevPrice } = useBinanceTicker(symbol);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  const currentAsset = SUPPORTED_ASSETS.find(a => a.symbol === symbol) || SUPPORTED_ASSETS[0];
  const isUp = ticker.priceChangePercent >= 0;
  const priceDirection = ticker.price > prevPrice ? 'up' : ticker.price < prevPrice ? 'down' : 'same';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(218, 15%, 48%)',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'hsl(225, 14%, 10%)' },
        horzLines: { color: 'hsl(225, 14%, 10%)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'hsl(47, 100%, 50%)', width: 1, style: 2, labelBackgroundColor: 'hsl(47, 100%, 50%)' },
        horzLine: { color: 'hsl(47, 100%, 50%)', width: 1, style: 2, labelBackgroundColor: 'hsl(47, 100%, 50%)' },
      },
      rightPriceScale: {
        borderColor: 'hsl(225, 14%, 14%)',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: 'hsl(225, 14%, 14%)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(152, 69%, 46%)',
      downColor: 'hsl(354, 70%, 54%)',
      borderDownColor: 'hsl(354, 70%, 54%)',
      borderUpColor: 'hsl(152, 69%, 46%)',
      wickDownColor: 'hsl(354, 70%, 54%)',
      wickUpColor: 'hsl(152, 69%, 46%)',
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || klines.length === 0) return;

    candleSeriesRef.current.setData(klines);
    volumeSeriesRef.current.setData(
      klines.map(k => ({
        time: k.time,
        value: k.volume,
        color: k.close >= k.open ? 'hsla(152, 69%, 46%, 0.2)' : 'hsla(354, 70%, 54%, 0.2)',
      }))
    );
  }, [klines]);

  return (
    <div className="flex flex-col h-full">
      {/* Binance-style price info bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{currentAsset.base}/USDT</span>
          <span className={`font-mono text-lg font-bold tracking-tight ${priceDirection === 'up' ? 'text-trading-green' : priceDirection === 'down' ? 'text-trading-red' : 'text-foreground'}`}>
            {formatUSD(ticker.price)}
          </span>
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${isUp ? 'bg-trading-green/10 text-trading-green' : 'bg-trading-red/10 text-trading-red'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? '+' : ''}{formatNumber(ticker.priceChangePercent)}%
          </div>
        </div>
        <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
          <div>
            <span className="block text-[9px] uppercase tracking-wider">24h High</span>
            <span className="font-mono text-foreground text-xs">{formatUSD(ticker.high)}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-wider">24h Low</span>
            <span className="font-mono text-foreground text-xs">{formatUSD(ticker.low)}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-wider">24h Vol</span>
            <span className="font-mono text-foreground text-xs">{formatNumber(ticker.volume, 2)} {currentAsset.base}</span>
          </div>
          <div className="flex items-center gap-1 text-trading-green">
            <Activity className="w-3 h-3" />
            <span className="text-[10px] font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Interval selector */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/50">
        {INTERVALS.map(i => (
          <button
            key={i.value}
            onClick={() => setInterval(i.value)}
            className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
              interval === i.value
                ? 'bg-primary/15 text-primary glow-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>
      <div ref={chartContainerRef} className="flex-1 min-h-[300px]" />
    </div>
  );
};

export default PriceChart;
