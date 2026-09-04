import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Check, ArrowDownLeft, ArrowUpRight, Zap } from 'lucide-react';

export const QuickAddModal: React.FC = () => {
  const { 
    isQuickAddOpen, setIsQuickAddOpen, categories, accounts, 
    addTransaction, currency 
  } = useFinance();

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isQuickAddOpen) return null;

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const handleQuickAddAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    const targetCatId = categoryId || (categories.find(c => c.type === type)?.id || categories[0]?.id);
    const targetAccId = accountId || accounts[0]?.id;

    const ok = await addTransaction({
      type,
      amount: parseFloat(amount),
      currency,
      description: description.trim() || (type === 'EXPENSE' ? 'Quick Expense' : 'Quick Income'),
      categoryId: targetCatId,
      accountId: targetAccId,
      date: new Date().toISOString(),
    });

    setIsSubmitting(false);
    if (ok) {
      setAmount('');
      setDescription('');
      setIsQuickAddOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg glass-panel-elevated sm:rounded-3xl rounded-t-3xl border border-slate-700/80 p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">1-Tap Rapid Expense</h2>
          </div>
          <button
            onClick={() => setIsQuickAddOpen(false)}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          
          {/* Type Toggle: Expense / Income */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                type === 'EXPENSE' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                type === 'INCOME' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Income</span>
            </button>
          </div>

          {/* Amount Display with Numpad feel */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Amount ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-3xl font-extrabold glass-input rounded-2xl px-4 py-3 text-white tracking-tight focus:ring-2 focus:ring-emerald-500 text-center"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => handleQuickAddAmount(q)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-slate-700/60 transition active:scale-95"
                >
                  +{q}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700/60 transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Description / Merchant
            </label>
            <input
              type="text"
              placeholder="e.g. Shwapno Bazar, Uber, Dinner"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white"
            />
          </div>

          {/* Category Chips (Quick Selector) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Select Category
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.filter(c => c.type === type).map((cat) => {
                const isSelected = (categoryId || categories[0]?.id) === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                        : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Paid From Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !amount}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{isSubmitting ? 'Recording...' : 'Record Transaction'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
