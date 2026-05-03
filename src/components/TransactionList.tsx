import { useState } from 'react';
import { Trash2, Edit3, ArrowRight, Search, Tag, Wallet, Banknote, CreditCard, Globe, ArrowRightLeft } from 'lucide-react';
import { Transaction, Account, Category, PaymentMethod } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';

const PaymentIcon = ({ method }: { method: PaymentMethod }) => {
  switch (method) {
    case 'cash': return <Banknote className="w-3 h-3" />;
    case 'card': return <CreditCard className="w-3 h-3" />;
    case 'online': return <Globe className="w-3 h-3" />;
    case 'transfer': return <ArrowRightLeft className="w-3 h-3" />;
    default: return null;
  }
};

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onManageAccounts?: () => void;
  onManageCategories?: () => void;
  showTime: boolean;
  onToggleTime: () => void;
  dateFormat?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currency: string;
}

export function TransactionList({ 
  transactions, accounts, categories, onDelete, onEdit, 
  onManageAccounts, onManageCategories,
  showTime, onToggleTime,
  dateFormat = 'EEE, d MMM yyyy',
  searchQuery,
  onSearchChange,
  currency
}: TransactionListProps) {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterAccountId, setFilterAccountId] = useState<string | 'all'>('all');
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.note.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesAccount = filterAccountId === 'all' || tx.accountId === filterAccountId || tx.toAccountId === filterAccountId;
    return matchesSearch && matchesType && matchesAccount;
  });

  if (transactions.length === 0) {
    return (
      <div className="card-container rounded-3xl p-12 border text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          < Trash2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold">No records found</h3>
        <p className="text-slate-500">Add your first transaction to see it here.</p>
      </div>
    );
  }

  return (
    <div className="card-container rounded-3xl border shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10 card-container">
        <div className="flex flex-col gap-1">
          <h3 className="font-black uppercase tracking-tighter">Financial Records</h3>
          <div className="flex items-center gap-3">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              {filteredTransactions.length} Records
            </p>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">In:</span>
                <span className="text-[10px] font-black text-emerald-600">{formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), currency)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Out:</span>
                <span className="text-[10px] font-black text-rose-600">{formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), currency)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Trsf:</span>
                <span className="text-[10px] font-black text-blue-600">{formatCurrency(filteredTransactions.filter(t => t.type === 'transfer').reduce((s, t) => s + t.amount, 0), currency)}</span>
              </div>
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total:</span>
                <span className="text-[10px] font-black text-slate-900">
                  {formatCurrency(
                    filteredTransactions.reduce((acc, t) => {
                      if (t.type === 'income') return acc + t.amount;
                      if (t.type === 'expense') return acc - t.amount;
                      return acc;
                    }, 0),
                    currency
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {(['all', 'income', 'expense', 'transfer']).map((type) => {
            const count = type === 'all' 
              ? transactions.length 
              : transactions.filter(t => t.type === type).length;
            const total = type === 'all'
              ? transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : (t.type === 'expense' ? -t.amount : 0)), 0)
              : transactions.filter(t => t.type === type).reduce((acc, t) => acc + t.amount, 0);

            return (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                  filterType === type 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {type}
                <span className={cn(
                  "text-[8px] px-1.5 py-0.5 rounded-md",
                  filterType === type ? "bg-indigo-50 text-indigo-400" : "bg-slate-200 text-slate-500"
                )}>
                  {formatCurrency(total, currency)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Account:</span>
          <select 
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="bg-slate-100 border-none rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-0 cursor-pointer outline-none transition-all hover:bg-slate-200"
          >
            <option value="all">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-200 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onManageCategories}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-white hover:border-slate-200 transition-all"
            >
              <Tag className="w-3 h-3" />
              Categories
            </button>
            <button 
              onClick={onManageAccounts}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-white hover:border-slate-200 transition-all"
            >
              <Wallet className="w-3 h-3" />
              Accounts
            </button>
          </div>

          <button 
            onClick={onToggleTime}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-2xl transition-all border shrink-0",
              showTime 
                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
            )}
          >
            {showTime ? 'Hide Time' : 'Show Time'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
              <th className="px-6 py-4">Transaction</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-center">Category / Account</th>
              <th className="px-6 py-4">Date & Day</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                  No matching records found with current filters
                </td>
              </tr>
            ) : filteredTransactions.map((tx) => (
              <tr 
                key={tx.id} 
                className={cn(
                  "transition-colors group relative border-l-4",
                  tx.type === 'income' ? "hover:bg-emerald-50/50 border-emerald-500" : 
                  tx.type === 'expense' ? "hover:bg-rose-50/50 border-rose-500" : 
                  "hover:bg-amber-50/50 border-amber-500"
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{tx.note || 'Untitled Record'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-xs font-medium",
                    tx.description ? "text-slate-600" : "text-slate-300 italic"
                  )}>
                    {tx.description || 'No description'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 uppercase shadow-sm">
                      {tx.category}
                    </span>
                    <div className="flex flex-col gap-1.5 mt-0.5 items-center">
                      {tx.type === 'transfer' && tx.toAccountId ? (
                        <div className="flex flex-col gap-1.5 items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase w-7 shrink-0 text-right">From</span>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                              <PaymentIcon method={tx.paymentMethod} />
                              <span className="font-bold text-slate-600 text-xs">{getAccountName(tx.accountId)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-indigo-400 uppercase w-7 shrink-0 text-right">To</span>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100/50">
                              <ArrowRight className="w-3 h-3 text-indigo-400" />
                              <span className="font-bold text-indigo-600 text-xs">{getAccountName(tx.toAccountId)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 w-fit shadow-sm">
                          <PaymentIcon method={tx.paymentMethod} />
                          <span className="font-bold text-slate-600 text-xs">{getAccountName(tx.accountId)}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Account</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 uppercase text-[10px] tracking-tight">{format(parseISO(tx.date), 'EEEE')}</span>
                    <span className="text-xs text-slate-400 font-medium italic">
                      {format(parseISO(tx.date), dateFormat)}{showTime && tx.showTime && ` @ ${format(parseISO(tx.date), 'HH:mm')}`}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    {tx.type === 'transfer' ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm group-hover:scale-105 transition-transform">
                          <div className="p-1 bg-amber-100 rounded-lg">
                            <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                          </div>
                          <span className="text-amber-700 text-base font-black tabular-nums">{formatCurrency(tx.amount, currency)}</span>
                        </div>
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mt-1.5 mr-1">Internal Movement</span>
                      </div>
                    ) : (
                      <span className={cn(
                        "text-lg font-black tabular-nums transition-all group-hover:scale-105",
                        tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => onEdit(tx)} 
                      className="p-2 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this transaction?')) {
                          onDelete(tx.id);
                        }
                      }} 
                      className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
