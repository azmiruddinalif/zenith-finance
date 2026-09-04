import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { LayoutDashboard, Receipt, Plus, PieChart, Target } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsQuickAddOpen } = useFinance();

  const items = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'Activity', icon: Receipt },
    { id: 'analytics', label: 'Trends', icon: PieChart },
    { id: 'budgets', label: 'Budgets', icon: Target },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800/90 px-3 py-2">
      <div className="flex items-center justify-around relative">
        
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Floating Quick Add Trigger */}
        <div className="-mt-7">
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 p-3.5 shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform flex items-center justify-center ring-4 ring-[#070A0F]"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}

      </div>
    </nav>
  );
};
