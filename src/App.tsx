import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Wallet, 
  PieChart, 
  Settings, 
  Plus, 
  X,
  ArrowUpRight, 
  ArrowDownLeft,
  Search,
  Bell,
  Menu,
  Calendar,
  Filter,
  LogOut,
  ChevronDown,
  RotateCcw,
  Tag,
  Sun,
  Moon,
  Palette,
  Type,
  Trash2,
  Edit3,
  Download,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency as utilsFormatCurrency } from './lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

import { useFinance } from './hooks/useFinance';
import { TransactionForm } from './components/TransactionForm';
import { CalendarView } from './components/CalendarView';
import { TransactionList } from './components/TransactionList';
import { PeriodSelector } from './components/PeriodSelector';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Transaction } from './types';

interface CategoryCardProps {
  cat: any;
  finance: any;
  key?: any;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ cat, finance }) => (
  <div className="p-6 rounded-3xl border-2 border-slate-50 flex flex-col items-center text-center gap-4 hover:border-slate-100 hover:bg-slate-50/50 transition-all group relative">
    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
      <button 
        onClick={() => {
          const newName = prompt('New category name:', cat.name);
          if (newName) {
            const newBudget = prompt('Set monthly budget (optional):', cat.budget?.toString() || '');
            finance.updateCategory(cat.id, { 
              name: newName,
              budget: newBudget ? parseFloat(newBudget) : undefined
            });
          }
        }}
        className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-all"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>
      <button 
        onClick={() => {
          if (confirm(`Delete category "${cat.name}"?`)) {
            finance.deleteCategory(cat.id);
          }
        }}
        className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
    <div className="w-16 h-16 rounded-[24px] flex items-center justify-center text-white text-2xl font-black shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: cat.color, boxShadow: `0 10px 20px -5px ${cat.color}40` }}>
      {cat.name.charAt(0)}
    </div>
    <div className="space-y-1">
      <p className="font-bold text-slate-900">{cat.name}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.type}</p>
    </div>
  </div>
);

interface CategoryProgressProps {
  item: any;
  finance: any;
  currency: string;
}

