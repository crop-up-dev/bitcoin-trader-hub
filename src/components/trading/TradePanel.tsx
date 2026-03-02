import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Portfolio, executeTrade, formatNumber, formatUSD, formatBTC } from '@/lib/trading';
import { toast } from 'sonner';

interface TradePanelProps {
  portfolio: Portfolio;
  currentPrice: number;
  onTradeExecuted: (portfolio: Portfolio) => void;
}

const TradePanel = ({ portfolio, currentPrice, onTradeExecuted }: TradePanelProps) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');

  const effectivePrice = orderType === 'market' ? currentPrice : parseFloat(price) || 0;
  const amountNum = parseFloat(amount) || 0;
  const total = effectivePrice * amountNum;

  const maxBuy = effectivePrice > 0 ? portfolio.usdtBalance / effectivePrice : 0;
  const maxSell = portfolio.btcBalance;

  const handlePercentage = (pct: number) => {
    const max = side === 'buy' ? maxBuy : maxSell;
    setAmount((max * pct).toFixed(6));
  };

  const handleSubmit = () => {
    if (amountNum <= 0) return toast.error('Enter a valid amount');
    if (effectivePrice <= 0) return toast.error('Invalid price');

    try {
      const updated = executeTrade(portfolio, side, orderType, effectivePrice, amountNum);
      onTradeExecuted(updated);
      setAmount('');
      setPrice('');
      toast.success(
        `${side === 'buy' ? 'Sent' : 'Received'} ${formatBTC(amountNum)} BTC @ ${formatUSD(effectivePrice)}`,
        { description: `Total: ${formatUSD(total)}` }
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 border-b border-border/50">
        <span className="section-header">Trade</span>
      </div>

      {/* Buy/Sell tabs */}
      <div className="grid grid-cols-2 mx-3 mt-3 rounded-lg overflow-hidden">
        <button
          onClick={() => setSide('buy')}
          className={`py-2.5 text-sm font-semibold transition-all ${
            side === 'buy' ? 'bg-trading-green text-primary-foreground glow-green' : 'bg-secondary text-muted-foreground hover:bg-accent'
          }`}
        >
          Send
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`py-2.5 text-sm font-semibold transition-all ${
            side === 'sell' ? 'bg-trading-red text-primary-foreground glow-red' : 'bg-secondary text-muted-foreground hover:bg-accent'
          }`}
        >
          Receive
        </button>
      </div>

      {/* Order type */}
      <div className="flex gap-1 px-3 pt-3">
        {(['market', 'limit'] as const).map(t => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`px-3 py-1 text-[11px] rounded-md font-medium transition-all ${
              orderType === t ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3">
        {/* Available balance */}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Available</span>
          <span className="font-mono text-foreground">
            {side === 'buy' ? formatUSD(portfolio.usdtBalance) : `${formatBTC(portfolio.btcBalance)} BTC`}
          </span>
        </div>

        {/* Price input */}
        {orderType === 'limit' ? (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Price (USDT)</label>
            <Input
              type="number"
              placeholder="Limit price"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="font-mono bg-secondary/50 border-border/50 h-9 text-sm"
            />
          </div>
        ) : (
          <div className="flex justify-between text-xs py-1.5 px-2.5 rounded-md bg-secondary/30">
            <span className="text-muted-foreground">Market Price</span>
            <span className="font-mono text-foreground">{formatUSD(currentPrice)}</span>
          </div>
        )}

        {/* Receiver address */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Receiver Address</label>
          <Input
            placeholder="Wallet address"
            value={receiverAddress}
            onChange={e => setReceiverAddress(e.target.value)}
            className="font-mono bg-secondary/50 border-border/50 h-9 text-[11px]"
          />
        </div>

        {/* Amount input */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Amount (BTC)</label>
          <Input
            type="number"
            placeholder="0.000000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="font-mono bg-secondary/50 border-border/50 h-9 text-sm"
          />
        </div>

        {/* Percentage buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {[0.25, 0.5, 0.75, 1].map(pct => (
            <button
              key={pct}
              onClick={() => handlePercentage(pct)}
              className="py-1.5 text-[10px] font-medium rounded-md bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              {pct * 100}%
            </button>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between text-xs pt-2 border-t border-border/30">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono text-foreground font-medium">{formatUSD(total)}</span>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          className={`w-full font-semibold h-10 text-sm ${
            side === 'buy' ? 'bg-trading-green hover:bg-trading-green/90 glow-green' : 'bg-trading-red hover:bg-trading-red/90 glow-red'
          } text-primary-foreground`}
        >
          {side === 'buy' ? 'Send' : 'Receive'} BTC
        </Button>
      </div>
    </div>
  );
};

export default TradePanel;
