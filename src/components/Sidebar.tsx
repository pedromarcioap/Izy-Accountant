import { CreditCard, LayoutDashboard, PieChart, ScanLine, Settings, Ghost, BellRing, Repeat } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';

export function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const { cards, transactions } = useStore();
  
  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const currentBill = transactions
    .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);
  const availableLimit = Math.max(0, totalLimit - currentBill);
  const limitUsedPercent = totalLimit ? (currentBill / totalLimit) * 100 : 0;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'crystal-ball', label: 'Crystal Ball', icon: PieChart },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'ocr', label: 'Smart Scanner', icon: ScanLine },
    { id: 'ghost-bill', label: 'Ghost Bill', icon: Ghost },
    { id: 'alerts', label: 'Cycle Alerts', icon: BellRing },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-navy-800 border-r border-slate-700/50 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amethyst-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Vellum</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-amethyst-500/10 text-amethyst-400" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-amethyst-400" : "text-slate-500")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-navy-700 to-navy-800 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("w-2 h-2 rounded-full animate-pulse", limitUsedPercent > 80 ? "bg-rose-500" : "bg-emerald-500")} />
          <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Limit Health</span>
        </div>
        <div className="text-2xl font-semibold text-white mb-1">{limitUsedPercent.toFixed(0)}%</div>
        <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
          <div className={cn("h-1.5 rounded-full", limitUsedPercent > 80 ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, limitUsedPercent)}%` }} />
        </div>
        <p className="text-xs text-slate-400">R$ {availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} available</p>
      </div>
    </aside>
  );
}