const CategoryProgress: React.FC<CategoryProgressProps> = ({ item, finance, currency }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{item.name}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-black text-slate-900">{utilsFormatCurrency(item.spent, currency)}</span>
        {item.budget && (
          <span className="text-[10px] font-bold text-slate-400">/ {utilsFormatCurrency(item.budget, currency)}</span>
        )}
      </div>
    </div>
    
    {item.budget ? (
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(item.progress, 100)}%` }}
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            item.type === 'income' ? "bg-emerald-500" : (
              item.progress > 90 ? "bg-rose-500" : 
              item.progress > 70 ? "bg-amber-500" : "bg-indigo-600"
            )
          )}
        />
      </div>
    ) : (
      <div className="h-6 flex items-center bg-slate-50 rounded-lg px-3 border border-dashed border-slate-200">
        <span className="text-[9px] font-black text-slate-400 uppercase italic">No Target Set</span>
        <button 
          onClick={() => {
            const b = prompt(`Set monthly ${item.type === 'income' ? 'goal' : 'budget'} for ${item.name}:`);
            if (b) finance.updateCategory(item.id, { budget: parseFloat(b) });
          }}
          className="ml-auto text-[9px] font-black text-indigo-600 uppercase hover:underline"
        >
          Set Now
        </button>
      </div>
    )}
  </div>
);

export default function App() {
  const finance = useFinance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTimeGlobal, setShowTimeGlobal] = useState(true);
  const [dateFormat, setDateFormat] = useState('EEE, d MMM yyyy');
  const [globalSearch, setGlobalSearch] = useState('');
  const [fontFamily, setFontFamily] = useState('font-sans');
  const [layoutType, setLayoutType] = useState('card');
  const [currency, setCurrency] = useState('USD');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return utilsFormatCurrency(amount, currency);
  };
  
  // Date Range State
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Note', 'Amount', 'Account', 'To Account'];
    const rows = filteredTransactions.map(tx => [
      tx.date,
      tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
      tx.category,
      `"${tx.note.replace(/"/g, '""')}"`, // CSV escaping for notes
      tx.amount,
      finance.accounts.find(a => a.id === tx.accountId)?.name || 'Direct',
      tx.type === 'transfer' ? finance.accounts.find(a => a.id === tx.toAccountId)?.name : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financial-records-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormSubmit = (data: any) => {
    if (editingTransaction) {
      finance.updateTransaction(editingTransaction.id, data);
    } else {
      finance.addTransaction(data);
    }
    setShowAddForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowAddForm(true);
  };

  const dateFilteredTransactions = useMemo(() => {
    return finance.transactions.filter(tx => {
      const txDate = parseISO(tx.date);
      return isWithinInterval(txDate, { 
        start: parseISO(dateRange.start), 
        end: parseISO(dateRange.end) 
      });
    });
  }, [finance.transactions, dateRange]);

  const filteredTransactions = useMemo(() => {
    return dateFilteredTransactions.filter(tx => {
      const matchesAccount = !selectedAccountId || tx.accountId === selectedAccountId || tx.toAccountId === selectedAccountId;
      const matchesSearch = !globalSearch || tx.note.toLowerCase().includes(globalSearch.toLowerCase());
      return matchesAccount && matchesSearch;
    });
  }, [dateFilteredTransactions, selectedAccountId, globalSearch]);

  const stats = filteredTransactions.reduce((acc, tx) => {
    if (tx.type === 'income') acc.income += tx.amount;
    if (tx.type === 'expense') acc.expense += tx.amount;
    if (tx.type === 'transfer') acc.transfers += tx.amount;
    return acc;
  }, { income: 0, expense: 0, transfers: 0, balance: 0 });
  
  stats.balance = stats.income - stats.expense;

  const totalBudgets = useMemo(() => {
    return finance.categories.reduce((acc, cat) => {
      if (cat.budget) {
        if (cat.type === 'income') acc.income += cat.budget;
        if (cat.type === 'expense') acc.expense += cat.budget;
      }
      return acc;
    }, { income: 0, expense: 0 });
  }, [finance.categories]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'reports', label: 'Analytics', icon: PieChart },
    { id: 'budgets', label: 'Budgets', icon: Wallet },
  ];

  const categoryStats = useMemo(() => {
    return finance.categories.map(cat => {
      const spent = filteredTransactions
        .filter(t => t.category === cat.name && t.type === cat.type)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...cat,
        spent,
        progress: cat.budget ? (spent / cat.budget) * 100 : 0
      };
    });
  }, [filteredTransactions, finance.categories]);

  const chartData = useMemo(() => {
    return categoryStats
      .filter(c => c.type === 'expense' && c.spent > 0)
      .map(c => ({ name: c.name, value: c.spent, color: c.color }));
  }, [categoryStats]);

  return (
    <div className={cn(
      "flex h-screen overflow-hidden transition-colors duration-300",
      fontFamily
    )}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8 pb-4">
            <div className="flex items-center gap-3 font-black text-2xl tracking-tighter text-indigo-600">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              COIN CONTROL
            </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === item.id 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" 
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-slate-400")} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto">
            <div className="bg-slate-50 rounded-3xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 border-2 border-white flex items-center justify-center font-bold text-indigo-600">AA</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate text-slate-900">Adham Alshawafi</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Pro Account</p>
                </div>
                <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"><Menu className="w-6 h-6" /></button>
            <h1 className="text-xl font-black text-slate-900 tracking-tight lg:text-2xl uppercase">
              {activeTab}
            </h1>
          </div>

          <div className="hidden min-[1100px]:flex items-center gap-8 px-8 border-x border-slate-100 h-10 mx-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Income</span>
              <span className="text-sm font-black text-emerald-600 tabular-nums leading-none">{formatCurrency(stats.income)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Expense</span>
              <span className="text-sm font-black text-rose-600 tabular-nums leading-none">{formatCurrency(stats.expense)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Transfer</span>
              <span className="text-sm font-black text-blue-600 tabular-nums leading-none">{formatCurrency(stats.transfers)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total</span>
              <span className="text-sm font-black text-slate-900 tabular-nums leading-none">{formatCurrency(stats.balance)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 flex-1 justify-end max-w-xl">
            <div className="relative group flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search everywhere..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all"
              />
            </div>

            <button 
              onClick={exportToCSV}
              className="hidden md:flex p-3 text-slate-500 bg-white border border-slate-200 rounded-2xl relative hover:border-indigo-200 transition-all"
              title="Export as CSV"
            >
              <Download className="w-5 h-5" />
            </button>

            <button className="hidden md:flex p-3 text-slate-500 bg-white border border-slate-200 rounded-2xl relative hover:border-indigo-200 transition-all">
              <Filter className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-3 text-slate-500 bg-white border rounded-2xl relative transition-all",
                  showSettings ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"
                )}
              >
                <Settings className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowSettings(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 z-50 origin-top-right"
                    >
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 px-2">Settings</h3>
                      
                      <div className="space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                        <section>
                          <div className="flex items-center gap-2 mb-4 px-2">
                             <Type className="w-4 h-4 text-indigo-600" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Typography</span>
                          </div>
                          <div className="space-y-2">
                            {[
                              { label: 'Modern', value: 'font-sans' },
                              { label: 'Technical', value: 'font-display' },
                              { label: 'Classic', value: '[font-family:Inter]' }
                            ].map((fontOption) => (
                              <button
                                key={fontOption.value}
                                onClick={() => setFontFamily(fontOption.value)}
                                className={cn(
                                  "w-full px-4 py-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between",
                                  fontFamily === fontOption.value
                                    ? "border-indigo-600 bg-indigo-50/30"
                                    : "border-slate-50 bg-slate-50 hover:border-slate-100"
                                )}
                              >
                                <span className={cn("font-bold text-xs truncate", fontOption.value)}>{fontOption.label} View</span>
                                {fontFamily === fontOption.value && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                              </button>
                            ))}
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center gap-2 mb-4 px-2">
                             <Palette className="w-4 h-4 text-indigo-600" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Layout Pattern</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: 'Split', value: 'split' },
                              { label: 'Cards', value: 'card' },
                              { label: 'Grid', value: 'grid' },
                              { label: 'Single', value: 'single' },
                              { label: 'Bento', value: 'bento' },
                              { label: 'Asym', value: 'asymmetric' },
                              { label: 'Full', value: 'full' }
                            ].map((layout) => (
                              <button
                                key={layout.value}
                                onClick={() => setLayoutType(layout.value)}
                                className={cn(
                                  "px-3 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all",
                                  layoutType === layout.value
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                    : "border-slate-50 bg-slate-50 hover:border-slate-100 text-slate-400"
                                )}
                              >
                                {layout.label}
                              </button>
                            ))}
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center gap-2 mb-4 px-2">
                             <Calendar className="w-4 h-4 text-indigo-600" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Format</span>
                          </div>
                          <div className="space-y-2">
                            <select 
                              value={dateFormat} 
                              onChange={(e) => setDateFormat(e.target.value)}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold focus:border-indigo-600 outline-none transition-all"
                            >
                               <option value="EEE, d MMM yyyy">Long (Mon, 2 Jan 2024)</option>
                               <option value="d/M/yyyy">Short (02/01/2024)</option>
                               <option value="d MMM yyyy">Standard (2 Jan 2024)</option>
                            </select>
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center gap-2 mb-4 px-2">
                             <Coins className="w-4 h-4 text-indigo-600" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Currency</span>
                          </div>
                          <div className="space-y-2">
                            <select 
                              value={currency} 
                              onChange={(e) => setCurrency(e.target.value)}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold focus:border-indigo-600 outline-none transition-all"
                            >
                               <option value="USD">USD ($)</option>
                               <option value="EUR">EUR (€)</option>
                               <option value="GBP">GBP (£)</option>
                               <option value="JPY">JPY (¥)</option>
                               <option value="CAD">CAD ($)</option>
                               <option value="AUD">AUD ($)</option>
                               <option value="INR">INR (₹)</option>
                               <option value="BRL">BRL (R$)</option>
                               <option value="AED">AED (د.إ)</option>
                               <option value="SAR">SAR (ر.س)</option>
                            </select>
                          </div>
                        </section>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <button className="p-3 text-slate-500 bg-white border border-slate-200 rounded-2xl relative hover:border-indigo-200 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
            </button>
            
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100"
            >
              <div className="flex items-center gap-4 mr-2 border-r border-indigo-500/50 pr-4 hidden xl:flex">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[7.5px] font-black text-indigo-300 uppercase tracking-[0.2em] leading-none">In</span>
                  <span className="text-[10px] font-black tabular-nums leading-none">{formatCurrency(stats.income)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[7.5px] font-black text-indigo-300 uppercase tracking-[0.2em] leading-none">Out</span>
                  <span className="text-[10px] font-black tabular-nums leading-none">{formatCurrency(stats.expense)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[7.5px] font-black text-indigo-300 uppercase tracking-[0.2em] leading-none">Trsf</span>
                  <span className="text-[10px] font-black tabular-nums leading-none">{formatCurrency(stats.transfers)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 pl-1">
                  <span className="text-[7.5px] font-black text-white uppercase tracking-[0.2em] leading-none">Net</span>
                  <span className="text-[10px] font-black tabular-nums leading-none">{formatCurrency(stats.balance)}</span>
                </div>
              </div>
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Record</span>
            </button>
          </div>
        </header>

        {/* Global Period Selector Feature */}
        <div className="px-6 lg:px-10 py-4 bg-white border-b border-slate-100">
          <PeriodSelector currentRange={dateRange} onRangeChange={setDateRange} />
        </div>

        {/* View Content */}
        <div className={cn(
          "flex-1 overflow-y-auto custom-scrollbar transition-all duration-500",
          layoutType === 'single' ? "max-w-3xl mx-auto p-6 lg:p-10 space-y-6" : 
          layoutType === 'full' ? "p-0 space-y-0" : "p-6 lg:p-10 space-y-10"
        )}>
          {activeTab === 'dashboard' && (
            <div className={cn(
              "grid gap-6 lg:gap-10",
              layoutType === 'split' ? "lg:grid-cols-2" : 
              layoutType === 'grid' ? "lg:grid-cols-3" : 
              layoutType === 'asymmetric' ? "grid-cols-1 md:grid-cols-12" : "grid-cols-1"
            )}>
              {/* Summary Cards */}
              <div className={cn(
                "grid gap-6",
                layoutType === 'grid' ? "grid-cols-1 lg:col-span-3" : 
                layoutType === 'split' ? "grid-cols-1 lg:col-span-1" :
                layoutType === 'asymmetric' ? "md:col-span-4" : 
                layoutType === 'bento' ? "grid-cols-2 lg:grid-cols-4 md:col-span-12" :
                layoutType === 'full' ? "grid-cols-4 md:col-span-12" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:col-span-12"
              )}>
                {[
                  { label: 'Net Balance', value: stats.balance, icon: Wallet, color: 'indigo' },
                  { label: 'Total Income', value: stats.income, icon: ArrowUpRight, color: 'emerald', budget: totalBudgets.income },
                  { label: 'Total Expense', value: stats.expense, icon: ArrowDownLeft, color: 'rose', budget: totalBudgets.expense },
                  { label: 'Transfers', value: stats.transfers, icon: RotateCcw, color: 'amber' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "p-6 card-container rounded-[32px] border shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500",
                      layoutType === 'bento' && i === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                    )}
                  >
                    <div className={cn(
                      "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] scale-150 transition-transform group-hover:scale-125 duration-700",
                      stat.color === 'indigo' ? "bg-indigo-600" :
                      stat.color === 'emerald' ? "bg-emerald-600" :
                      stat.color === 'rose' ? "bg-rose-600" : "bg-amber-600"
                    )} />
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 duration-500",
                        stat.color === 'indigo' ? "bg-indigo-100 text-indigo-600" :
                        stat.color === 'emerald' ? "bg-emerald-100 text-emerald-600" :
                        stat.color === 'rose' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                      )}>
                        <stat.icon className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                    </div>
                    <p className={cn(
                      "font-black tracking-tight tabular-nums text-slate-900 leading-none",
                      layoutType === 'bento' && i === 0 ? "text-5xl" : "text-3xl"
                    )}>{formatCurrency(stat.value)}</p>
                    {stat.budget ? (
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <span>Target: {formatCurrency(stat.budget)}</span>
                          <span>{Math.round((stat.value / stat.budget) * 100)}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                               stat.label.includes('Income') ? "bg-emerald-500" : "bg-rose-500"
                            )} 
                            style={{ width: `${Math.min((stat.value / (stat.budget || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </div>

              <div className={cn(
                "grid gap-10",
                layoutType === 'grid' ? "lg:col-span-3 grid-cols-1 md:grid-cols-2" : 
                layoutType === 'asymmetric' ? "md:col-span-8 grid-cols-1" :
                layoutType === 'full' ? "grid-cols-1 md:col-span-12" :
                layoutType === 'split' ? "lg:col-span-1 grid-cols-1" : "grid-cols-1 xl:col-span-12"
              )}>
                <div className={cn(
                  "space-y-6",
                  layoutType === 'grid' ? "md:col-span-2 xl:col-span-1" : 
                  layoutType === 'asymmetric' ? "flex flex-col gap-6" : "xl:col-span-8"
                )}>
                  <div className="bg-white p-8 rounded-[40px] border border-slate-200/60 shadow-sm overflow-hidden relative">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Accounts Summary</h3>
                       {selectedAccountId && (
                        <button 
                          onClick={() => setSelectedAccountId(null)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Viewing: {finance.accounts.find(a => a.id === selectedAccountId)?.name}
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {finance.accounts.map(acc => {
                        const accTx = dateFilteredTransactions.filter(t => t.accountId === acc.id || t.toAccountId === acc.id);
                        const bal = accTx.reduce((sum, t) => {
                          if (t.type === 'income') return sum + t.amount;
                          if (t.type === 'expense') return sum - t.amount;
                          if (t.type === 'transfer') {
                            if (t.accountId === acc.id) return sum - t.amount;
                            if (t.toAccountId === acc.id) return sum + t.amount;
                          }
                          return sum;
                        }, 0);
                        return (
                          <div 
                            key={acc.id} 
                            onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)}
                            className={cn(
                              "p-5 rounded-3xl border-2 transition-all cursor-pointer",
                              selectedAccountId === acc.id 
                                ? "bg-indigo-600 border-indigo-600 text-white" 
                                : "bg-slate-50 border-transparent hover:border-indigo-100"
                            )}
                          >
                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", selectedAccountId === acc.id ? "text-indigo-200" : "text-slate-400")}>{acc.name}</p>
                            <p className="text-xl font-black tabular-nums">{formatCurrency(bal)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card-container p-8 rounded-[40px] border shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-black uppercase tracking-widest">Recent Activity</h3>
                      <button onClick={() => setActiveTab('transactions')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <TransactionList 
                      transactions={filteredTransactions.slice(0, 5)} 
                      accounts={finance.accounts} 
                      categories={finance.categories} 
                      onDelete={finance.deleteTransaction}
                      onEdit={handleEdit}
                      onManageAccounts={() => setActiveTab('accounts')}
                      onManageCategories={() => setActiveTab('categories')}
                      showTime={showTimeGlobal}
                      onToggleTime={() => setShowTimeGlobal(!showTimeGlobal)}
                      dateFormat={dateFormat}
                      searchQuery={globalSearch}
                      onSearchChange={setGlobalSearch}
                      currency={currency}
                    />
                  </div>
                </div>

                {/* Expense & Income Tracking */}
                <div className="xl:col-span-4 space-y-6">
                  <div className="card-container p-8 rounded-[40px] border shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center justify-between">
                      Monthly Expenses
                      <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                    </h3>
                    <div className="space-y-6">
                      {categoryStats.filter(c => c.type === 'expense' && (c.spent > 0 || c.budget)).length > 0 ? (
                        categoryStats.filter(c => c.type === 'expense' && (c.spent > 0 || c.budget)).map((item) => (
                          <CategoryProgress key={item.id} item={item} finance={finance} currency={currency} />
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No expense goals yet</p>
                      )}
                    </div>
                  </div>

                  <div className="card-container p-8 rounded-[40px] border shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center justify-between">
                      Income Tracking
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    </h3>
                    <div className="space-y-6">
                      {categoryStats.filter(c => c.type === 'income' && (c.spent > 0 || c.budget)).length > 0 ? (
                        categoryStats.filter(c => c.type === 'income' && (c.spent > 0 || c.budget)).map((item) => (
                          <CategoryProgress key={item.id} item={item} finance={finance} currency={currency} />
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No income goals yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budgets' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-8">
              <div className="bg-white rounded-[40px] p-8 border border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900">Monthly Budgets & Goals</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Set and track your spending limits</p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <div className="px-4 py-2 text-xs font-black text-indigo-600 uppercase tracking-widest bg-white rounded-xl shadow-sm">Monthly View</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Budgets</h4>
                       <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Target: {formatCurrency(totalBudgets.expense)}</span>
                    </div>
                    <div className="space-y-4">
                      {categoryStats.filter(c => c.type === 'expense').map(cat => (
                        <div key={cat.id} className="p-6 bg-slate-50 rounded-[32px] border-2 border-transparent hover:border-slate-100 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black" style={{ backgroundColor: cat.color }}>
                                {cat.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{cat.name}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  {cat.budget ? `${formatCurrency(cat.spent)} of ${formatCurrency(cat.budget)}` : 'No budget set'}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const b = prompt(`Set monthly budget for ${cat.name}:`, cat.budget?.toString() || '');
                                if (b !== null) finance.updateCategory(cat.id, { budget: b ? parseFloat(b) : undefined });
                              }}
                              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:border-indigo-600 transition-all"
                            >
                              {cat.budget ? 'Edit' : 'Set Budget'}
                            </button>
                          </div>
                          {cat.budget && (
                            <div className="space-y-2">
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(cat.progress, 100)}%` }}
                                  className={cn(
                                    "h-full rounded-full",
                                    cat.progress > 90 ? "bg-rose-500" : cat.progress > 70 ? "bg-amber-500" : "bg-indigo-600"
                                  )}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                <span>{Math.round(cat.progress)}% Consumed</span>
                                <span>{formatCurrency(Math.max(0, cat.budget - cat.spent))} Remaining</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Income Goals</h4>
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Target: {formatCurrency(totalBudgets.income)}</span>
                    </div>
                    <div className="space-y-4">
                      {categoryStats.filter(c => c.type === 'income').map(cat => (
                        <div key={cat.id} className="p-6 bg-slate-50 rounded-[32px] border-2 border-transparent hover:border-slate-100 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black" style={{ backgroundColor: cat.color }}>
                                {cat.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{cat.name}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  {cat.budget ? `${formatCurrency(cat.spent)} of ${formatCurrency(cat.budget)}` : 'No goal set'}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const b = prompt(`Set monthly goal for ${cat.name}:`, cat.budget?.toString() || '');
                                if (b !== null) finance.updateCategory(cat.id, { budget: b ? parseFloat(b) : undefined });
                              }}
                              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:border-indigo-600 transition-all"
                            >
                              {cat.budget ? 'Edit' : 'Set Goal'}
                            </button>
                          </div>
                          {cat.budget && (
                            <div className="space-y-2">
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(cat.progress, 100)}%` }}
                                  className="h-full rounded-full bg-emerald-500"
                                />
                              </div>
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                <span>{Math.round(cat.progress)}% Achieved</span>
                                <span>{formatCurrency(Math.max(0, cat.budget - cat.spent))} to Go</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <CalendarView 
                transactions={dateFilteredTransactions} 
                currentMonth={parseISO(dateRange.start)}
                onMonthChange={(newDate) => {
                  setDateRange({
                    start: format(startOfMonth(newDate), 'yyyy-MM-dd'),
                    end: format(endOfMonth(newDate), 'yyyy-MM-dd')
                  });
                }}
                onDayClick={(date) => {
                  setDateRange({
                    start: format(date, 'yyyy-MM-dd'),
                    end: format(date, 'yyyy-MM-dd')
                  });
                  setActiveTab('transactions');
                }} 
              />
            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8">
              <div className="bg-white rounded-[40px] p-8 border border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900">Financial Accounts</h3>
                    {selectedAccountId && (
                      <button 
                        onClick={() => setSelectedAccountId(null)}
                        className="mt-2 flex items-center w-fit gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100"
                      >
                        Viewing: {finance.accounts.find(a => a.id === selectedAccountId)?.name} (Clear Filter)
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all">
                    <Plus className="w-4 h-4" />
                    NEW ACCOUNT
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finance.accounts.map(acc => {
                    const accTx = dateFilteredTransactions.filter(t => t.accountId === acc.id || t.toAccountId === acc.id);
                    const accStats = accTx.reduce((accS, t) => {
                      if (t.type === 'income') accS.i += t.amount;
                      if (t.type === 'expense') accS.e += t.amount;
                      if (t.type === 'transfer') {
                        if (t.accountId === acc.id) accS.e += t.amount;
                        if (t.toAccountId === acc.id) accS.i += t.amount;
                      }
                      return accS;
                    }, { i: 0, e: 0 });
                    
                    const accBalance = accStats.i - accStats.e;

                    return (
                      <div 
                        key={acc.id} 
                        onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)}
                        className={cn(
                          "p-6 rounded-3xl border-2 transition-all group relative overflow-hidden cursor-pointer",
                          selectedAccountId === acc.id
                            ? "border-indigo-600 bg-indigo-50/10"
                            : "border-slate-50 bg-slate-50/50 hover:border-indigo-100 hover:bg-white"
                        )}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                        <div className="flex items-center justify-between mb-6 relative">
                          <div className={cn(
                            "p-4 rounded-2xl shadow-sm cursor-pointer",
                            selectedAccountId === acc.id ? "bg-indigo-600 text-white" : "bg-white text-indigo-600 appearance-none"
                          )} onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)}><Wallet className="w-6 h-6" /></div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const newName = prompt('New name for account:', acc.name);
                                if (newName) finance.updateAccount(acc.id, { name: newName });
                              }}
                              className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this account?')) {
                                  finance.deleteAccount(acc.id);
                                }
                              }}
                              className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">{acc.type}</span>
                          </div>
                        </div>
                        <h4 className="font-bold text-xl text-slate-900 mb-1 relative cursor-pointer" onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)}>{acc.name}</h4>
                        
                        <div className="space-y-3 relative">
                          <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Balance</span>
                            <span className="text-lg font-black text-slate-900">{formatCurrency(accBalance)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             <div className="flex flex-col">
                               <span className="text-[9px] font-bold text-emerald-500 uppercase">In</span>
                               <span className="text-xs font-black text-emerald-600 tabular-nums">+{formatCurrency(accStats.i)}</span>
                             </div>
                             <div className="flex flex-col text-right">
                               <span className="text-[9px] font-bold text-rose-500 uppercase">Out</span>
                               <span className="text-xs font-black text-rose-600 tabular-nums">-{formatCurrency(accStats.e)}</span>
                             </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 space-y-12">
              {/* Expense Categories Section */}
              <div className="bg-white rounded-[40px] p-8 border border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                      <ArrowDownLeft className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Expense Categories</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {finance.categories.filter(c => c.type === 'expense').map(cat => (
                    <CategoryCard key={cat.id} cat={cat} finance={finance} />
                  ))}
                </div>
              </div>

              {/* Income Categories Section */}
              <div className="bg-white rounded-[40px] p-8 border border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <ArrowUpRight className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Income Categories</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {finance.categories.filter(c => c.type === 'income').map(cat => (
                    <CategoryCard key={cat.id} cat={cat} finance={finance} />
                  ))}
                </div>
              </div>

              {/* Transfers Section */}
              <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-200 border-dashed">
                <div className="flex items-center gap-3 mb-4 text-amber-600">
                  <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Internal Transfers</h3>
                </div>
                <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                  Internal transfers are movements between your accounts. They don't require categories as they are tracked as account-to-account records. You can manage transfers directly in the dashboard or transaction list.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8">
              <TransactionList 
                transactions={filteredTransactions} 
                accounts={finance.accounts} 
                categories={finance.categories} 
                onDelete={finance.deleteTransaction}
                onEdit={handleEdit}
                onManageAccounts={() => setActiveTab('accounts')}
                onManageCategories={() => setActiveTab('categories')}
                showTime={showTimeGlobal}
                onToggleTime={() => setShowTimeGlobal(!showTimeGlobal)}
                dateFormat={dateFormat}
                searchQuery={globalSearch}
                onSearchChange={setGlobalSearch}
                currency={currency}
              />
            </motion.div>
          )}

          {/* Placeholder for other tabs */}
          {['reports', 'budgets'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[40px] border border-dashed border-slate-300 italic text-slate-400">
              <PieChart className="w-12 h-12 mb-4 opacity-20" />
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module Coming Soon
            </div>
          )}
        </div>
      </main>

      {/* Entry Modal */}
      <AnimatePresence>
        {showAddForm && (
          <TransactionForm 
            accounts={finance.accounts}
            categories={finance.categories}
            onSubmit={handleFormSubmit}
            onAddCategory={finance.addCategory}
            onAddAccount={finance.addAccount}
            initialData={editingTransaction || undefined}
            currency={currency}
            onClose={() => {
              setShowAddForm(false);
              setEditingTransaction(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
