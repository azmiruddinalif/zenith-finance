import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock, Mail, User, Globe, X, CheckCircle2 } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../services/api';

export const AuthScreen: React.FC = () => {
  const { login, register, socialLogin } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [currency, setCurrency] = useState<string>('BDT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Social account picker modal state
  const [socialModal, setSocialModal] = useState<{
    open: boolean;
    provider: 'google' | 'facebook';
    customEmail: string;
    customName: string;
  }>({
    open: false,
    provider: 'google',
    customEmail: '',
    customName: '',
  });

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

  const handleOpenSocialModal = (provider: 'google' | 'facebook') => {
    setError(null);
    setSocialModal({
      open: true,
      provider,
      customEmail: provider === 'google' ? 'alifazmiruddin@gmail.com' : 'azmir.facebook@gmail.com',
      customName: 'Azmir Uddin',
    });
  };

  const handleExecuteSocialLogin = async (provider: 'google' | 'facebook', targetEmail: string, targetName: string) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }
    setError(null);
    setSocialLoading(provider);
    setSocialModal(prev => ({ ...prev, open: false }));

    const res = await socialLogin(provider, targetEmail, targetName);
    if (!res.success) {
      setError(res.message || `Failed to sign in with ${provider}`);
    }
    setSocialLoading(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#070A0F] relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-7 sm:p-8 border border-slate-700/80 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-5">
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
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800 mb-4">
          <button
            type="button"
            id="tab-sign-in"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition ${
              isLogin ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-create-account"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition ${
              !isLogin ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Social Sign-In Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          
          {/* Google Button */}
          <button
            type="button"
            id="btn-google-signin"
            disabled={Boolean(socialLoading) || loading}
            onClick={() => handleOpenSocialModal('google')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-500 text-xs font-semibold text-white transition active:scale-[0.98] shadow-sm group"
          >
            <svg className="w-4 h-4 shrink-0 transition group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>{socialLoading === 'google' ? 'Connecting...' : 'Google'}</span>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            id="btn-facebook-signin"
            disabled={Boolean(socialLoading) || loading}
            onClick={() => handleOpenSocialModal('facebook')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-500 text-xs font-semibold text-white transition active:scale-[0.98] shadow-sm group"
          >
            <svg className="w-4 h-4 shrink-0 fill-[#1877F2] transition group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>{socialLoading === 'facebook' ? 'Connecting...' : 'Facebook'}</span>
          </button>

        </div>

        {/* Divider: Or continue with email */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0b101b] px-2 text-slate-500 font-semibold tracking-wider">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 animate-fade-in">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
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
                  placeholder="e.g. Azmir Uddin"
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
              disabled={loading || Boolean(socialLoading)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Processing...' : isLogin ? 'Sign In to Workspace' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>

      {/* Social Identity Confirmation Modal */}
      {socialModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel-elevated rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
            
            <button 
              onClick={() => setSocialModal(prev => ({ ...prev, open: false }))}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Provider Header */}
            <div className="flex items-center gap-3 mb-4">
              {socialModal.provider === 'google' ? (
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-white capitalize">
                  Continue with {socialModal.provider}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select or confirm your profile to sign in
                </p>
              </div>
            </div>

            {/* Quick 1-Click Profile Pill */}
            <div className="mb-4">
              <button
                type="button"
                id="btn-social-quick-profile"
                onClick={() => handleExecuteSocialLogin(socialModal.provider, socialModal.customEmail, socialModal.customName)}
                className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 hover:border-emerald-500/50 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950 shadow">
                    {socialModal.customName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition">
                      {socialModal.customName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {socialModal.customEmail}
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
              </button>
            </div>

            {/* Manual Email Input for Custom Account */}
            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[11px] text-slate-400 mb-2">Or connect with another {socialModal.provider} email:</p>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={socialModal.customEmail}
                  onChange={(e) => setSocialModal(prev => ({ ...prev, customEmail: e.target.value }))}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  id="btn-social-confirm-login"
                  onClick={() => handleExecuteSocialLogin(socialModal.provider, socialModal.customEmail, socialModal.customName)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  Authorize & Sign In
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
