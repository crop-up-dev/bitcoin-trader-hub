import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Building2, CheckCircle2, Clock } from 'lucide-react';
import { formatUSD, formatNumber } from '@/lib/trading';
import { loadPortfolio } from '@/lib/trading';
import { toast } from 'sonner';

interface NEFTTransfer {
  id: string;
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  amount: number;
  timestamp: number;
  status: 'processing' | 'completed';
}

const NEFT = () => {
  const navigate = useNavigate();
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [amount, setAmount] = useState('');
  const [transfers, setTransfers] = useState<NEFTTransfer[]>([]);
  const portfolio = loadPortfolio();

  const handleTransfer = () => {
    if (!beneficiaryName.trim()) return toast.error('Enter beneficiary name');
    if (!accountNumber.trim() || accountNumber.length < 8) return toast.error('Enter a valid account number');
    if (!ifscCode.trim() || ifscCode.length < 11) return toast.error('Enter a valid IFSC code');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > portfolio.usdtBalance) return toast.error('Insufficient balance');

    const transfer: NEFTTransfer = {
      id: crypto.randomUUID(),
      beneficiaryName: beneficiaryName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      amount: amt,
      timestamp: Date.now(),
      status: 'processing',
    };

    setTransfers(prev => [transfer, ...prev]);
    setBeneficiaryName('');
    setAccountNumber('');
    setIfscCode('');
    setAmount('');

    toast.success(`NEFT transfer initiated: ${formatUSD(amt)}`, {
      description: `To: ${beneficiaryName} (${accountNumber.slice(-4)})`,
    });

    // Simulate completion after 5 seconds
    setTimeout(() => {
      setTransfers(prev => prev.map(t => t.id === transfer.id ? { ...t, status: 'completed' } : t));
      toast.success('NEFT transfer completed', { description: `${formatUSD(amt)} sent to ${beneficiaryName}` });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> NEFT Transfer
            </h1>
            <p className="text-xs text-muted-foreground">National Electronic Funds Transfer</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Balance */}
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
          <p className="text-2xl font-mono font-bold text-foreground">{formatUSD(portfolio.usdtBalance)}</p>
        </div>

        {/* Transfer form */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h3 className="section-header">New Transfer</h3>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Beneficiary Name</label>
            <Input
              placeholder="Full name"
              value={beneficiaryName}
              onChange={e => setBeneficiaryName(e.target.value)}
              className="bg-secondary/50 border-border/50 h-10 text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Account Number</label>
            <Input
              placeholder="Enter account number"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              className="font-mono bg-secondary/50 border-border/50 h-10 text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">IFSC Code</label>
            <Input
              placeholder="e.g., SBIN0001234"
              value={ifscCode}
              onChange={e => setIfscCode(e.target.value.toUpperCase())}
              className="font-mono bg-secondary/50 border-border/50 h-10 text-sm uppercase"
              maxLength={11}
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount (USD)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="font-mono bg-secondary/50 border-border/50 h-10 text-sm"
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[100, 500, 1000, 5000].map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="py-1.5 text-[10px] font-medium rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                ${formatNumber(amt, 0)}
              </button>
            ))}
          </div>

          <Button
            onClick={handleTransfer}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11 gap-2"
          >
            <Building2 className="w-4 h-4" /> Initiate NEFT Transfer
          </Button>

          <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-primary font-medium">Note:</span> NEFT transfers are processed in batches.
              Settlement typically takes 30 minutes to 2 hours during banking hours.
            </p>
          </div>
        </div>

        {/* Transfer history */}
        {transfers.length > 0 && (
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="section-header mb-3">Transfer History</h3>
            <div className="space-y-2">
              {transfers.map(transfer => (
                <div key={transfer.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20">
                  <div className="flex items-center gap-3">
                    {transfer.status === 'completed'
                      ? <CheckCircle2 className="w-4 h-4 text-trading-green" />
                      : <Clock className="w-4 h-4 text-primary animate-pulse" />
                    }
                    <div>
                      <p className="text-sm font-medium text-foreground">{transfer.beneficiaryName}</p>
                      <p className="text-xs text-muted-foreground">A/C: ****{transfer.accountNumber.slice(-4)} • {transfer.ifscCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium text-foreground">{formatUSD(transfer.amount)}</p>
                    <p className={`text-[10px] font-medium ${transfer.status === 'completed' ? 'text-trading-green' : 'text-primary'}`}>
                      {transfer.status === 'completed' ? 'Completed' : 'Processing...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NEFT;
