import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { transactions, categories, formatMoney } = useFinance();

  // Aggregate monthly expense distribution
  const categorySpending: Record<string, { name: string; amount: number; color: string }> = {};
  transactions.filter(t => t.type === 'EXPENSE').forEach((t) => {
    const catName = t.category?.name || 'General';
    const color = t.category?.color || '#10B981';
    if (!categorySpending[catName]) {
      categorySpending[catName] = { name: catName, amount: 0, color };
    }
    categorySpending[catName].amount += t.amount;
  });

  const barData = Object.values(categorySpending).sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <h2 className="text-lg font-bold text-white">Comprehensive Financial Analytics</h2>
        <p className="text-xs text-slate-400">Deep category breakdown and spending distribution</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Spending Bar Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Expenses by Category</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData.slice(0, 7)} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090D16', borderColor: '#334155', borderRadius: '10px', fontSize: '12px', color: '#FFFFFF', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6)' }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
                  labelStyle={{ color: '#FFFFFF', fontWeight: 700 }}
                  formatter={(val: any) => [formatMoney(Number(val)), 'Spending']}
                />
                <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Category Allocations</h3>
          <div className="space-y-3">
            {barData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-white">{formatMoney(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
