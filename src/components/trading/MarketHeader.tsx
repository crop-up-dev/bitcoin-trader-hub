import { useBinanceTicker, SUPPORTED_ASSETS } from '@/hooks/useBinanceData';
import { UserProfile } from '@/lib/profile';
import { Portfolio } from '@/lib/trading';
import { ChevronDown } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MarketHeaderProps {
  profile: UserProfile;
  portfolio: Portfolio;
  onProfileUpdate: (profile: UserProfile) => void;
  onResetAccount: () => void;
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const MarketHeader = ({ profile, portfolio, onProfileUpdate, onResetAccount, selectedSymbol, onSymbolChange }: MarketHeaderProps) => {
  const navigate = useNavigate();
  const { ticker } = useBinanceTicker(selectedSymbol);
  const currentAsset = SUPPORTED_ASSETS.find(a => a.symbol === selectedSymbol) || SUPPORTED_ASSETS[0];

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center glow-primary">
            <span className="text-primary font-bold text-sm tracking-tight">H</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-primary text-sm tracking-wide">HUB</span>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground text-[11px] hover:text-foreground transition-colors cursor-pointer">
                  {currentAsset.base}/USDT <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                  {SUPPORTED_ASSETS.map(asset => (
                    <DropdownMenuItem
                      key={asset.symbol}
                      onClick={() => onSymbolChange(asset.symbol)}
                      className={`font-mono text-xs ${selectedSymbol === asset.symbol ? 'bg-accent' : ''}`}
                    >
                      {asset.base}/USDT
                      <span className="ml-auto text-muted-foreground text-[10px]">{asset.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => navigate('/payments')}
          size="sm"
          className="bg-trading-green hover:bg-trading-green/90 text-primary-foreground gap-1.5 h-8 text-xs font-semibold"
        >
          Deposit
        </Button>
        <ProfileDropdown
          profile={profile}
          portfolio={portfolio}
          currentPrice={ticker.price}
          onProfileUpdate={onProfileUpdate}
          onResetAccount={onResetAccount}
        />
      </div>
    </header>
  );
};

export default MarketHeader;
