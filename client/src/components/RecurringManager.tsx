import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Repeat, Calendar, Check, Bell } from 'lucide-react';
import { api } from '../services/api';

export const RecurringManager: React.FC = () => {
  const { recurring, reminders, formatMoney, refreshData, showNotification } = useFinance();

  const handleLogRecurring = async (id: string) => {
    try {
      const res = await api.logRecurring(id);
      if (res.success) {
        showNotification(res.message);
        await refreshData();
      }
    } catch {
      showNotification('Error logging recurring expense');
    }
  };

  const handleToggleReminder = async (id: string) => {
    try {
      await api.toggleReminder(id);
      await refreshData();
    } catch {
      showNotification('Error updating reminder');
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <h2 className="text-lg font-bold text-white">Recurring Expenses & Bill Reminders</h2>
        <p className="text-xs text-slate-400">Manage ongoing subscriptions, utility bills, and payment deadlines</p>
      </div>

      {/* Subscriptions Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Repeat className="w-4 h-4 text-emerald-400" />
          <span>Active Subscriptions & Recurring Dues</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map((rec) => (
            <div key={rec.id} className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {rec.frequency}
                </span>
              </div>
              <div className="text-lg font-bold text-white">
                {formatMoney(rec.amount)}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-[11px] text-slate-400">
                  Due: {new Date(rec.nextDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <button
                  onClick={() => handleLogRecurring(rec.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
                >
                  Log Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span>Payment Reminders</span>
        </h3>

        <div className="glass-panel rounded-2xl border border-slate-800 divide-y divide-slate-800/80">
          {reminders.map((rem) => (
            <div key={rem.id} className="p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  checked={rem.isPaid}
                  onChange={() => handleToggleReminder(rem.id)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                />
                <div>
                  <h5 className={`font-semibold ${rem.isPaid ? 'line-through text-slate-500' : 'text-white'}`}>
                    {rem.title}
                  </h5>
                  <span className="text-[10px] text-slate-400">
                    Due: {new Date(rem.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {rem.amount && (
                <span className={`font-bold ${rem.isPaid ? 'text-slate-500' : 'text-slate-200'}`}>
                  {formatMoney(rem.amount)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
