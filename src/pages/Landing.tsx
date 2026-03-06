import { Link } from 'react-router-dom';
import { useBinanceTicker, SUPPORTED_ASSETS } from '@/hooks/useBinanceData';
import { formatNumber } from '@/lib/trading';
import { TrendingUp, TrendingDown, Shield, Zap, BarChart3, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const TickerRow = ({ symbol, name }: { symbol: string; name: string }) => {
  const { ticker } = useBinanceTicker(symbol);
  const isUp = ticker.priceChangePercent >= 0;

  if (ticker.price === 0) return null;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {name.charAt(0)}
        </div>
        <div>
          <span className="font-semibold text-foreground text-sm">{name}</span>
          <span className="block text-[11px] text-muted-foreground">{symbol.replace('usdt', '').toUpperCase()}/USDT</span>
        </div>
      </div>
      <div className="text-right">
        <span className="font-mono text-sm font-semibold text-foreground">
          ${formatNumber(ticker.price, 2)}
        </span>
        <div className={`flex items-center justify-end gap-0.5 text-[11px] font-mono font-medium ${isUp ? 'text-trading-green' : 'text-trading-red'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? '+' : ''}{formatNumber(ticker.priceChangePercent, 2)}%
        </div>
      </div>
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <span className="text-primary font-bold text-base tracking-tight">H</span>
          </div>
          <span className="font-bold text-primary text-lg tracking-wide">HUB</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-primary font-medium">
              Log In
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Trade Crypto, Forex & More<br />
            <span className="text-primary">All in One Place</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8">
            Access real-time markets, advanced charting, and seamless trading across cryptocurrencies, commodities, forex, and stocks.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 px-8">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-border hover:border-primary/50 font-semibold px-8">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Market Prices */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Live Market Prices</h2>
          <p className="text-muted-foreground text-sm">Real-time data from Binance</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SUPPORTED_ASSETS.map(asset => (
            <TickerRow key={asset.symbol} symbol={asset.symbol} name={asset.name} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: 'Advanced Charts', desc: 'Professional-grade candlestick charts with real-time data' },
              { icon: Zap, title: 'Instant Execution', desc: 'Lightning-fast market and limit order execution' },
              { icon: Shield, title: 'Secure Trading', desc: 'Admin-managed transactions with full audit trail' },
              { icon: Globe, title: 'Multi-Asset', desc: 'Crypto, Forex, Commodities, Stocks & NFT Tokens' },
            ].map(f => (
              <div key={f.title} className="p-5 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all">
                <f.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center">
        <p className="text-muted-foreground text-xs">© {new Date().getFullYear()} HUB Trading Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
