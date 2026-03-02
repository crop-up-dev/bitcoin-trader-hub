import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Trophy, XCircle } from 'lucide-react';
import { ALL_ASSETS, AssetDefinition } from '@/lib/assets';
import { useAssetPrice } from '@/hooks/useMarketData';
import { formatNumber, formatUSD } from '@/lib/trading';
import { toast } from 'sonner';

interface BinaryTrade {
  id: string;
  asset: string;
  direction: 'call' | 'put';
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  expiresAt: number;
  result?: 'win' | 'loss';
  payout: number;
}

const DURATIONS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
];

const PAYOUT_RATE = 0.85; // 85% payout

const BinaryTrading = () => {
  const navigate = useNavigate();
  const [selectedAsset, setSelectedAsset] = useState<AssetDefinition>(ALL_ASSETS[0]);
  const [amount, setAmount] = useState('100');
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [trades, setTrades] = useState<BinaryTrade[]>([]);
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('binary-balance');
    return saved ? parseFloat(saved) : 10000;
  });

  const { price, prevPrice, changePercent } = useAssetPrice(selectedAsset.symbol, selectedAsset.binanceSymbol);
  const isUp = changePercent >= 0;

  // Save balance
  useEffect(() => {
    localStorage.setItem('binary-balance', balance.toString());
  }, [balance]);

  // Check expired trades
  useEffect(() => {
    const interval = setInterval(() => {
      setTrades(prev => prev.map(trade => {
        if (trade.result || Date.now() < trade.expiresAt) return trade;
        const currentPrice = price;
        const won = trade.direction === 'call'
          ? currentPrice > trade.entryPrice
          : currentPrice < trade.entryPrice;
        const result: 'win' | 'loss' = won ? 'win' : 'loss';
        if (won) {
          setBalance(b => b + trade.amount + trade.payout);
          toast.success(`Won! +${formatUSD(trade.payout)}`, { description: `${trade.asset} ${trade.direction.toUpperCase()}` });
        } else {
          toast.error(`Lost ${formatUSD(trade.amount)}`, { description: `${trade.asset} ${trade.direction.toUpperCase()}` });
        }
        return { ...trade, exitPrice: currentPrice, result };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [price]);

  const placeTrade = useCallback((direction: 'call' | 'put') => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > balance) return toast.error('Insufficient balance');
    if (price <= 0) return toast.error('Waiting for price data...');

    setBalance(b => b - amt);
    const trade: BinaryTrade = {
      id: crypto.randomUUID(),
      asset: selectedAsset.symbol,
      direction,
      amount: amt,
      entryPrice: price,
      expiresAt: Date.now() + duration.seconds * 1000,
      payout: amt * PAYOUT_RATE,
    };
    setTrades(prev => [trade, ...prev]);
    toast.success(`${direction === 'call' ? 'BUY' : 'SELL'} placed on ${selectedAsset.symbol}`, {
      description: `${formatUSD(amt)} • Expires in ${duration.label}`,
    });
  }, [amount, balance, price, selectedAsset, duration]);

  const activeTrades = trades.filter(t => !t.result);
  const completedTrades = trades.filter(t => t.result).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Binary Trading</h1>
            <p className="text-xs text-muted-foreground">Predict price direction • {PAYOUT_RATE * 100}% payout</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p>
            <p className="text-lg font-mono font-bold text-foreground">{formatUSD(balance)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Asset selector */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_ASSETS.slice(0, 12).map(asset => (
            <button
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedAsset.symbol === asset.symbol
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {asset.icon} {asset.symbol}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Price display */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{selectedAsset.name}</p>
              <div className={`text-4xl font-mono font-bold ${isUp ? 'text-trading-green' : 'text-trading-red'}`}>
                ${formatNumber(price, selectedAsset.decimals)}
              </div>
              <div className={`flex items-center justify-center gap-1 mt-2 text-sm font-mono ${isUp ? 'text-trading-green' : 'text-trading-red'}`}>
                {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isUp ? '+' : ''}{formatNumber(changePercent, 2)}%
              </div>
            </div>

            {/* Active trades */}
            {activeTrades.length > 0 && (
              <div>
                <h3 className="section-header mb-3">Active Trades</h3>
                <div className="space-y-2">
                  {activeTrades.map(trade => {
                    const remaining = Math.max(0, Math.ceil((trade.expiresAt - Date.now()) / 1000));
                    return (
                      <div key={trade.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-[10px] font-bold ${
                            trade.direction === 'call' ? 'bg-trading-green/20 text-trading-green' : 'bg-trading-red/20 text-trading-red'
                          }`}>
                            {trade.direction === 'call' ? 'BUY' : 'SELL'}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">{trade.asset}</span>
                            <span className="text-xs text-muted-foreground ml-2">@ ${formatNumber(trade.entryPrice, 2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-foreground">{formatUSD(trade.amount)}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {remaining}s
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* History */}
            {completedTrades.length > 0 && (
              <div>
                <h3 className="section-header mb-3">Recent Results</h3>
                <div className="space-y-1">
                  {completedTrades.map(trade => (
                    <div key={trade.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/20">
                      <div className="flex items-center gap-2">
                        {trade.result === 'win'
                          ? <Trophy className="w-3.5 h-3.5 text-trading-green" />
                          : <XCircle className="w-3.5 h-3.5 text-trading-red" />
                        }
                        <span className="text-xs text-foreground">{trade.asset}</span>
                        <span className={`text-[10px] font-medium ${trade.direction === 'call' ? 'text-trading-green' : 'text-trading-red'}`}>
                          {trade.direction === 'call' ? 'BUY' : 'SELL'}
                        </span>
                      </div>
                      <span className={`text-xs font-mono font-medium ${trade.result === 'win' ? 'text-trading-green' : 'text-trading-red'}`}>
                        {trade.result === 'win' ? `+${formatUSD(trade.payout)}` : `-${formatUSD(trade.amount)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Trade panel */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 h-fit">
            <h3 className="section-header">Place Trade</h3>

            {/* Duration */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Duration</label>
              <div className="grid grid-cols-4 gap-1.5">
                {DURATIONS.map(d => (
                  <button
                    key={d.label}
                    onClick={() => setDuration(d)}
                    className={`py-2 text-xs font-medium rounded-lg transition-all ${
                      duration.label === d.label
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                        : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="100"
                className="font-mono bg-secondary/50 border-border/50 h-10 text-sm"
              />
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-1.5">
              {[50, 100, 250, 500].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className="py-1.5 text-[10px] font-medium rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Payout info */}
            <div className="flex justify-between text-xs bg-secondary/30 rounded-lg px-3 py-2.5">
              <span className="text-muted-foreground">Potential Payout</span>
              <span className="font-mono text-trading-green font-medium">
                {formatUSD((parseFloat(amount) || 0) * (1 + PAYOUT_RATE))}
              </span>
            </div>

            {/* Buy/Sell buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => placeTrade('call')}
                className="h-14 bg-trading-green hover:bg-trading-green/90 text-primary-foreground font-bold text-base glow-green flex flex-col gap-0.5"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">BUY (Call)</span>
              </Button>
              <Button
                onClick={() => placeTrade('put')}
                className="h-14 bg-trading-red hover:bg-trading-red/90 text-primary-foreground font-bold text-base glow-red flex flex-col gap-0.5"
              >
                <TrendingDown className="w-5 h-5" />
                <span className="text-xs">SELL (Put)</span>
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Predict if {selectedAsset.symbol} will go up or down within {duration.label}. Win {PAYOUT_RATE * 100}% on correct predictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinaryTrading;
