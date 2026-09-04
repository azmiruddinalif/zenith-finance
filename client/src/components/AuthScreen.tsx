import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, ArrowRight, Lock, Mail, User, Check, Globe } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../services/api';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [currency, setCurrency] = useState<string>('BDT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isLogin) {
      const res = await login(email, password);
      if (!res.success) setError(res.message || 'Login failed');
    } else {
      const res = await register(name, email, password, currency);
      if (!res.success) setError(res.message || 'Registration failed');
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    const res = await login('demo@zenith.finance', 'password123');
    if (!res.success) setError(res.message || 'Demo login failed');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#070A0F] relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-7 sm:p-8 border border-slate-700/80 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <img 
              src="/logo.jpg" 
              alt="Zenith Finance" 
              className="w-14 h-14 rounded-2xl mx-auto ring-2 ring-emerald-500/40 shadow-xl" 
            />
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-40 -z-10" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Zenith Finance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Production-grade personal wealth & offline-first expense platform
          </p>
        </div>

        {/* Tab Switcher: Sign In / Create Account */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition ${
              isLogin ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition ${
              !isLogin ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {!isLogin && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ashikur Rahman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2.5 text-xs text-white"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Primary Currency
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2.5 text-xs text-white"
                >
                  {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {CURRENCY_SYMBOLS[c]} {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Processing...' : isLogin ? 'Sign In to Workspace' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

        {/* Demo Fast Login Trigger */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 mb-2">Want to test with full sample data?</p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-semibold text-xs border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>1-Click Demo Sign In</span>
          </button>
        </div>

      </div>
    </div>
  );
};
