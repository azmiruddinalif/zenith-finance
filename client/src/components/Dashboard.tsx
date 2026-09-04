import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  TrendingUp, TrendingDown, Wallet, PiggyBank, 
  ArrowUpRight, ArrowDownRight, AlertCircle, Sparkles, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart as RechartsPie, Pie, Cell 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { 
    formatMoney, transactions, accounts, budget, 
    reminders, aiInsight, setActiveTab, setIsAiModalOpen, setIsQuickAddOpen 
  } = useFinance();

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const now = new Date();
  const currentMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = currentMonthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // Chart data: 7-day flow
  const chartData = [
    { day: 'Mon', income: 0, expense: 3200 },
    { day: 'Tue', income: 15000, expense: 1200 },
    { day: 'Wed', income: 0, expense: 4850 },
    { day: 'Thu', income: 0, expense: 2100 },
    { day: 'Fri', income: 35000, expense: 6200 },
    { day: 'Sat', income: 0, expense: 3800 },
    { day: 'Sun', income: 0, expense: 1950 },
  ];

  // Category Pie Data
  const categoryMap: Record<string, { name: string; value: number; color: string }> = {};
  currentMonthTxs.filter(t => t.type === 'EXPENSE').forEach((t) => {
    const name = t.category?.name || 'General';
    const color = t.category?.color || '#10B981';
    if (!categoryMap[name]) categoryMap[name] = { name, value: 0, color };
    categoryMap[name].value += t.amount;
  });
  const pieData = Object.values(categoryMap).slice(0, 6);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">

      {/* Top Banner: AI Financial Health Score & Quick Insight */}
      {aiInsight && (
        <div 
          onClick={() => setIsAiModalOpen(true)}
          className="relative overflow-hidden rounded-2xl glass-panel-elevated p-4 sm:p-5 border border-emerald-500/20 cursor-pointer group hover:border-emerald-500/40 transition-all shadow-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-extrabold text-lg shadow-lg shrink-0">
                {aiInsight.healthScore}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Health Score
                  </span>
                  <span className="text-[11px] text-slate-400">Optimal Savings Velocity</span>
                </div>
                <p className="text-sm font-medium text-slate-200 mt-0.5 group-hover:text-emerald-300 transition line-clamp-1">
                  {aiInsight.summaryBn}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>View Full AI Report</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Net Worth / Total Balance */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Net Worth</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {formatMoney(totalBalance)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Across {accounts.length} active accounts</span>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly Inflow</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400">
            +{formatMoney(totalIncome)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/80 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Salary & Consulting</span>
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly Outflow</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-rose-400">
            -{formatMoney(totalExpense)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            <span>{currentMonthTxs.filter(t => t.type === 'EXPENSE').length} transactions</span>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Savings Margin</span>
            <PiggyBank className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-cyan-300">
            {savingsRate}%
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Target: 40% monthly
          </div>
        </div>

      </div>

      {/* Cash Flow Visualizer & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow Chart (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Cash Flow Dynamics</h3>
              <p className="text-xs text-slate-400">Weekly trajectory of income vs expenditures</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Outflow
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D131F', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }} 
                  itemStyle={{ color: '#F1F5F9' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown (1 Col) */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Top Spend Categories</h3>
            <p className="text-xs text-slate-400 mb-4">Monthly allocation breakdown</p>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0D131F', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => formatMoney(Number(val))}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-3 pt-3 border-t border-slate-800/80">
            {pieData.slice(0, 3).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 truncate max-w-[120px]">{cat.name}</span>
                </div>
                <span className="font-semibold text-white">{formatMoney(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Section: Accounts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Accounts List */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Accounts & Wallets</h3>
            <span className="text-xs text-slate-400">{accounts.length} Total</span>
          </div>

          <div className="space-y-3">
            {accounts.map((acc) => (
              <div 
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-8 rounded-full"
                    style={{ backgroundColor: acc.color || '#10B981' }}
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-white">{acc.name}</h4>
                    <p className="text-[10px] text-slate-400">{acc.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-200">
                    {formatMoney(acc.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Latest income and expense records</p>
            </div>
            <button 
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    tx.type === 'INCOME' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-white line-clamp-1">{tx.description}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span className="text-emerald-400/90">{tx.category?.name || 'General'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold ${
                    tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-200'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatMoney(tx.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
