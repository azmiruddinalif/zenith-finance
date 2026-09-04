import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, isServerOnline, formatCurrency, convertAmount } from '../services/api';
import { Transaction, Category, Account, BudgetData, RecurringExpense, Reminder, AiSpendingInsight } from '../types';

interface FinanceContextType {
  isOnline: boolean;
  currency: string;
  setCurrency: (c: string) => void;
  formatMoney: (valInBdt: number) => string;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budget: BudgetData | null;
  recurring: RecurringExpense[];
  reminders: Reminder[];
  aiInsight: AiSpendingInsight | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  refreshData: () => Promise<void>;
  addTransaction: (tx: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  notification: string | null;
  showNotification: (msg: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [currency, setCurrency] = useState<string>('BDT');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [aiInsight, setAiInsight] = useState<AiSpendingInsight | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const formatMoney = (valInBdt: number) => {
    const converted = convertAmount(valInBdt, currency);
    return formatCurrency(converted, currency);
  };

  const checkConnectivity = async () => {
    const online = await isServerOnline();
    setIsOnline(online);
    if (online) {
      await api.flushOfflineQueue();
    }
  };

  const refreshData = async () => {
    await checkConnectivity();
    const [txRes, cats, accs, bud, rec, rem, ai] = await Promise.all([
      api.getTransactions(),
      api.getCategories(),
      api.getAccounts(),
      api.getBudgets(),
      api.getRecurring(),
      api.getReminders(),
      api.getAiAnalysis(),
    ]);

    if (txRes?.data) setTransactions(txRes.data);
    if (cats) setCategories(cats);
    if (accs) setAccounts(accs);
    if (bud) setBudget(bud);
    if (rec) setRecurring(rec);
    if (rem) setReminders(rem);
    if (ai) setAiInsight(ai);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(checkConnectivity, 15000);
    window.addEventListener('online', refreshData);
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', refreshData);
    };
  }, []);

  const addTransaction = async (tx: Partial<Transaction>): Promise<boolean> => {
    try {
      const res = await api.createTransaction(tx);
      if (res.success) {
        showNotification(res.offline ? 'Saved offline! Will sync automatically.' : 'Transaction recorded!');
        await refreshData();
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification('Error recording transaction');
      return false;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      await api.deleteTransaction(id);
      showNotification('Transaction deleted');
      await refreshData();
      return true;
    } catch {
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        isOnline,
        currency,
        setCurrency,
        formatMoney,
        transactions,
        categories,
        accounts,
        budget,
        recurring,
        reminders,
        aiInsight,
        activeTab,
        setActiveTab,
        isQuickAddOpen,
        setIsQuickAddOpen,
        isAiModalOpen,
        setIsAiModalOpen,
        isImportModalOpen,
        setIsImportModalOpen,
        refreshData,
        addTransaction,
        deleteTransaction,
        notification,
        showNotification,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
