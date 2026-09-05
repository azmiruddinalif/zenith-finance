import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { 
  User, Mail, Shield, CheckCircle2, Copy, Check, 
  Calendar, Globe, DollarSign, X, LogOut, RefreshCw, 
  Sparkles, Wallet, Receipt, Edit2, Save 
} from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../services/api';

export const UserProfileModal: React.FC = () => {
  const { user, isProfileModalOpen, setIsProfileModalOpen, logout, updateUserProfile } = useAuth();
  const { currency = "BDT", setCurrency = () => {}, accounts = [], transactions = [], budget = null } = useFinance();

  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editBudget, setEditBudget] = useState<number>(50000);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isProfileModalOpen || !user) return null;

  const handleStartEdit = () => {
    setEditName(user.name);
    setEditBudget(user.monthlyBudget || 50000);
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const res = await updateUserProfile({
      name: editName.trim(),
      monthlyBudget: Number(editBudget),
      defaultCurrency: currency,
    });
    setIsSaving(false);
    if (res.success) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleCopyId = () => {
    if (user.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Determine provider by email or characteristics
  const isGoogle = user.email.toLowerCase().includes('gmail') || user.name === 'Alif Azmiruddin';
  const isFacebook = user.email.toLowerCase().includes('facebook') || user.name.includes('Facebook');
  const providerLabel = isGoogle ? 'Google Account' : isFacebook ? 'Facebook Account' : 'Zenith Cloud Identity';

  const memberDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Active Member (2026)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg glass-panel-elevated rounded-3xl p-6 sm:p-7 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        
        {/* Top Glow Background */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute right-5 top-5 p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: User Avatar & Verified Badge */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center text-2xl font-black text-slate-950 shadow-xl ring-2 ring-emerald-400/30">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow" title="Active & Verified">
              <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
            </div>
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-sm font-bold text-white"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white truncate tracking-tight">
                  {user.name}
                </h2>
                <button
                  onClick={handleStartEdit}
                  className="text-slate-400 hover:text-emerald-400 p-1 transition"
                  title="Edit Profile Name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium truncate">{user.email}</span>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>{providerLabel}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PostgreSQL Synced
              </span>
            </div>
          </div>
        </div>

        {/* Save feedback */}
        {saveSuccess && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Profile information updated and synced!</span>
          </div>
        )}

        {/* Workspace Quick Stats Pill Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-semibold uppercase mb-0.5">
              <Wallet className="w-3 h-3 text-emerald-400" />
              <span>Accounts</span>
            </div>
            <p className="text-sm font-extrabold text-white">{accounts.length}</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-semibold uppercase mb-0.5">
              <Receipt className="w-3 h-3 text-cyan-400" />
              <span>Transactions</span>
            </div>
            <p className="text-sm font-extrabold text-white">{transactions.length}</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-semibold uppercase mb-0.5">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span>Currency</span>
            </div>
            <p className="text-sm font-extrabold text-emerald-400">{currency}</p>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 mb-5">
          
          {/* User ID */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">User Identifier:</span>
            <div className="flex items-center gap-1.5">
              <code className="text-[11px] text-slate-300 font-mono bg-slate-800/80 px-2 py-0.5 rounded-lg">
                {user.id ? `${user.id.slice(0, 8)}...${user.id.slice(-6)}` : 'Cloud Auth'}
              </code>
              <button
                onClick={handleCopyId}
                className="text-slate-400 hover:text-emerald-400 p-1 transition"
                title="Copy User ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Member Since:</span>
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {memberDate}
            </span>
          </div>

          {/* Primary Currency Preference */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Display Currency:</span>
            </span>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                updateUserProfile({ defaultCurrency: e.target.value });
              }}
              className="bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_SYMBOLS[c]} {c}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Budget Target */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              <span>Monthly Budget Target:</span>
            </span>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(Number(e.target.value))}
                  className="w-24 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-2 py-1 border border-slate-700"
                />
              </div>
            ) : (
              <span className="text-slate-200 font-bold">
                {CURRENCY_SYMBOLS[currency] || ''} {(user.monthlyBudget || 50000).toLocaleString()}
              </span>
            )}
          </div>

        </div>

        {/* Edit Save Button if editing */}
        {isEditing && (
          <div className="mb-4">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        )}

        {/* Bottom Actions: Switch Account / Sign Out */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              logout();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Switch Account</span>
          </button>

          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              logout();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 hover:text-rose-200 border border-rose-800/50 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
