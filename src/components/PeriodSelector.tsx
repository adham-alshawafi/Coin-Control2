import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay,
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  parseISO
} from 'date-fns';
import { cn } from '../lib/utils';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface PeriodSelectorProps {
  currentRange: { start: string; end: string };
  onRangeChange: (range: { start: string; end: string }) => void;
}

export function PeriodSelector({ currentRange, onRangeChange }: PeriodSelectorProps) {
  const [activePeriod, setActivePeriod] = React.useState<PeriodType>('monthly');

  const updateRange = (type: PeriodType, baseDate: Date = new Date()) => {
    if (type === 'custom') {
      setActivePeriod('custom');
      return;
    }

    let start: Date, end: Date;
    switch (type) {
      case 'daily':
        start = startOfDay(baseDate);
        end = endOfDay(baseDate);
        break;
      case 'weekly':
        start = startOfWeek(baseDate, { weekStartsOn: 1 });
        end = endOfWeek(baseDate, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(baseDate);
        end = endOfMonth(baseDate);
        break;
      case 'yearly':
        start = startOfYear(baseDate);
        end = endOfYear(baseDate);
        break;
      default:
        return;
    }
    onRangeChange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    });
  };

  const handlePeriodChange = (type: PeriodType) => {
    setActivePeriod(type);
    if (type !== 'custom') {
      updateRange(type);
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (activePeriod === 'custom') return;
    
    const baseDate = parseISO(currentRange.start);
    let newDate: Date;
    
    switch (activePeriod) {
      case 'daily':
        newDate = direction === 'prev' ? subDays(baseDate, 1) : addDays(baseDate, 1);
        break;
      case 'weekly':
        newDate = direction === 'prev' ? subWeeks(baseDate, 1) : addWeeks(baseDate, 1);
        break;
      case 'monthly':
        newDate = direction === 'prev' ? subMonths(baseDate, 1) : addMonths(baseDate, 1);
        break;
      case 'yearly':
        newDate = direction === 'prev' ? subYears(baseDate, 1) : addYears(baseDate, 1);
        break;
      default:
        return;
    }
    updateRange(activePeriod, newDate);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-2 rounded-[32px] border border-slate-200/60 shadow-sm gap-4">
        <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
          {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as PeriodType[]).map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activePeriod === period 
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {period}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 px-2 w-full sm:w-auto justify-between sm:justify-end">
          {activePeriod !== 'custom' && (
            <button 
              onClick={() => navigate('prev')}
              className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex flex-col items-center min-w-[160px] sm:min-w-[200px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-center">
              {activePeriod === 'custom' ? 'Select Date Range' : `Viewing ${activePeriod} View`}
            </span>
            
            {activePeriod === 'custom' ? (
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={currentRange.start}
                  onChange={(e) => onRangeChange({ ...currentRange, start: e.target.value })}
                  className="bg-slate-50 px-2 py-1 rounded-lg text-xs font-bold text-indigo-600 outline-none border border-slate-100 focus:border-indigo-200"
                />
                <span className="text-slate-300">→</span>
                <input 
                  type="date" 
                  value={currentRange.end}
                  onChange={(e) => onRangeChange({ ...currentRange, end: e.target.value })}
                  className="bg-slate-50 px-2 py-1 rounded-lg text-xs font-bold text-indigo-600 outline-none border border-slate-100 focus:border-indigo-200"
                />
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-bold text-slate-900 flex flex-wrap items-center justify-center gap-x-2 whitespace-nowrap">
                <span>{format(parseISO(currentRange.start), 'EEE, d MMM yyyy')}</span>
                {activePeriod !== 'daily' && (
                  <>
                    <span className="text-slate-300">→</span>
                    <span>{format(parseISO(currentRange.end), 'EEE, d MMM yyyy')}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {activePeriod !== 'custom' && (
            <button 
              onClick={() => navigate('next')}
              className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
