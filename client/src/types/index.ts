export type TransactionType = 'EXPENSE' | 'INCOME';
export type AccountType = 'CASH' | 'BANK' | 'MOBILE_WALLET' | 'CREDIT_CARD' | 'SAVINGS';
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  budgetLimit: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  accountNumber?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  date: string;
  categoryId: string;
  accountId: string;
  category?: Category;
  account?: Account;
  notes?: string;
  tags?: string;
  isRecurring?: boolean;
  synced?: boolean; // Offline-first status
}

export interface BudgetData {
  month: number;
  year: number;
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  categoryBudgets: (Category & {
    spent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
  })[];
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  frequency: Frequency;
  nextDueDate: string;
  categoryId: string;
  accountId: string;
  category?: Category;
  account?: Account;
  autoLog?: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  amount?: number;
  dueDate: string;
  isPaid: boolean;
  category?: string;
}

export interface AiSpendingInsight {
  healthScore: number;
  summaryEn: string;
  summaryBn: string;
  anomalies: string[];
  anomaliesBn: string[];
  recommendations: {
    titleEn: string;
    titleBn: string;
    detailEn: string;
    detailBn: string;
    potentialSavings: number;
  }[];
  topCategory: {
    name: string;
    amount: number;
  };
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  spendingVelocityPerDay: number;
}
