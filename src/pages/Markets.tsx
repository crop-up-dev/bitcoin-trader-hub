import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { COMMODITY_ASSETS, FOREX_ASSETS, STOCK_ASSETS, AssetDefinition } from '@/lib/assets';
import { useAssetPrice } from '@/hooks/useMarketData';
import { formatNumber } from '@/lib/trading';

const AssetRow = ({ asset }: { asset: AssetDefinition }) => {
  const { price, change, changePercent } = useAssetPrice(asset.symbol, asset.binanceSymbol);
  const isUp = changePercent >= 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/30 transition-all">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: asset.color + '18', color: asset.color }}
        >
          {asset.icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{asset.symbol}</div>
          <div className="text-xs text-muted-foreground">{asset.name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-mono font-medium text-foreground">
          ${formatNumber(price, asset.decimals)}
        </div>
        <div className={`flex items-center gap-1 text-xs font-mono justify-end ${isUp ? 'text-trading-green' : 'text-trading-red'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? '+' : ''}{formatNumber(changePercent, 2)}%
        </div>
      </div>
    </div>
  );
};

const Markets = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'commodities' | 'forex' | 'stocks'>('commodities');

  const tabs = [
    { key: 'commodities' as const, label: 'Commodities', assets: COMMODITY_ASSETS },
    { key: 'forex' as const, label: 'Forex', assets: FOREX_ASSETS },
    { key: 'stocks' as const, label: 'Stocks', assets: STOCK_ASSETS },
  ];

  const currentTab = tabs.find(t => t.key === activeTab)!;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Markets</h1>
            <p className="text-xs text-muted-foreground">Commodities, Forex & Stocks</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground glow-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Asset List */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="section-header mb-4">{currentTab.label}</h3>
          <div className="space-y-1">
            {currentTab.assets.map(asset => (
              <AssetRow key={asset.symbol} asset={asset} />
            ))}
          </div>
        </div>

        {/* Trade Panel for selected class */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="section-header mb-4">Quick Trade</h3>
          <p className="text-xs text-muted-foreground">
            Select an asset above to trade. Use the main trading dashboard for advanced charting and order types.
          </p>
          <Button onClick={() => navigate('/')} className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90">
            Go to Trading Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Markets;
