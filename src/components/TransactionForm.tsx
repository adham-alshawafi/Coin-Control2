import React, { useState } from 'react';
import { X, Calculator as CalcIcon, Calendar as CalendarIcon, Clock, Tag, ChevronDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator } from './Calculator';
import { Account, Category, TransactionType, Transaction, PaymentMethod } from '../types';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { CreditCard, Banknote, Globe, ArrowRightLeft } from 'lucide-react';

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: any) => void;
  onClose: () => void;
  initialData?: Transaction;
  onAddCategory: (category: { name: string; type: 'income' | 'expense'; color: string }) => void;
  onAddAccount: (account: { name: string; type: any }) => void;
  currency: string;
}

export function TransactionForm({ accounts, categories, onSubmit, onClose, initialData, onAddCategory, onAddAccount, currency }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.paymentMethod || 'cash');
  const [amount, setAmount] = useState<number>(initialData?.amount || 0);
  const [note, setNote] = useState(initialData?.note || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || categories[0]?.name || '');
  const [accountId, setAccountId] = useState(initialData?.accountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(initialData?.toAccountId || accounts[1]?.id || '');
  const [date, setDate] = useState(initialData ? format(parseISO(initialData.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState(initialData ? format(parseISO(initialData.date), "HH:mm") : format(new Date(), "HH:mm"));
  const [showTime, setShowTime] = useState(initialData?.showTime ?? true);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Quick Add State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<any>('cash');

  const handleAddCategory = () => {
    if (!newCategoryName) return;
    const colors = ['#f87171', '#fbbf24', '#60a5fa', '#34d399', '#a78bfa', '#f472b6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    onAddCategory({ 
      name: newCategoryName, 
      type: type === 'transfer' ? 'expense' : type, 
      color: randomColor 
    });
    setCategory(newCategoryName);
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleAddAccount = () => {
    if (!newAccountName) return;
    onAddAccount({ name: newAccountName, type: newAccountType });
    setNewAccountName('');
    setShowAddAccount(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...initialData,
      type, amount, note, description, category, accountId, paymentMethod,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      date: `${date}T${time}:00`, showTime
    });
    onClose();
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: any }[] = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'online', label: 'Online', icon: Globe },
    { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
  ];

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'INR': return '₹';
      case 'BRL': return 'R$';
      case 'AED': return 'د.إ';
      case 'SAR': return 'ر.س';
      default: return '$';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-900">{initialData ? 'Edit Record' : 'Add Record'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
            {(['income', 'expense', 'transfer'] as TransactionType[]).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={cn("py-2 px-4 rounded-xl text-sm font-semibold transition-all capitalize", type === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}>{t}</button>
            ))}
          </div>
          <div className="space-y-1 relative">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{getCurrencySymbol(currency)}</span>
                <input type="number" step="0.01" value={amount || ''} onChange={(e) => setAmount(parseFloat(e.target.value))} placeholder="0.00" className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-2xl font-bold focus:border-indigo-500 focus:bg-white outline-none" required />
              </div>
              <button type="button" onClick={() => setShowCalculator(!showCalculator)} className={cn("p-3 rounded-2xl", showCalculator ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}><CalcIcon className="w-6 h-6" /></button>
            </div>
            <AnimatePresence>{showCalculator && <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute right-0 top-full mt-2 z-10"><Calculator onResult={(val) => { setAmount(val); setShowCalculator(false); }} /></motion.div>}</AnimatePresence>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Note / Pattern</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                placeholder="e.g. Coffee ☕" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 outline-none transition-all" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <button 
                  type="button" 
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <AnimatePresence>
                {showAddCategory && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={newCategoryName} 
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="New Category"
                        className="flex-1 px-3 py-2 bg-slate-100 border-none rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                      />
                      <button type="button" onClick={handleAddCategory} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold">ADD</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative">
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 outline-none appearance-none cursor-pointer text-sm"
                >
                  {categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type)).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {type === 'transfer' ? 'From Account' : 'Account'}
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowAddAccount(!showAddAccount)}
                  className="text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <AnimatePresence>
                {showAddAccount && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex flex-col gap-2 mb-2">
                      <input 
                        type="text" 
                        value={newAccountName} 
                        onChange={e => setNewAccountName(e.target.value)}
                        placeholder="New Account Name"
                        className="w-full px-3 py-2 bg-slate-100 border-none rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="flex gap-2">
                        <select 
                          value={newAccountType} 
                          onChange={e => setNewAccountType(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-100 border-none rounded-xl text-[10px] outline-none"
                        >
                          <option value="cash">Cash</option>
                          <option value="credit">Credit Card</option>
                          <option value="saving">Saving</option>
                          <option value="paypal">PayPal</option>
                          <option value="bank">Bank Account</option>
                          <option value="investment">Investment</option>
                          <option value="other">Other</option>
                        </select>
                        <button type="button" onClick={handleAddAccount} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold">ADD</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative">
                <select 
                  value={accountId} 
                  onChange={e => setAccountId(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 outline-none appearance-none cursor-pointer text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Type</label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all",
                    paymentMethod === m.id
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100"
                  )}
                >
                  <m.icon className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
            {type === 'transfer' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">To Account</label>
                <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl focus:border-indigo-500 outline-none cursor-pointer">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              </div>
            )}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</label><button type="button" onClick={() => setShowTime(!showTime)} className={cn("text-[10px] font-bold px-2 py-1 rounded-lg transition-colors", showTime ? "text-indigo-600 bg-indigo-50" : "text-slate-400 bg-slate-100")}>{showTime ? 'HIDE TIME' : 'SHOW TIME'}</button></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative"><CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl focus:border-indigo-500 outline-none" /></div>
              <div className={cn("relative transition-opacity", !showTime && "opacity-50 pointer-events-none")}><Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl focus:border-indigo-500 outline-none" /></div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details..." className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 outline-none transition-all resize-none h-20" />
          </div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200">Save Transaction</button>
        </form>
      </motion.div>
    </div>
  );
}
