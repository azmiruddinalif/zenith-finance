import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock, Mail, User, Globe, X, CheckCircle2, AlertCircle, Plus, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../services/api';

export interface SavedSocialAccount {
  email: string;
  name: string;
  provider: 'google' | 'facebook';
  lastUsed: number;
}

const STORAGE_SAVED_KEY = 'zenith_saved_social_accounts';
const STORAGE_DEF_GOOGLE_KEY = 'zenith_default_google_account';
const STORAGE_DEF_FB_KEY = 'zenith_default_facebook_account';

const INITIAL_DEFAULT_GOOGLE: SavedSocialAccount = {
  email: 'alifazmiruddin@gmail.com',
  name: 'Alif Azmiruddin',
  provider: 'google',
  lastUsed: Date.now(),
};

const INITIAL_DEFAULT_FB: SavedSocialAccount = {
  email: 'alifazmiruddin@gmail.com',
  name: 'Azmir Uddin',
  provider: 'facebook',
  lastUsed: Date.now(),
};

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

  // Auto-detected default accounts for this browser
  const [defaultGoogle, setDefaultGoogle] = useState<SavedSocialAccount>(INITIAL_DEFAULT_GOOGLE);
  const [defaultFacebook, setDefaultFacebook] = useState<SavedSocialAccount>(INITIAL_DEFAULT_FB);
  const [savedAccounts, setSavedAccounts] = useState<SavedSocialAccount[]>([]);

  // Account Switcher / Custom Account modal state
  const [socialModal, setSocialModal] = useState<{
    open: boolean;
    provider: 'google' | 'facebook';
    mode: 'choose' | 'new';
    inputEmail: string;
    inputName: string;
  }>({
    open: false,
    provider: 'google',
    mode: 'choose',
    inputEmail: '',
    inputName: '',
  });

  // Load saved and default accounts on component mount
  useEffect(() => {
    try {
      // 1. Saved accounts list
      const storedSaved = localStorage.getItem(STORAGE_SAVED_KEY);
      if (storedSaved) {
        const parsed = JSON.parse(storedSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAccounts(parsed);
        } else {
          setSavedAccounts([INITIAL_DEFAULT_GOOGLE, INITIAL_DEFAULT_FB]);
        }
      } else {
        setSavedAccounts([INITIAL_DEFAULT_GOOGLE, INITIAL_DEFAULT_FB]);
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify([INITIAL_DEFAULT_GOOGLE, INITIAL_DEFAULT_FB]));
      }

      // 2. Default Google account
      const storedDefGoogle = localStorage.getItem(STORAGE_DEF_GOOGLE_KEY);
      if (storedDefGoogle) {
        setDefaultGoogle(JSON.parse(storedDefGoogle));
      } else {
        localStorage.setItem(STORAGE_DEF_GOOGLE_KEY, JSON.stringify(INITIAL_DEFAULT_GOOGLE));
      }

      // 3. Default Facebook account
      const storedDefFb = localStorage.getItem(STORAGE_DEF_FB_KEY);
      if (storedDefFb) {
        setDefaultFacebook(JSON.parse(storedDefFb));
      } else {
        localStorage.setItem(STORAGE_DEF_FB_KEY, JSON.stringify(INITIAL_DEFAULT_FB));
      }
    } catch {
      // Fallback to initial defaults
    }
  }, []);

  const saveAccountToStorage = (account: SavedSocialAccount) => {
    // Update default for this provider
    if (account.provider === 'google') {
      setDefaultGoogle(account);
      try { localStorage.setItem(STORAGE_DEF_GOOGLE_KEY, JSON.stringify(account)); } catch {}
    } else {
      setDefaultFacebook(account);
      try { localStorage.setItem(STORAGE_DEF_FB_KEY, JSON.stringify(account)); } catch {}
    }

    // Update list
    setSavedAccounts(prev => {
      const filtered = prev.filter(a => a.email.toLowerCase() !== account.email.toLowerCase() || a.provider !== account.provider);
      const updated = [account, ...filtered].slice(0, 6);
      try { localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const removeAccountFromStorage = (targetEmail: string, provider: 'google' | 'facebook', e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedAccounts(prev => {
      const updated = prev.filter(a => !(a.email.toLowerCase() === targetEmail.toLowerCase() && a.provider === provider));
      try { localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const handleExecuteSocialLogin = async (provider: 'google' | 'facebook', targetEmail: string, targetName?: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid email address');
      return;
    }

    const cleanName = targetName?.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    setError(null);
    setSocialLoading(provider);

    const res = await socialLogin(provider, cleanEmail, cleanName);
    if (res.success) {
      saveAccountToStorage({
        email: cleanEmail,
        name: cleanName,
        provider,
        lastUsed: Date.now(),
      });
      setSocialModal(prev => ({ ...prev, open: false }));
    } else {
      setError(res.message || `Failed to sign in with ${provider}`);
    }
    setSocialLoading(null);
  };

  // AUTO GET DEFAULT EMAIL ON 1-CLICK:
  const handleAutoGoogleLogin = () => {
    // Automatically uses default Google email
    handleExecuteSocialLogin('google', defaultGoogle.email, defaultGoogle.name);
  };

  const handleAutoFacebookLogin = () => {
    // Automatically uses default Facebook email
    handleExecuteSocialLogin('facebook', defaultFacebook.email, defaultFacebook.name);
  };

  const handleOpenAccountSwitcher = (provider: 'google' | 'facebook') => {
    setError(null);
    setSocialModal({
      open: true,
      provider,
      mode: 'choose',
      inputEmail: '',
      inputName: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isLogin) {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } else {
      const res = await register(name, email, password, currency);
      if (!res.success) {
        setError(res.message || 'Registration failed');
      }
    }
    setLoading(false);
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
            Intelligent personal wealth & offline-first expense management
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

        {/* 1-CLICK AUTO SIGN-IN BUTTONS (Auto-gets default user email) */}
        <div className="grid grid-cols-2 gap-2.5 mb-2">
          
          {/* Google Button - 1 Click Auto Login */}
          <button
            type="button"
            id="btn-google-signin"
            disabled={Boolean(socialLoading) || loading}
            onClick={handleAutoGoogleLogin}
            title={`Auto sign-in with default Google account: ${defaultGoogle.email}`}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 hover:border-emerald-500/50 text-xs font-semibold text-white transition active:scale-[0.98] shadow-sm group"
          >
            <svg className="w-4 h-4 shrink-0 transition group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span className="truncate">
              {socialLoading === 'google' ? 'Connecting...' : 'Sign in with Google'}
            </span>
          </button>

          {/* Facebook Button - 1 Click Auto Login */}
          <button
            type="button"
            id="btn-facebook-signin"
            disabled={Boolean(socialLoading) || loading}
            onClick={handleAutoFacebookLogin}
            title={`Auto sign-in with default Facebook account: ${defaultFacebook.email}`}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 hover:border-emerald-500/50 text-xs font-semibold text-white transition active:scale-[0.98] shadow-sm group"
          >
            <svg className="w-4 h-4 shrink-0 fill-[#1877F2] transition group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="truncate">
              {socialLoading === 'facebook' ? 'Connecting...' : 'Sign in with Facebook'}
            </span>
          </button>

        </div>

        {/* Auto-detected default badge & Switcher link */}
        <div className="flex items-center justify-between mb-4 px-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate text-slate-400">
              Default: <strong className="text-slate-200 font-medium">{defaultGoogle.email}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAccountSwitcher('google')}
            className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 shrink-0 transition flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Switch Account</span>
          </button>
        </div>

        {/* Divider: Or continue with email */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0b101b] px-2 text-slate-500 font-semibold tracking-wider">
              Or continue with email & password
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 animate-fade-in flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            {isLogin && error.toLowerCase().includes('invalid') && (
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(null); }}
                className="text-left text-[11px] text-emerald-400 hover:underline mt-1 pl-6"
              >
                Don't have an account yet? Click here to Create Free Account →
              </button>
            )}
          </div>
        )}

        {/* Email & Password Form */}
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
                  placeholder="Alex Morgan"
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

      {/* Account Switcher Modal (Choose another account or add new) */}
      {socialModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel-elevated rounded-2xl p-6 border border-slate-700 shadow-2xl relative">
            
            <button 
              onClick={() => setSocialModal(prev => ({ ...prev, open: false }))}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Provider Header */}
            <div className="flex items-center gap-3 mb-5">
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
                  {socialModal.provider === 'google' ? 'Google Account Chooser' : 'Facebook Account Chooser'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select or switch active profile for this browser
                </p>
              </div>
            </div>

            {/* Account Chooser Mode */}
            {socialModal.mode === 'choose' ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-300">Select account to sign in:</p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {savedAccounts.map((acc) => {
                    const isDef = (acc.provider === 'google' && acc.email === defaultGoogle.email) ||
                                  (acc.provider === 'facebook' && acc.email === defaultFacebook.email);
                    return (
                      <button
                        key={`${acc.provider}_${acc.email}`}
                        type="button"
                        onClick={() => handleExecuteSocialLogin(acc.provider, acc.email, acc.name)}
                        className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 hover:border-emerald-500/50 text-left transition flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950 shrink-0 shadow">
                            {acc.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition truncate">
                                {acc.name}
                              </p>
                              {isDef && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {acc.email} ({acc.provider})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                          <button
                            type="button"
                            title="Remove from saved accounts"
                            onClick={(e) => removeAccountFromStorage(acc.email, acc.provider, e)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 transition ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSocialModal(prev => ({ ...prev, mode: 'new' }))}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Use another account</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Add New / Different Account */
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSocialModal(prev => ({ ...prev, mode: 'choose' }))}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 mb-2 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to saved accounts</span>
                </button>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    {socialModal.provider === 'google' ? 'Google Email' : 'Facebook Email or Username'}
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder={socialModal.provider === 'google' ? 'you@gmail.com' : 'you@facebook.com'}
                    value={socialModal.inputEmail}
                    onChange={(e) => setSocialModal(prev => ({ ...prev, inputEmail: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleExecuteSocialLogin(socialModal.provider, socialModal.inputEmail, socialModal.inputName);
                      }
                    }}
                    className="w-full glass-input rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={socialModal.inputName}
                    onChange={(e) => setSocialModal(prev => ({ ...prev, inputName: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleExecuteSocialLogin(socialModal.provider, socialModal.inputEmail, socialModal.inputName);
                      }
                    }}
                    className="w-full glass-input rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="btn-social-confirm-login"
                    disabled={!socialModal.inputEmail}
                    onClick={() => handleExecuteSocialLogin(socialModal.provider, socialModal.inputEmail, socialModal.inputName)}
                    className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                      socialModal.provider === 'google'
                        ? 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10'
                        : 'bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-blue-500/20'
                    }`}
                  >
                    <span>
                      {socialLoading ? 'Authorizing...' : `Sign in and Set as Default`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
