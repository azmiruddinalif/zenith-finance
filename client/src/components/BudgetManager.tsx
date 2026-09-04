import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Target, AlertCircle, CheckCircle2 } from 'lucide-react';

export const BudgetManager: React.FC = () => {
  const { budget, formatMoney } = useFinance();

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Monthly Budgets</h2>
          <p className="text-xs text-slate-400">Track and limit category expenditure with proactive alerts</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Total Monthly Budget</span>
          <span className="text-xl font-bold text-emerald-400">
            {formatMoney(budget?.totalLimit || 65000)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budget?.categoryBudgets?.map((cat) => (
          <div 
            key={cat.id}
            className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <h4 className="text-xs font-bold text-white">{cat.name}</h4>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                cat.isOverBudget 
                  ? 'bg-rose-950/50 text-rose-400 border-rose-800/60' 
                  : cat.percentage > 80 
                  ? 'bg-amber-950/50 text-amber-400 border-amber-800/60'
                  : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
              }`}>
                {cat.percentage}% Used
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  cat.isOverBudget ? 'bg-rose-500' : cat.percentage > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, cat.percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Spent: <strong className="text-slate-200">{formatMoney(cat.spent)}</strong></span>
              <span>Limit: <strong className="text-slate-200">{formatMoney(cat.budgetLimit)}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
