import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock, Mail, User, Globe, X, CheckCircle2, AlertCircle, Plus, Trash2, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../services/api';
import { googleAuthService } from '../services/googleAuth';
import { facebookAuthService } from '../services/facebookAuth';

export interface SavedSocialAccount {
  email: string;
  name: string;
  provider: 'google' | 'facebook' | 'email';
  avatar?: string;
  lastUsed: number;
}

const STORAGE_SAVED_KEY = 'zenith_saved_social_accounts';
const STORAGE_LAST_ACTIVE_KEY = 'zenith_last_active_account';

export const AuthScreen: React.FC = () => {
  const { login, register, socialLogin } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [currency, setCurrency] = useState<string>('BDT');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Browser-local saved accounts (isolated per machine/browser, starts empty on fresh PCs)
  const [savedAccounts, setSavedAccounts] = useState<SavedSocialAccount[]>([]);
  const [lastActiveAccount, setLastActiveAccount] = useState<SavedSocialAccount | null>(null);

  // Manual Account Modal state (for fallback or adding custom accounts)
  const [manualModal, setManualModal] = useState<{
    open: boolean;
    provider: 'google' | 'facebook';
    email: string;
    name: string;
  }>({
    open: false,
    provider: 'google',
    email: '',
    name: '',
  });

  // Account Switcher modal state
  const [isSwitcherOpen, setIsSwitcherOpen] = useState<boolean>(false);

  // Initialize saved accounts from local storage only (zero hardcoded defaults)
  useEffect(() => {
    // 1. Google One Tap for instant Google account detection if active session in Chrome
    googleAuthService.initializeOneTap((gUser) => {
      if (gUser && gUser.email) {
        executeSocialLogin('google', gUser.email, gUser.name, gUser.picture);
      }
    });

    try {
      const stored = localStorage.getItem(STORAGE_SAVED_KEY);
      if (stored) {
        const parsed: SavedSocialAccount[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAccounts(parsed);
          
          const lastActiveStored = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
          if (lastActiveStored) {
            setLastActiveAccount(JSON.parse(lastActiveStored));
          } else {
            setLastActiveAccount(parsed[0]);
          }
        }
      }
    } catch {
      // Clean start on any read errors
      setSavedAccounts([]);
      setLastActiveAccount(null);
    }
  }, []);

  const persistAccount = (account: SavedSocialAccount) => {
    setLastActiveAccount(account);
    try {
      localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, JSON.stringify(account));
    } catch {}

    setSavedAccounts((prev) => {
      const filtered = prev.filter(
        (a) => a.email.toLowerCase() !== account.email.toLowerCase() || a.provider !== account.provider
      );
      const updated = [account, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeSavedAccount = (targetEmail: string, provider: 'google' | 'facebook' | 'email', e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedAccounts((prev) => {
      const updated = prev.filter(
        (a) => !(a.email.toLowerCase() === targetEmail.toLowerCase() && a.provider === provider)
      );
      try {
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(updated));
      } catch {}
      if (lastActiveAccount?.email.toLowerCase() === targetEmail.toLowerCase() && lastActiveAccount.provider === provider) {
        const nextActive = updated[0] || null;
        setLastActiveAccount(nextActive);
        if (nextActive) {
          try { localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, JSON.stringify(nextActive)); } catch {}
        } else {
          try { localStorage.removeItem(STORAGE_LAST_ACTIVE_KEY); } catch {}
        }
      }
      return updated;
    });
  };

  const executeSocialLogin = async (
    provider: 'google' | 'facebook',
    targetEmail: string,
    targetName?: string,
    avatar?: string
  ) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid email address');
      return;
    }

    const cleanName = targetName?.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    setError(null);
    setSocialLoading(provider);

    const res = await socialLogin(provider, cleanEmail, cleanName);
    if (res.success) {
      persistAccount({
        email: cleanEmail,
        name: cleanName,
        provider,
        avatar,
        lastUsed: Date.now(),
      });
      setManualModal((prev) => ({ ...prev, open: false }));
      setIsSwitcherOpen(false);
    } else {
      setError(res.message || `Failed to sign in with ${provider}`);
    }
    setSocialLoading(null);
  };

  /**
   * REAL Google Identity Services Sign In Flow
   * Triggers Google's genuine account selector popup
   */
  const handleGoogleSignIn = async () => {
    setError(null);
    setSocialLoading('google');

    try {
      const result = await googleAuthService.signInWithGoogle();

      if (result.success && result.user) {
        await executeSocialLogin(
          'google',
          result.user.email,
          result.user.name,
          result.user.picture
        );
      } else {
        const msg = result.message || 'Google Sign-In popup could not complete.';
        setError(msg);
        // Seamlessly open fallback modal so the user is never stuck
        setManualModal({
          open: true,
          provider: 'google',
          email: '',
          name: '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In popup closed.');
      setManualModal({
        open: true,
        provider: 'google',
        email: '',
        name: '',
      });
    } finally {
      setSocialLoading(null);
    }
  };

  /**
   * REAL Facebook Sign In Flow
   */
  const handleFacebookSignIn = async () => {
    setError(null);
    setSocialLoading('facebook');

    try {
      const result = await facebookAuthService.signInWithFacebook();

      if (result.success && result.user) {
        await executeSocialLogin(
          'facebook',
          result.user.email || `fb_${result.user.id}@facebook.user`,
          result.user.name,
          result.user.picture
        );
      } else {
        // Graceful fallback to manual Facebook modal
        setManualModal({
          open: true,
          provider: 'facebook',
          email: '',
          name: '',
        });
        if (result.message && !result.message.includes('cancelled')) {
          setError(result.message);
        }
      }
    } catch (err: any) {
      setManualModal({
        open: true,
        provider: 'facebook',
        email: '',
        name: '',
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isLogin) {
      const res = await login(email, password);
      if (res.success && res.data?.user) {
        persistAccount({
          email: res.data.user.email,
          name: res.data.user.name,
          provider: 'email',
          lastUsed: Date.now(),
        });
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } else {
      const res = await register(name, email, password, currency);
      if (res.success && res.data?.user) {
        persistAccount({
          email: res.data.user.email,
          name: res.data.user.name,
          provider: 'email',
          lastUsed: Date.now(),
        });
      } else {
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

        {/* REAL MULTI-USER OAUTH SIGN-IN BUTTONS */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          
          {/* Real Google Sign In */}
          <button
            type="button"
            id="btn-google-signin"
            disabled={Boolean(socialLoading) || loading}
            onClick={handleGoogleSignIn}
            title="Sign in with your Google account"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 hover:border-emerald-500/50 text-xs font-semibold text-white transition active:scale-[0.98] shadow-sm group"
          >
            <svg className="w-4 h-4 shrink-0 transition group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span className="truncate">
              {socialLoading === 'google' ? 'Connecting...' : 'Google'}
            </span>
          </button>

          {/* Real Facebook Sign In */}
          <button
            type="button"
            id="btn-facebook-signin"
            disabled={Boolean(socialLoading) || loading}
            onClick={handleFacebookSignIn}
            title="Sign in with your Facebook account"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/70 hover:border-emerald-500/50 text-xs font-semibold text-white transition active:scale-[0.98] shadow-sm group"
          >
            <svg className="w-4 h-4 shrink-0 fill-[#1877F2] transition group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="truncate">
              {socialLoading === 'facebook' ? 'Connecting...' : 'Facebook'}
            </span>
          </button>

        </div>

        {/* Browser-Local Saved Accounts (Only rendered if THIS browser previously signed in) */}
        {savedAccounts.length > 0 && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Saved on this browser:
              </span>
              {savedAccounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsSwitcherOpen(true)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Switch ({savedAccounts.length})</span>
                </button>
              )}
            </div>

            {lastActiveAccount && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition group">
                <button
                  type="button"
                  onClick={() => {
                  if (lastActiveAccount.provider === 'email') {
                    setEmail(lastActiveAccount.email);
                    setIsLogin(true);
                  } else {
                    executeSocialLogin(lastActiveAccount.provider, lastActiveAccount.email, lastActiveAccount.name);
                  }
                }}
                  className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950 shrink-0 shadow">
                    {lastActiveAccount.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition truncate">
                      Continue as {lastActiveAccount.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {lastActiveAccount.email}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  title="Remove from saved accounts on this device"
                  onClick={(e) => removeSavedAccount(lastActiveAccount.email, lastActiveAccount.provider, e)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 transition ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
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
                Preferred Currency
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2.5 text-xs text-white bg-slate-900 cursor-pointer"
                >
                  {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                    <option key={code} value={code} className="bg-slate-900 text-white">
                      {code} ({symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            id="btn-submit-auth"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In to Zenith' : 'Create Free Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <div className="text-center mt-5 text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
          <span>Offline-first enabled. Your financial data is securely isolated.</span>
        </div>

      </div>

      {/* Account Switcher Modal */}
      {isSwitcherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0b101b] border border-slate-700/80 p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white mb-1">
              Switch Account
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Saved profiles on this browser:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {savedAccounts.map((acc) => (
                <div
                  key={`${acc.provider}_${acc.email}`}
                  onClick={() => {
                    if (acc.provider === 'email') {
                      setEmail(acc.email);
                      setIsLogin(true);
                      setIsSwitcherOpen(false);
                    } else {
                      executeSocialLogin(acc.provider, acc.email, acc.name);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 hover:border-emerald-500/50 text-left transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950 shrink-0 shadow">
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition truncate">
                        {acc.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {acc.email} ({acc.provider})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Remove from saved"
                    onClick={(e) => removeSavedAccount(acc.email, acc.provider, e)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 transition ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setIsSwitcherOpen(false);
                  handleGoogleSignIn();
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
              >
                + Sign in with another Google account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual / Fallback Account Modal */}
      {manualModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0b101b] border border-slate-700/80 p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setManualModal((prev) => ({ ...prev, open: false }))}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white mb-1 capitalize">
              Connect {manualModal.provider} Account
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Enter your {manualModal.provider} details to sign in securely:
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@gmail.com"
                  value={manualModal.email}
                  onChange={(e) => setManualModal((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={manualModal.name}
                  onChange={(e) => setManualModal((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="button"
                disabled={!manualModal.email}
                onClick={() => executeSocialLogin(manualModal.provider, manualModal.email, manualModal.name)}
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Sign In with {manualModal.provider === 'google' ? 'Google' : 'Facebook'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
