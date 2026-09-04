import { localDb } from './offlineDb';
import { Transaction, Category, Account, BudgetData, RecurringExpense, Reminder, AiSpendingInsight } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api';

function getAuthHeaders() {
  const token = localStorage.getItem('zenith_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'د.إ',
  SAR: '﷼',
};

export const EXCHANGE_RATES_TO_BDT: Record<string, number> = {
  BDT: 1,
  USD: 122.5,
  EUR: 133.0,
  GBP: 156.2,
  INR: 1.42,
  AED: 33.3,
  SAR: 32.6,
};

export function convertAmount(amountInBdt: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES_TO_BDT[targetCurrency] || 1;
  return Number((amountInBdt / rate).toFixed(2));
}

export function formatCurrency(amount: number, currency: string = 'BDT'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export async function isServerOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getTransactions(params?: { categoryId?: string; type?: string; search?: string }) {
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/transactions?${query}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        await localDb.transactions.bulkPut(data.data);
      }
      return data;
    } catch {
      let collection = localDb.transactions.toCollection();
      if (params?.type) {
        collection = localDb.transactions.where('type').equals(params.type);
      }
      const cached = await collection.reverse().sortBy('date');
      return { success: true, data: cached, total: cached.length, offline: true };
    }
  },

  async createTransaction(payload: Partial<Transaction>) {
    const isOnline = await isServerOnline();
    if (isOnline) {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        await localDb.transactions.put({ ...result.data, synced: true });
      }
      return result;
    } else {
      const tempId = 'offline_' + Date.now();
      const localTx: Transaction = {
        id: tempId,
        type: payload.type || 'EXPENSE',
        amount: Number(payload.amount),
        currency: payload.currency || 'BDT',
        description: payload.description || '',
        categoryId: payload.categoryId || '',
        accountId: payload.accountId || '',
        date: payload.date || new Date().toISOString(),
        notes: payload.notes,
        synced: false,
      };
      await localDb.transactions.add(localTx);
      await localDb.syncQueue.add({
        action: 'CREATE',
        entity: 'TRANSACTION',
        payload,
        timestamp: Date.now(),
      });
      return { success: true, data: localTx, offline: true };
    }
  },

  async deleteTransaction(id: string) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await localDb.transactions.delete(id);
      return res.json();
    } catch {
      await localDb.transactions.delete(id);
      return { success: true, offline: true };
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        await localDb.categories.bulkPut(data.data);
        return data.data;
      }
      return [];
    } catch {
      return localDb.categories.toArray();
    }
  },

  async getAccounts(): Promise<Account[]> {
    try {
      const res = await fetch(`${API_BASE}/accounts`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        await localDb.accounts.bulkPut(data.data);
        return data.data;
      }
      return [];
    } catch {
      return localDb.accounts.toArray();
    }
  },

  async getBudgets(month?: number, year?: number): Promise<BudgetData | null> {
    try {
      const res = await fetch(`${API_BASE}/budgets?month=${month || ''}&year=${year || ''}`, { headers: getAuthHeaders() });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async setBudget(data: { month: number; year: number; totalLimit: number; notes?: string }) {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getRecurring(): Promise<RecurringExpense[]> {
    try {
      const res = await fetch(`${API_BASE}/recurring`, { headers: getAuthHeaders() });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async logRecurring(id: string) {
    const res = await fetch(`${API_BASE}/recurring/${id}/log`, { 
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getReminders(): Promise<Reminder[]> {
    try {
      const res = await fetch(`${API_BASE}/reminders`, { headers: getAuthHeaders() });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async toggleReminder(id: string) {
    const res = await fetch(`${API_BASE}/reminders/${id}/toggle`, { 
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async uploadStatementPreview(file: File) {
    const token = localStorage.getItem('zenith_token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/import/preview`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return res.json();
  },

  async commitStatementImport(transactions: any[], accountId: string) {
    const res = await fetch(`${API_BASE}/import/commit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ transactions, accountId }),
    });
    return res.json();
  },

  async getAiAnalysis(): Promise<AiSpendingInsight | null> {
    try {
      const res = await fetch(`${API_BASE}/ai/analysis`, { headers: getAuthHeaders() });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async flushOfflineQueue() {
    const queue = await localDb.syncQueue.toArray();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        if (item.action === 'CREATE' && item.entity === 'TRANSACTION') {
          await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(item.payload),
          });
        }
        if (item.id) await localDb.syncQueue.delete(item.id);
      } catch (err) {
        console.error('Failed to sync item:', err);
      }
    }
  }
};
