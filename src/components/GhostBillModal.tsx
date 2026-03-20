import { useState } from 'react';
import { Ghost, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GhostBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_DATA = [
  { month: 'Apr', current: 2450, simulated: 0 },
  { month: 'May', current: 2250, simulated: 0 },
  { month: 'Jun', current: 2200, simulated: 0 },
  { month: 'Jul', current: 2000, simulated: 0 },
  { month: 'Aug', current: 1950, simulated: 0 },
  { month: 'Sep', current: 2000, simulated: 0 },
];

export function GhostBillModal({ isOpen, onClose }: GhostBillModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [simulatedData, setSimulatedData] = useState(INITIAL_DATA);

  if (!isOpen) return null;

  const handleSimulate = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const installmentValue = val / installments;
    
    const newData = INITIAL_DATA.map((data, index) => {
      if (index < installments) {
        return { ...data, simulated: installmentValue };
      }
      return data;
    });
    
    setSimulatedData(newData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 backdrop-blur-sm p-4">
      <div className="bg-navy-800 w-full max-w-2xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-navy-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amethyst-500/20 flex items-center justify-center">
              <Ghost className="w-5 h-5 text-amethyst-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ghost Bill Simulator</h2>
              <p className="text-sm text-slate-400">See the future impact of a purchase.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Purchase Amount (R$)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-navy-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amethyst-500 focus:ring-1 focus:ring-amethyst-500 transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Installments</label>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full bg-navy-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amethyst-500 focus:ring-1 focus:ring-amethyst-500 transition-all appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 10, 12].map(num => (
                  <option key={num} value={num}>{num}x</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={handleSimulate}
            className="w-full py-3 bg-amethyst-600 hover:bg-amethyst-500 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all mb-8"
          >
            Simulate Impact
          </button>

          {simulatedData.some(d => d.simulated > 0) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={simulatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                    <Tooltip 
                      cursor={{ fill: '#1E293B' }}
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="current" name="Current Bill" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="simulated" name="Ghost Impact" stackId="a" fill="#A855F7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {simulatedData[2].simulated > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-500">Consciousness Nudge</h4>
                    <p className="text-sm text-amber-400/80 mt-1">
                      This purchase will increase your June bill by {formatCurrency(simulatedData[2].simulated)}. 
                      Consider if this fits your mid-year budget goals.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
