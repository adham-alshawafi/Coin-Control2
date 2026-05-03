import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Transaction } from '../types';

interface CalendarViewProps {
  transactions: Transaction[];
  onDayClick: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarView({ transactions, onDayClick, currentMonth, onMonthChange }: CalendarViewProps) {

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Find most relevant transaction for this day to show pattern
        const dayTransactions = transactions.filter(tx => isSameDay(parseISO(tx.date), cloneDay));
        const importantTx = dayTransactions.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "h-24 border-t border-l border-slate-100 p-2 relative transition-colors cursor-pointer hover:bg-slate-50",
              !isSameMonth(day, monthStart) ? "bg-slate-50/50 text-slate-300" : "text-slate-900",
              i === 6 ? "border-r" : ""
            )}
            onClick={() => onDayClick(cloneDay)}
          >
            <span className="text-sm font-medium z-10">{formattedDate}</span>
            
            <div className="mt-1 space-y-1 overflow-hidden">
              {importantTx && (
                <div className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded truncate font-medium",
                  importantTx.type === 'income' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}>
                  {importantTx.note}
                </div>
              )}
              {dayTransactions.length > 1 && (
                <div className="text-[10px] text-slate-400 px-1">
                  +{dayTransactions.length - 1} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-b border-r border-slate-100 rounded-xl overflow-hidden">{rows}</div>;
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
