import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { Transaction } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, transactionToEdit }: TransactionModalProps) {
  const { cards, transactions, addTransaction, updateTransaction } = useStore();
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'variable',
    isInstallment: false,
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), // Local YYYY-MM-DDTHH:mm
  });

  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        ...transactionToEdit,
        date: new Date(new Date(transactionToEdit.date).getTime() - new Date(transactionToEdit.date).getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      });
    } else {
      setFormData({
        type: 'variable',
        isInstallment: false,
        date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        cardId: cards.length > 0 ? cards[0].id : '',
      });
    }
    setDuplicateWarning(false);
  }, [transactionToEdit, isOpen, cards]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.cardId || !formData.category || !formData.date) return;

    const transactionData = {
      ...formData,
      date: new Date(formData.date).toISOString(),
    } as Omit<Transaction, 'id'>;

    // Check for duplicates if we are adding a new transaction
    if (!transactionToEdit && !duplicateWarning) {
      const isDuplicate = transactions.some(t => {
        try {
          const isSameBasicInfo = t.description.toLowerCase() === transactionData.description.toLowerCase() &&
            Math.abs(t.amount - transactionData.amount) < 0.01 &&
            new Date(t.date).toISOString().substring(0, 10) === new Date(transactionData.date).toISOString().substring(0, 10);
            
          if (!isSameBasicInfo) return false;
          
          if (t.isInstallment && transactionData.isInstallment) {
            return t.currentInstallment === transactionData.currentInstallment;
          }
          
          return true;
        } catch (e) {
          return false;
        }
      });

      if (isDuplicate) {
        setDuplicateWarning(true);
        return;
      }
    }

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm">
      <div className="bg-navy-800 w-full max-w-md rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-navy-800/50">
          <h2 className="text-xl font-bold text-white">
            {transactionToEdit ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {duplicateWarning && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-400 font-medium text-sm">Duplicate Detected</h4>
                <p className="text-xs text-amber-400/80 mt-1">
                  A transaction with this exact description, amount, date, and time already exists. Are you sure you want to add it again?
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <input
              type="text"
              required
              value={formData.description || ''}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setDuplicateWarning(false);
              }}
              className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
              placeholder="e.g. Netflix, Uber"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Amount (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount || ''}
                onChange={(e) => {
                  setFormData({ ...formData, amount: Number(e.target.value) });
                  setDuplicateWarning(false);
                }}
                className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.date || ''}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  setDuplicateWarning(false);
                }}
                className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
              <select
                required
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
              >
                <option value="">Select...</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Card</label>
              <select
                required
                value={formData.cardId || ''}
                onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
              >
                <option value="">Select...</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id}>{card.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
              <select
                value={formData.type || 'variable'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fixed' | 'variable' })}
                className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
              >
                <option value="variable">Variable</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isInstallment || false}
                  onChange={(e) => setFormData({ ...formData, isInstallment: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-amethyst-500 focus:ring-amethyst-500 bg-navy-900"
                />
                <span className="text-sm font-medium text-slate-300">Is Installment?</span>
              </label>
            </div>
          </div>

          {formData.isInstallment && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-navy-900/50 rounded-lg border border-slate-700">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Current Installment</label>
                <input
                  type="number"
                  min="1"
                  value={formData.currentInstallment || ''}
                  onChange={(e) => setFormData({ ...formData, currentInstallment: Number(e.target.value) })}
                  className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Total Installments</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalInstallments || ''}
                  onChange={(e) => setFormData({ ...formData, totalInstallments: Number(e.target.value) })}
                  className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg border border-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                duplicateWarning 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)]' 
                  : 'bg-amethyst-600 hover:bg-amethyst-500'
              }`}
            >
              {duplicateWarning ? 'Confirm Duplicate' : (transactionToEdit ? 'Save Changes' : 'Add Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
