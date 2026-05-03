import { useState, useEffect, useMemo } from 'react';
import { Transaction, Account, Category, FinanceState } from '../types';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const STORAGE_KEY = 'coin_control_data';

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Cash', type: 'cash' },
  { id: 'acc-2', name: 'Credit Card', type: 'credit' },
  { id: 'acc-3', name: 'Savings', type: 'saving' },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Food', type: 'expense', color: '#f87171' },
  { id: 'cat-2', name: 'Transport', type: 'expense', color: '#fbbf24' },
  { id: 'cat-3', name: 'Rent', type: 'expense', color: '#60a5fa' },
  { id: 'cat-4', name: 'Salary', type: 'income', color: '#34d399' },
  { id: 'cat-5', name: 'Entertainment', type: 'expense', color: '#a78bfa' },
];

export function useFinance() {
  const [state, setState] = useState<FinanceState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    
    // Add dummy transaction with paymentMethod
    return {
      transactions: [
        {
          id: 'dummy-1',
          amount: 25.50,
          note: 'Coffee & Snacks ☕',
          description: 'Weekly caffeine fix',
          category: 'Food',
          accountId: 'acc-1',
          type: 'expense',
          paymentMethod: 'cash',
          date: new Date().toISOString(),
          showTime: true,
          created_at: new Date().toISOString(),
        }
      ],
      accounts: DEFAULT_ACCOUNTS,
      categories: DEFAULT_CATEGORIES,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, transactions: [newTx, ...prev.transactions] }));
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      transactions: prev.transactions.filter(t => t.id !== id) 
    }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, { ...category, id: crypto.randomUUID() }]
    }));
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const deleteCategory = (id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }));
  };

  const addAccount = (account: Omit<Account, 'id' | 'balance'>) => {
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, { ...account, id: crypto.randomUUID() }]
    }));
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const deleteAccount = (id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id)
    }));
  };

  // Stats for current filter (handled by UI)
  const getTotals = (startDate: Date, endDate: Date) => {
    return state.transactions
      .filter(tx => isWithinInterval(parseISO(tx.date), { start: startDate, end: endDate }))
      .reduce((acc, tx) => {
        if (tx.type === 'income') acc.income += tx.amount;
        if (tx.type === 'expense') acc.expenses += tx.amount;
        return acc;
      }, { income: 0, expenses: 0 });
  };

  return {
    ...state,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addAccount,
    updateAccount,
    deleteAccount,
    getTotals
  };
}
