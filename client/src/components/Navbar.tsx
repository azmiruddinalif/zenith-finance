import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, Plus, Wifi, WifiOff, UploadCloud, 
  ChevronDown, LogOut, User, RefreshCw, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../services/api';

export const Navbar: React.FC = () => {
  const { 
    isOnline, currency, setCurrency, 
    setIsQuickAddOpen, setIsAiModalOpen, setIsImportModalOpen 
  } = useFinance();

  const { user, logout, setIsProfileModalOpen } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <img 
              src="/logo.jpg" 
              alt="Zenith Finance" 
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-400 transition-all shadow-lg"
            />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 -z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Zenith
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SaaS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Personal Wealth & Expense Platform</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          
          {/* Online / Offline Badge */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              isOnline 
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' 
                : 'bg-amber-950/50 text-amber-300 border-amber-800/60 animate-pulse'
            }`}
            title={isOnline ? 'Connected to PostgreSQL Server' : 'Offline Mode: Stored in IndexedDB'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline Sync'}</span>
          </div>

          {/* Currency Selector */}
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              aria-label="Select Currency"
              className="appearance-none bg-slate-900/80 border border-slate-700/70 hover:border-slate-600 text-slate-200 text-xs font-medium rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-100">
                  {CURRENCY_SYMBOLS[c]} {c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Bank Statement CSV Import (Desktop Highlight) */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 hover:border-cyan-500/40 transition shadow-sm hover:text-cyan-300"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          {/* AI Spending Analysis Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600/80 to-purple-600/80 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/30 border border-violet-400/30 hover:shadow-purple-700/40 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span className="hidden sm:inline">AI Analysis</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Quick Add Button */}
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden md:inline">Quick Add</span>
          </button>

          {/* User Profile Pill & Rich Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer group"
            >
              <span className="text-xs font-semibold text-slate-200 hidden md:inline max-w-[120px] truncate group-hover:text-emerald-300 transition">
                {user?.name || 'Account'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950 shadow">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel-elevated p-3 border border-slate-700 shadow-2xl z-50 animate-fade-in space-y-2">
                
                {/* User Info Card */}
                <div 
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-emerald-500/40 transition group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-slate-950 shadow shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-300 truncate transition">
                      {user?.name || 'User Profile'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>

                {/* View Full Profile Action */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition group"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Profile & Settings</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                </button>

                {/* Switch Account */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Switch Account</span>
                </button>

                {/* Sign Out */}
                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
