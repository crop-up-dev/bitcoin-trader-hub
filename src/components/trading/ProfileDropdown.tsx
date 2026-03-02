import { useState } from 'react';
import { UserProfile, getInitials, getAvatarColor, saveProfile } from '@/lib/profile';
import { Portfolio, formatUSD } from '@/lib/trading';
import { getCurrentUser, logout } from '@/lib/auth';
import { User, Settings, LogOut, ChevronDown, Wallet, ShieldCheck, BarChart3, ArrowLeftRight, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProfileDropdownProps {
  profile: UserProfile;
  portfolio: Portfolio;
  currentPrice: number;
  onProfileUpdate: (profile: UserProfile) => void;
  onResetAccount: () => void;
}

const ProfileDropdown = ({ profile, portfolio, currentPrice, onProfileUpdate, onResetAccount }: ProfileDropdownProps) => {
  const navigate = useNavigate();
  const authUser = getCurrentUser();
  const totalValue = portfolio.usdtBalance + portfolio.btcBalance * currentPrice;
  const pnl = totalValue - 10000;
  const initials = getInitials(profile.displayName);
  const avatarColor = getAvatarColor(profile.displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors outline-none">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: avatarColor + '22', color: avatarColor, border: `1.5px solid ${avatarColor}44` }}
        >
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-medium text-foreground leading-tight">{profile.displayName}</div>
          <div className={`text-[10px] font-mono leading-tight ${pnl >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
            {formatUSD(totalValue)}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 glass-panel">
        <div className="px-3 py-2.5">
          <div className="text-sm font-semibold text-foreground">{profile.displayName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Paper Trading Account</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-sm font-mono font-bold text-foreground">{formatUSD(totalValue)}</div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${pnl >= 0 ? 'bg-trading-green/10 text-trading-green' : 'bg-trading-red/10 text-trading-red'}`}>
              {pnl >= 0 ? '+' : ''}{formatUSD(pnl)}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
          <User className="w-4 h-4 mr-2" />
          View Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/wallet')} className="cursor-pointer">
          <Wallet className="w-4 h-4 mr-2" />
          Wallet
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/markets')} className="cursor-pointer">
          <BarChart3 className="w-4 h-4 mr-2" />
          Markets
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/binary')} className="cursor-pointer">
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          Binary Trading
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/neft')} className="cursor-pointer">
          <Building2 className="w-4 h-4 mr-2" />
          NEFT Transfer
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>

        {authUser?.role === 'admin' && (
          <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Admin Panel
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
