import { useState } from 'react';
import { useStore } from '../store';
import { CreditCard, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Card } from '../types';

export function Settings() {
  const { cards, addCard, updateCard, removeCard } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Card>>({});

  const handleSave = () => {
    if (!formData.name || !formData.limit || !formData.closingDay || !formData.dueDay) return;

    if (editingId) {
      updateCard(editingId, formData);
      setEditingId(null);
    } else {
      addCard(formData as Omit<Card, 'id'>);
      setIsAdding(false);
    }
    setFormData({});
  };

  const handleEdit = (card: Card) => {
    setEditingId(card.id);
    setFormData(card);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-navy-900">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your cards and application preferences.</p>
      </header>

      <div className="bg-navy-800 rounded-2xl border border-slate-700/50 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Your Cards</h2>
              <p className="text-sm text-slate-400">Configure billing cycles and limits</p>
            </div>
          </div>
          {!isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-amethyst-600 hover:bg-amethyst-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Card
            </button>
          )}
        </div>

        <div className="p-6">
          {(isAdding || editingId) && (
            <div className="bg-navy-700/50 p-6 rounded-xl border border-slate-600/50 mb-6">
              <h3 className="text-lg font-medium text-white mb-4">
                {editingId ? 'Edit Card' : 'New Card'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Card Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
                    placeholder="e.g. Nubank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Credit Limit (R$)</label>
                  <input
                    type="number"
                    value={formData.limit || ''}
                    onChange={(e) => setFormData({ ...formData, limit: Number(e.target.value) })}
                    className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Closing Day</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.closingDay || ''}
                    onChange={(e) => setFormData({ ...formData, closingDay: Number(e.target.value) })}
                    className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Due Day</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay || ''}
                    onChange={(e) => setFormData({ ...formData, dueDay: Number(e.target.value) })}
                    className="w-full bg-navy-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amethyst-500"
                    placeholder="12"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Card
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div key={card.id} className="bg-navy-900 p-5 rounded-xl border border-slate-700 relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(card)}
                    className="p-1.5 bg-navy-800 hover:bg-navy-700 text-blue-400 rounded-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeCard(card.id)}
                    className="p-1.5 bg-navy-800 hover:bg-navy-700 text-rose-400 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{card.name}</h3>
                <div className="text-2xl font-bold text-amethyst-400 mb-4">
                  {formatCurrency(card.limit)}
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <div>
                    <span className="block text-xs text-slate-500 uppercase tracking-wider">Closes on</span>
                    Day {card.closingDay}
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-slate-500 uppercase tracking-wider">Due on</span>
                    Day {card.dueDay}
                  </div>
                </div>
              </div>
            ))}
            {cards.length === 0 && !isAdding && (
              <div className="col-span-full py-8 text-center text-slate-500 bg-navy-900/50 rounded-xl border border-dashed border-slate-700">
                No cards configured yet. Add your first card to start tracking.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
