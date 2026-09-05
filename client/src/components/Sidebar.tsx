import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Receipt, PieChart, Target, 
  Repeat, UploadCloud, Sparkles 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, setIsAiModalOpen, setIsImportModalOpen } = useFinance();
  const { user, setIsProfileModalOpen } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'analytics', label: 'Analytics & Charts', icon: PieChart },
    { id: 'budgets', label: 'Monthly Budgets', icon: Target },
    { id: 'recurring', label: 'Recurring & Bills', icon: Repeat },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 glass-panel border-r border-slate-800/80 p-4 shrink-0 min-h-[calc(100vh-61px)]">
      
      {/* Navigation Links */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Finance Management
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Tools Section */}
      <div className="mt-8 space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Intelligence & Tools
        </p>
        
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/20 border border-transparent hover:border-cyan-800/30 transition-all"
        >
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          <span>Bank Statement Import</span>
        </button>

        <button
          onClick={() => setIsAiModalOpen(true)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-violet-300 hover:bg-violet-950/20 border border-transparent hover:border-violet-800/30 transition-all"
        >
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>AI Spending Advisory</span>
        </button>
      </div>

          {/* User Profile Card in Sidebar */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950 shadow shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate">
              {user?.name || 'My Profile'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.email || 'View Profile'}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
};
