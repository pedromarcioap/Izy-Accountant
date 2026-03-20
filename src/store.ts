import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card, Transaction } from './types';

interface AppState {
  cards: Card[];
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  addCard: (card: Omit<Card, 'id'>) => void;
  updateCard: (id: string, card: Partial<Card>) => void;
  removeCard: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      cards: [],
      transactions: [],
      addTransaction: (transaction) => set((state) => ({
        transactions: [{ ...transaction, id: Math.random().toString(36).substring(7) }, ...state.transactions]
      })),
      updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      removeTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      })),
      addCard: (card) => set((state) => ({
        cards: [...state.cards, { ...card, id: Math.random().toString(36).substring(7) }]
      })),
      updateCard: (id, updates) => set((state) => ({
        cards: state.cards.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      removeCard: (id) => set((state) => ({
        cards: state.cards.filter(c => c.id !== id)
      })),
    }),
    {
      name: 'vellum-storage',
    }
  )
);
