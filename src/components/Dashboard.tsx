import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, CreditCard, Calendar, TrendingUp, Bell, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useStore } from '../store';
import { format, isSameMonth, parseISO, addMonths, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { TransactionModal } from './TransactionModal';
import { Transaction } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#A855F7',
  'Transport': '#34D399',
  'Subscriptions': '#F43F5E',
  'Shopping': '#3B82F6',
  'Entertainment': '#FBBF24',
  'Health': '#14B8A6',
  'Other': '#94A3B8'
};

export function Dashboard() {
  const { transactions, cards, removeTransaction } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsTransactionModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      removeTransaction(id);
    }
  };

  const metrics = useMemo(() => {
    const currentMonthTx = transactions.filter(t => isSameMonth(parseISO(t.date), currentDate));
    const lastMonthTx = transactions.filter(t => isSameMonth(parseISO(t.date), addMonths(currentDate, -1)));

    const currentBill = currentMonthTx.reduce((sum, t) => sum + t.amount, 0);
    const lastMonthBill = lastMonthTx.reduce((sum, t) => sum + t.amount, 0);
    const billChange = lastMonthBill ? ((currentBill - lastMonthBill) / lastMonthBill) * 100 : 0;

    const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
    
    // Calculate total unpaid (all transactions for now, as there's no "pay bill" feature)
    const totalUnpaid = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    const availableLimit = Math.max(0, totalLimit - totalUnpaid);
    const limitUsedPercent = totalLimit ? (totalUnpaid / totalLimit) * 100 : 0;

    const currentFixed = currentMonthTx.filter(t => t.type === 'fixed').reduce((sum, t) => sum + t.amount, 0);
    const lastMonthFixed = lastMonthTx.filter(t => t.type === 'fixed').reduce((sum, t) => sum + t.amount, 0);
    const fixedChange = lastMonthFixed ? ((currentFixed - lastMonthFixed) / lastMonthFixed) * 100 : 0;

    // Categories Data
    const categoryMap = currentMonthTx.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Other']
      }))
      .sort((a, b) => b.value - a.value);

    // Crystal Ball Projection (Next 6 months)
    const futureBills = Array.from({ length: 6 }).map((_, i) => {
      const targetMonth = addMonths(currentDate, i + 1);
      
      // Fixed expenses (assume they repeat)
      const fixed = currentFixed;
      
      // Installments that fall into this month
      const installments = transactions
        .filter(t => t.isInstallment && t.totalInstallments)
        .reduce((sum, t) => {
          const txDate = parseISO(t.date);
          const card = cards.find(c => c.id === t.cardId);
          
          let firstInstallmentMonth = txDate;
          if (card && txDate.getDate() > card.closingDay) {
            firstInstallmentMonth = addMonths(txDate, 1);
          }

          const monthsDiff = (targetMonth.getFullYear() - firstInstallmentMonth.getFullYear()) * 12 + (targetMonth.getMonth() - firstInstallmentMonth.getMonth());
          const projectedInstallment = monthsDiff + 1;
          
          if (projectedInstallment <= t.totalInstallments! && projectedInstallment > 0) {
            return sum + t.amount;
          }
          return sum;
        }, 0);

      // Variable (Est.) - Average of last 3 months variable spending
      const variable = 800; // Simplified estimation for now

      return {
        month: format(targetMonth, 'MMM'),
        fixed,
        installments,
        variable
      };
    });

    return {
      currentBill,
      billChange,
      availableLimit,
      limitUsedPercent,
      currentFixed,
      fixedChange,
      categoryData,
      futureBills
    };
  }, [transactions, cards, currentDate]);

  // Billing Cycle Alerts
  const upcomingClosures = useMemo(() => {
    return cards.map(card => {
      const today = new Date();
      let closingDate = new Date(today.getFullYear(), today.getMonth(), card.closingDay);
      if (isBefore(closingDate, today)) {
        closingDate = addMonths(closingDate, 1);
      }
      const daysUntilClose = Math.ceil((closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { card, daysUntilClose, closingDate };
    }).filter(c => c.daysUntilClose <= 5).sort((a, b) => a.daysUntilClose - b.daysUntilClose);
  }, [cards]);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-navy-900">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-slate-400 mt-1">Your financial clairvoyance panel.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center bg-navy-800 rounded-lg border border-slate-700/50 overflow-hidden">
            <button 
              onClick={() => setCurrentDate(prev => addMonths(prev, -1))}
              className="px-3 py-2 hover:bg-navy-700 text-slate-400 hover:text-white transition-colors"
            >
              &lt;
            </button>
            <div className="px-4 py-2 text-white font-medium flex items-center gap-2 min-w-[140px] justify-center">
              <Calendar className="w-4 h-4" />
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button 
              onClick={() => setCurrentDate(prev => addMonths(prev, 1))}
              className="px-3 py-2 hover:bg-navy-700 text-slate-400 hover:text-white transition-colors"
            >
              &gt;
            </button>
          </div>
          <button 
            onClick={() => setIsTransactionModalOpen(true)}
            className="px-4 py-2 bg-amethyst-600 hover:bg-amethyst-500 text-white rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </header>

      {upcomingClosures.length > 0 && (
        <div className="mb-8 space-y-3">
          {upcomingClosures.map(({ card, daysUntilClose }) => (
            <div key={card.id} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-amber-400 font-medium">Billing Cycle Closing Soon</h4>
                <p className="text-sm text-amber-400/80">
                  Your {card.name} card closes in {daysUntilClose} {daysUntilClose === 1 ? 'day' : 'days'}. Avoid large purchases!
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-navy-800 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amethyst-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
          <h3 className="text-sm font-medium text-slate-400 mb-2">Current Bill</h3>
          <div className="text-3xl font-bold text-white mb-4">{formatCurrency(metrics.currentBill)}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn(
              "flex items-center px-2 py-0.5 rounded",
              metrics.billChange > 0 ? "text-rose-500 bg-rose-500/10" : "text-emerald-500 bg-emerald-500/10"
            )}>
              {metrics.billChange > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(metrics.billChange).toFixed(1)}%
            </span>
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>

        <div className="bg-navy-800 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
          <h3 className="text-sm font-medium text-slate-400 mb-2">Available Limit</h3>
          <div className="text-3xl font-bold text-white mb-4">{formatCurrency(metrics.availableLimit)}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn(
              "flex items-center px-2 py-0.5 rounded",
              metrics.limitUsedPercent > 80 ? "text-rose-500 bg-rose-500/10" : "text-emerald-500 bg-emerald-500/10"
            )}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {metrics.limitUsedPercent > 80 ? 'Warning' : 'Healthy'}
            </span>
            <span className="text-slate-500">{metrics.limitUsedPercent.toFixed(1)}% used</span>
          </div>
        </div>

        <div className="bg-navy-800 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
          <h3 className="text-sm font-medium text-slate-400 mb-2">Fixed Expenses</h3>
          <div className="text-3xl font-bold text-white mb-4">{formatCurrency(metrics.currentFixed)}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn(
              "flex items-center px-2 py-0.5 rounded",
              metrics.fixedChange > 0 ? "text-rose-500 bg-rose-500/10" : "text-emerald-500 bg-emerald-500/10"
            )}>
              {metrics.fixedChange > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(metrics.fixedChange).toFixed(1)}%
            </span>
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Crystal Ball Chart */}
        <div className="lg:col-span-2 bg-navy-800 p-6 rounded-2xl border border-slate-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">The Crystal Ball</h2>
            <span className="text-xs font-medium px-2.5 py-1 bg-amethyst-500/20 text-amethyst-400 rounded-full border border-amethyst-500/30">
              6 Month Projection
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.futureBills} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  cursor={{ fill: '#1E293B' }}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="fixed" name="Fixed" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="installments" name="Installments" stackId="a" fill="#A855F7" />
                <Bar dataKey="variable" name="Variable (Est.)" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Donut */}
        <div className="bg-navy-800 p-6 rounded-2xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-6">Spending Categories</h2>
          {metrics.categoryData.length > 0 ? (
            <>
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {metrics.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm text-slate-400">Total</span>
                  <span className="text-xl font-bold text-white">{formatCurrency(metrics.currentBill)}</span>
                </div>
              </div>
              <div className="mt-4 space-y-3 max-h-32 overflow-y-auto pr-2">
                {metrics.categoryData.map((category) => (
                  <div key={category.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="text-slate-300">{category.name}</span>
                    </div>
                    <span className="font-medium text-white">{formatCurrency(category.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              No transactions this month
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-navy-800 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          <button 
            onClick={() => setShowAllTransactions(!showAllTransactions)}
            className="text-sm text-amethyst-400 hover:text-amethyst-300 transition-colors"
          >
            {showAllTransactions ? 'Show Less' : 'View All'}
          </button>
        </div>
        <div className="divide-y divide-slate-700/50">
          {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((tx) => (
            <div key={tx.id} className="group p-4 px-6 flex items-center justify-between hover:bg-navy-700/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  tx.type === 'fixed' ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"
                )}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-white flex items-center gap-2">
                    {tx.description}
                    {tx.isInstallment && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amethyst-500/20 text-amethyst-400 rounded-full border border-amethyst-500/30">
                        {tx.currentInstallment}/{tx.totalInstallments}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">{format(parseISO(tx.date), 'MMM dd, yyyy')} • {tx.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium text-white">{formatCurrency(tx.amount)}</div>
                  <div className="text-xs text-slate-500 capitalize">{tx.type}</div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditTransaction(tx)}
                    className="p-1.5 text-slate-400 hover:text-amethyst-400 hover:bg-amethyst-500/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No recent transactions.
            </div>
          )}
        </div>
      </div>

      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setTransactionToEdit(null);
        }}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
}
