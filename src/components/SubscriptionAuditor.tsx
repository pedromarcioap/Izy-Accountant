import { useMemo } from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../lib/utils';
import { Repeat, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

export function SubscriptionAuditor() {
  const { transactions, removeTransaction } = useStore();

  const subscriptions = useMemo(() => {
    // Group transactions by description to find recurring ones
    const grouped = transactions.reduce((acc, tx) => {
      if (tx.type === 'fixed' && !tx.isInstallment) {
        if (!acc[tx.description]) {
          acc[tx.description] = [];
        }
        acc[tx.description].push(tx);
      }
      return acc;
    }, {} as Record<string, typeof transactions>);

    return Object.entries(grouped).map(([name, txs]) => {
      // Sort by date descending
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const latestAmount = txs[0].amount;
      const previousAmount = txs.length > 1 ? txs[1].amount : latestAmount;
      const hasIncreased = latestAmount > previousAmount;
      
      return {
        id: txs[0].id, // Use latest tx id as a key
        name,
        amount: latestAmount,
        previousAmount,
        hasIncreased,
        frequency: 'Monthly',
        lastBilled: txs[0].date,
        transactions: txs
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-navy-900">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Subscription Auditor</h1>
        <p className="text-slate-400 mt-1">Identify and manage your recurring charges.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-navy-800 p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Total Monthly Subscriptions</h3>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalMonthly)}</div>
          <div className="mt-2 text-sm text-slate-500">{subscriptions.length} active subscriptions</div>
        </div>
        
        <div className="bg-navy-800 p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Yearly Projection</h3>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalMonthly * 12)}</div>
          <div className="mt-2 text-sm text-slate-500">If nothing changes</div>
        </div>
      </div>

      <div className="bg-navy-800 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-amethyst-400" />
            Active Subscriptions
          </h2>
        </div>
        
        <div className="divide-y divide-slate-700/50">
          {subscriptions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No recurring subscriptions found.
            </div>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-navy-700/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-900 border border-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{sub.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                      <span>Billed {sub.frequency}</span>
                      <span>•</span>
                      <span>Last: {new Date(sub.lastBilled).toLocaleDateString()}</span>
                    </div>
                    {sub.hasIncreased && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full w-fit">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Price increased from {formatCurrency(sub.previousAmount)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{formatCurrency(sub.amount)}</div>
                    <div className="text-xs text-slate-500">per month</div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove all transaction records for ${sub.name}?`)) {
                        sub.transactions.forEach(t => removeTransaction(t.id));
                      }
                    }}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Subscription Records"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
