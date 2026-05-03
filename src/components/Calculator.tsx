import { useState } from 'react';
import { Delete, Divide, Minus, Plus, X, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalculatorProps {
  onResult: (value: number) => void;
  className?: string;
}

export function Calculator({ onResult, className }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (n: string) => {
    setDisplay(prev => prev === '0' ? n : prev + n);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      // Simple and safe eval for basic math
      const tokens = fullEquation.split(' ');
      let result = parseFloat(tokens[0]);
      
      for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i];
        const nextVal = parseFloat(tokens[i+1]);
        if (op === '+') result += nextVal;
        if (op === '-') result -= nextVal;
        if (op === '*') result *= nextVal;
        if (op === '/') result /= nextVal;
      }
      
      setDisplay(result.toString());
      setEquation('');
      onResult(result);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  return (
    <div className={cn("bg-slate-900 text-white p-4 rounded-2xl shadow-2xl w-full max-w-[280px]", className)}>
      <div className="mb-4 text-right overflow-hidden">
        <div className="text-slate-400 text-xs h-4 mb-1">{equation}</div>
        <div className="text-2xl font-bold font-mono truncate">{display}</div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <button onClick={clear} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center col-span-2">
          <RotateCcw className="w-4 h-4 mr-2" /> Clear
        </button>
        <button onClick={() => setDisplay(prev => prev.slice(0, -1) || '0')} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center">
          <Delete className="w-4 h-4" />
        </button>
        <button onClick={() => handleOperator('/')} className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors flex items-center justify-center">
          <Divide className="w-4 h-4" />
        </button>

        {[7, 8, 9].map(n => (
          <button key={n} onClick={() => handleNumber(n.toString())} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 font-bold">{n}</button>
        ))}
        <button onClick={() => handleOperator('*')} className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>

        {[4, 5, 6].map(n => (
          <button key={n} onClick={() => handleNumber(n.toString())} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 font-bold">{n}</button>
        ))}
        <button onClick={() => handleOperator('-')} className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 flex items-center justify-center">
          <Minus className="w-4 h-4" />
        </button>

        {[1, 2, 3].map(n => (
          <button key={n} onClick={() => handleNumber(n.toString())} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 font-bold">{n}</button>
        ))}
        <button onClick={() => handleOperator('+')} className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </button>

        <button onClick={() => handleNumber('0')} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 font-bold col-span-2">0</button>
        <button onClick={() => handleNumber('.')} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 font-bold">.</button>
        <button onClick={calculate} className="p-3 bg-emerald-600 rounded-xl hover:bg-emerald-500 font-bold">=</button>
      </div>
    </div>
  );
}
