import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Lightbulb } from 'lucide-react';

export const AiAdvisorModal: React.FC = () => {
  const { isAiModalOpen, setIsAiModalOpen, aiInsight, formatMoney } = useFinance();

  if (!isAiModalOpen || !aiInsight) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl glass-panel-elevated rounded-3xl border border-violet-500/30 p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-400 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Financial Intelligence Engine</h2>
              <p className="text-xs text-violet-300 font-medium">Financial Intelligence & Spending Optimization</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiModalOpen(false)}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6 mt-5">
          
          {/* Health Score Card */}
          <div className="rounded-2xl p-5 bg-gradient-to-r from-violet-950/40 via-purple-900/20 to-slate-900 border border-violet-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                Health Score
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {aiInsight.healthScore} <span className="text-base font-normal text-slate-400">/ 100</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm">
                {aiInsight.summaryEn || aiInsight.summaryBn}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-violet-500/20 text-center shrink-0">
              <span className="text-[11px] text-slate-400 block">Daily Spending Velocity</span>
              <span className="text-lg font-extrabold text-emerald-400">
                ৳{aiInsight.spendingVelocityPerDay.toLocaleString()} / day
              </span>
            </div>
          </div>

          {/* Detected Anomalies / Alerts */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Anomalies & Overspending Signals</span>
            </h4>
            <div className="space-y-2">
              {aiInsight.anomalies.map((anom, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200 flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{anom}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Savings Recommendations */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <span>AI Recommendations & Potential Savings</span>
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              {aiInsight.recommendations.map((rec, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/30 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white">{rec.titleEn}</h5>
                    <span className="text-[11px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      Save ~৳{rec.potentialSavings.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rec.detailEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
