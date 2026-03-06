import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useBinanceKlines, useBinanceTicker, SUPPORTED_ASSETS } from '@/hooks/useBinanceData';
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

type ChartTab = 'chart' | 'info' | 'tradingData';

const PriceChart = ({ symbol = 'btcusdt' }: { symbol?: string }) => {
  const [interval, setInterval] = useState('1h');
  const [activeTab, setActiveTab] = useState<ChartTab>('chart');
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
    if (!chartContainerRef.current || activeTab !== 'chart') return;

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
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [activeTab]);

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

  // Compute trading data from klines
  const latestKline = klines.length > 0 ? klines[klines.length - 1] : null;
  const openPrice = klines.length > 0 ? klines[0].open : 0;
  const rangePercent = latestKline && latestKline.high > 0
    ? ((latestKline.high - latestKline.low) / latestKline.high * 100)
    : 0;

  const tabs: { key: ChartTab; label: string }[] = [
    { key: 'chart', label: 'Chart' },
    { key: 'info', label: 'Info' },
    { key: 'tradingData', label: 'Trading Data' },
  ];

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
            <span className="block text-[9px] uppercase tracking-wider">24h Vol({currentAsset.base})</span>
            <span className="font-mono text-foreground text-xs">{formatNumber(ticker.volume, 2)}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-wider">24h Vol(USDT)</span>
            <span className="font-mono text-foreground text-xs">{formatNumber(ticker.quoteVolume, 2)}</span>
          </div>
          <div className="flex items-center gap-1 text-trading-green">
            <Activity className="w-3 h-3" />
            <span className="text-[10px] font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Tab selector: Chart | Info | Trading Data */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/50">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Interval selector - only show on chart tab */}
        {activeTab === 'chart' && (
          <div className="flex items-center gap-1 ml-4 pl-4 border-l border-border/50">
            {INTERVALS.map(i => (
              <button
                key={i.value}
                onClick={() => setInterval(i.value)}
                className={`px-2 py-1 text-[11px] rounded-md font-medium transition-all ${
                  interval === i.value
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'chart' && (
        <div ref={chartContainerRef} className="flex-1 min-h-[300px]" />
      )}

      {activeTab === 'info' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Asset Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {currentAsset.base.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">{currentAsset.name}</h3>
                  <span className="text-muted-foreground text-xs">{currentAsset.base}/USDT</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Market Price', value: formatUSD(ticker.price) },
                  { label: '24h Change', value: `${isUp ? '+' : ''}${formatNumber(ticker.priceChange, 2)} (${isUp ? '+' : ''}${formatNumber(ticker.priceChangePercent, 2)}%)`, isColored: true },
                  { label: '24h High', value: formatUSD(ticker.high) },
                  { label: '24h Low', value: formatUSD(ticker.low) },
                  { label: `24h Volume (${currentAsset.base})`, value: formatNumber(ticker.volume, 2) },
                  { label: '24h Volume (USDT)', value: formatNumber(ticker.quoteVolume, 2) },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground text-sm">{row.label}</span>
                    <span className={`font-mono text-sm font-medium ${row.isColored ? (isUp ? 'text-trading-green' : 'text-trading-red') : 'text-foreground'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Links */}
            <div className="lg:w-64">
              <h4 className="font-semibold text-foreground text-sm mb-3">Links</h4>
              <div className="space-y-2">
                {currentAsset.base === 'BTC' && (
                  <>
                    <InfoLink label="Website" href="https://bitcoin.org" />
                    <InfoLink label="Block Explorer" href="https://blockchain.info" />
                    <InfoLink label="Whitepaper" href="https://bitcoin.org/bitcoin.pdf" />
                  </>
                )}
                {currentAsset.base === 'ETH' && (
                  <>
                    <InfoLink label="Website" href="https://ethereum.org" />
                    <InfoLink label="Block Explorer" href="https://etherscan.io" />
                  </>
                )}
                {currentAsset.base === 'SOL' && (
                  <>
                    <InfoLink label="Website" href="https://solana.com" />
                    <InfoLink label="Block Explorer" href="https://explorer.solana.com" />
                  </>
                )}
                {!['BTC', 'ETH', 'SOL'].includes(currentAsset.base) && (
                  <p className="text-muted-foreground text-xs">No external links available.</p>
                )}
              </div>
              <p className="text-muted-foreground text-[10px] mt-4 leading-relaxed">
                * Data is sourced from Binance public APIs and is for reference only. This information is presented on an 'as is' basis and does not serve as any form of representation or guarantee.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tradingData' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Trading Parameters */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Trading Parameters</h4>
              <div className="space-y-2.5">
                {[
                  { label: 'Open Price', value: formatUSD(latestKline?.open || 0) },
                  { label: 'High', value: formatUSD(latestKline?.high || 0) },
                  { label: 'Low', value: formatUSD(latestKline?.low || 0) },
                  { label: 'Close', value: formatUSD(latestKline?.close || 0) },
                  { label: 'Range', value: `${formatNumber(rangePercent, 2)}%` },
                  { label: 'Volume', value: formatNumber(latestKline?.volume || 0, 4) },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-muted-foreground text-xs">{row.label}</span>
                    <span className="font-mono text-xs font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Stats */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Market Statistics</h4>
              <div className="space-y-2.5">
                {[
                  { label: 'Last Price', value: formatUSD(ticker.price) },
                  { label: '24h Change', value: `${isUp ? '+' : ''}${formatNumber(ticker.priceChangePercent, 2)}%` },
                  { label: '24h High', value: formatUSD(ticker.high) },
                  { label: '24h Low', value: formatUSD(ticker.low) },
                  { label: `Volume (${currentAsset.base})`, value: formatNumber(ticker.volume, 2) },
                  { label: 'Volume (USDT)', value: formatNumber(ticker.quoteVolume, 2) },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-muted-foreground text-xs">{row.label}</span>
                    <span className="font-mono text-xs font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Candle Data Table */}
          <div className="mt-5">
            <h4 className="font-semibold text-foreground text-sm mb-3">Recent Candle Data</h4>
            <div className="overflow-auto max-h-[200px] rounded-lg border border-border/50">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Time</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Open</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">High</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Low</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Close</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {[...klines].reverse().slice(0, 20).map((k, i) => {
                    const up = k.close >= k.open;
                    return (
                      <tr key={i} className="border-t border-border/20 hover:bg-accent/20">
                        <td className="px-3 py-1.5 font-mono text-muted-foreground">
                          {new Date(k.time * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="text-right px-3 py-1.5 font-mono text-foreground">{formatNumber(k.open, 2)}</td>
                        <td className="text-right px-3 py-1.5 font-mono text-foreground">{formatNumber(k.high, 2)}</td>
                        <td className="text-right px-3 py-1.5 font-mono text-foreground">{formatNumber(k.low, 2)}</td>
                        <td className={`text-right px-3 py-1.5 font-mono font-medium ${up ? 'text-trading-green' : 'text-trading-red'}`}>
                          {formatNumber(k.close, 2)}
                        </td>
                        <td className="text-right px-3 py-1.5 font-mono text-muted-foreground">{formatNumber(k.volume, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoLink = ({ label, href }: { label: string; href: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors text-sm"
  >
    <span className="text-muted-foreground">{label}</span>
    <span className="text-primary text-xs font-medium">{new URL(href).hostname}</span>
  </a>
);

export default PriceChart;
