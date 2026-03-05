import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/auth';
import { getUserTransactions } from '@/lib/transactions';
import { formatNumber } from '@/lib/trading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FileBarChart, Download } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const Statements = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const handleExport = () => {
    const doc = new jsPDF();
    const userTxns = currentUser ? getUserTransactions(currentUser.id) : [];

    // Filter by date range
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    const filtered = userTxns.filter(t => t.createdAt >= start && t.createdAt <= end);

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('HUB - Account Statement', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Account: ${currentUser?.displayName || 'N/A'} (${currentUser?.email || 'N/A'})`, 14, 30);
    doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 14, 36);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);

    // Line
    doc.setDrawColor(200);
    doc.line(14, 46, 196, 46);

    if (filtered.length === 0) {
      doc.setFontSize(12);
      doc.text('No transactions found for the selected period.', 14, 56);
    } else {
      // Table header
      let y = 54;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 14, y);
      doc.text('Type', 50, y);
      doc.text('Asset', 80, y);
      doc.text('Amount', 105, y);
      doc.text('Fee', 135, y);
      doc.text('Status', 165, y);
      y += 2;
      doc.line(14, y, 196, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      filtered.forEach(txn => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(new Date(txn.createdAt).toLocaleDateString(), 14, y);
        doc.text(txn.type === 'send' ? 'Withdrawal' : 'Deposit', 50, y);
        doc.text(txn.asset, 80, y);
        doc.text(formatNumber(txn.amount, 2), 105, y);
        doc.text(String(txn.fee), 135, y);
        doc.text(txn.status, 165, y);
        y += 7;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This statement is generated automatically by HUB Trading Platform.', 14, 285);

    doc.save(`HUB_Statement_${startDate}_to_${endDate}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground flex-1">Statement</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileBarChart className="w-10 h-10 text-primary" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">Account statement</h2>
          <p className="text-sm text-muted-foreground">
            Get a record of your account transactions and trading activities.
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-secondary/50 border-border/50 h-12 text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-secondary/50 border-border/50 h-12 text-foreground"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleExport} className="w-full h-12 text-base font-semibold bg-foreground text-background hover:bg-foreground/90 gap-2">
          <Download className="w-5 h-5" /> EXPORT PDF
        </Button>
      </div>
    </div>
  );
};

export default Statements;
