import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Search, Filter, Trash2, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';

export const TransactionManager: React.FC = () => {
  const { transactions, categories, accounts, deleteTransaction, formatMoney } = useFinance();
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filtered = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.tags && t.tags.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesCat = filterCategory === 'ALL' || t.categoryId === filterCategory;
    return matchesSearch && matchesType && matchesCat;
  });

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      
      {/* Title & Filter Controls */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Transaction History</h2>
            <p className="text-xs text-slate-400">Manage and inspect all recorded cash inflows & outflows</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 self-start sm:self-auto">
            {filtered.length} Records
          </span>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search merchant, tag, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="ALL" className="bg-slate-900">All Flow Types</option>
            <option value="EXPENSE" className="bg-slate-900">Expenses Only</option>
            <option value="INCOME" className="bg-slate-900">Income Only</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="ALL" className="bg-slate-900">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table / Card List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-800/80">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No transactions match your search filter.
            </div>
          ) : (
            filtered.map((tx) => (
              <div 
                key={tx.id} 
                className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    tx.type === 'INCOME' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {tx.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">{tx.description}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">{tx.category?.name || 'Category'}</span>
                      <span>•</span>
                      <span className="text-slate-400">{tx.account?.name || 'Account'}</span>
                      {tx.tags && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-cyan-300">
                          {tx.tags}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-xs sm:text-sm font-bold ${
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatMoney(tx.amount)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    aria-label="Delete transaction"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
