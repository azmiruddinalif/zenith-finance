import { PrismaClient, TransactionType, AccountType, Frequency } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Multi-User Zenith Finance Database...');

  // 1. Create Demo User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@zenith.finance' },
    update: { password: hashedPassword },
    create: {
      email: 'demo@zenith.finance',
      password: hashedPassword,
      name: 'Ashikur Rahman (Demo)',
      defaultCurrency: 'BDT',
      monthlyBudget: 65000,
    },
  });

  const userId = demoUser.id;

  // 2. Create Accounts for Demo User
  const accountsData = [
    { name: 'City Bank (Main)', type: AccountType.BANK, balance: 85400, currency: 'BDT', color: '#0284C7', accountNumber: '1102938491' },
    { name: 'bKash Wallet', type: AccountType.MOBILE_WALLET, balance: 14250, currency: 'BDT', color: '#E11D48', accountNumber: '01711223344' },
    { name: 'Physical Cash', type: AccountType.CASH, balance: 6500, currency: 'BDT', color: '#10B981' },
    { name: 'Standard Chartered Card', type: AccountType.CREDIT_CARD, balance: -12800, currency: 'BDT', color: '#8B5CF6', accountNumber: '4021-XXXX-9912' },
  ];

  const accounts: Record<string, any> = {};
  for (const acc of accountsData) {
    accounts[acc.name] = await prisma.account.create({
      data: { ...acc, userId },
    });
  }

  // 3. Create Categories for Demo User
  const categoriesData = [
    { name: 'Salary & Earnings', type: TransactionType.INCOME, icon: 'badge-dollar-sign', color: '#10B981', budgetLimit: 0 },
    { name: 'Freelance / Consulting', type: TransactionType.INCOME, icon: 'laptop', color: '#06B6D4', budgetLimit: 0 },
    { name: 'Investments & Dividends', type: TransactionType.INCOME, icon: 'trending-up', color: '#3B82F6', budgetLimit: 0 },
    { name: 'Housing & Rent', type: TransactionType.EXPENSE, icon: 'home', color: '#F59E0B', budgetLimit: 22000 },
    { name: 'Groceries & Bazar', type: TransactionType.EXPENSE, icon: 'shopping-cart', color: '#10B981', budgetLimit: 15000 },
    { name: 'Dining & Restaurants', type: TransactionType.EXPENSE, icon: 'utensils', color: '#EC4899', budgetLimit: 8000 },
    { name: 'Utilities & Internet', type: TransactionType.EXPENSE, icon: 'zap', color: '#EAB308', budgetLimit: 5000 },
    { name: 'Transport & Fuel', type: TransactionType.EXPENSE, icon: 'car', color: '#6366F1', budgetLimit: 6000 },
    { name: 'Shopping & Apparel', type: TransactionType.EXPENSE, icon: 'shopping-bag', color: '#A855F7', budgetLimit: 7000 },
    { name: 'Healthcare & Pharma', type: TransactionType.EXPENSE, icon: 'heart-pulse', color: '#EF4444', budgetLimit: 4000 },
    { name: 'Entertainment & Subs', type: TransactionType.EXPENSE, icon: 'tv', color: '#8B5CF6', budgetLimit: 3000 },
    { name: 'Gifts & Charity', type: TransactionType.EXPENSE, icon: 'gift', color: '#14B8A6', budgetLimit: 3000 },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.name] = await prisma.category.create({
      data: { ...cat, userId },
    });
  }

  // 4. Initial Transactions
  const now = new Date();
  const sampleTransactions = [
    { desc: 'Monthly Salary (Software Engineer)', amount: 95000, type: TransactionType.INCOME, cat: 'Salary & Earnings', acc: 'City Bank (Main)', daysAgo: 28 },
    { desc: 'Upwork Web Dev Payout', amount: 35000, type: TransactionType.INCOME, cat: 'Freelance / Consulting', acc: 'City Bank (Main)', daysAgo: 14 },
    { desc: 'Apartment Monthly Rent', amount: 20000, type: TransactionType.EXPENSE, cat: 'Housing & Rent', acc: 'City Bank (Main)', daysAgo: 27 },
    { desc: 'Weekly Shwapno Supermarket Bazar', amount: 4850, type: TransactionType.EXPENSE, cat: 'Groceries & Bazar', acc: 'City Bank (Main)', daysAgo: 25 },
    { desc: 'Electricity Bill (DESCO)', amount: 2450, type: TransactionType.EXPENSE, cat: 'Utilities & Internet', acc: 'bKash Wallet', daysAgo: 24 },
    { desc: 'Fiber Internet (Dot Internet 50Mbps)', amount: 1200, type: TransactionType.EXPENSE, cat: 'Utilities & Internet', acc: 'bKash Wallet', daysAgo: 23 },
    { desc: 'Dinner at Gulshan Lounge', amount: 2800, type: TransactionType.EXPENSE, cat: 'Dining & Restaurants', acc: 'Standard Chartered Card', daysAgo: 20 },
    { desc: 'Pathao Car and CNG rides', amount: 1650, type: TransactionType.EXPENSE, cat: 'Transport & Fuel', acc: 'bKash Wallet', daysAgo: 18 },
    { desc: 'Kacha Bazar Fresh Vegetables and Fish', amount: 3200, type: TransactionType.EXPENSE, cat: 'Groceries & Bazar', acc: 'Physical Cash', daysAgo: 17 },
    { desc: 'Uniqlo Oxford Shirt and Chinos', amount: 4200, type: TransactionType.EXPENSE, cat: 'Shopping & Apparel', acc: 'Standard Chartered Card', daysAgo: 15 },
    { desc: 'Netflix 4K UHD Subscription', amount: 1100, type: TransactionType.EXPENSE, cat: 'Entertainment & Subs', acc: 'Standard Chartered Card', daysAgo: 12 },
    { desc: 'Spotify Premium Family', amount: 450, type: TransactionType.EXPENSE, cat: 'Entertainment & Subs', acc: 'Standard Chartered Card', daysAgo: 11 },
    { desc: 'Prescription Refill and Vitamins (Lazz Pharma)', amount: 1850, type: TransactionType.EXPENSE, cat: 'Healthcare & Pharma', acc: 'bKash Wallet', daysAgo: 9 },
    { desc: 'Coffee and Snacks at Cafe', amount: 1350, type: TransactionType.EXPENSE, cat: 'Dining & Restaurants', acc: 'Standard Chartered Card', daysAgo: 7 },
    { desc: 'Fuel / Octane Tank Refill', amount: 3500, type: TransactionType.EXPENSE, cat: 'Transport & Fuel', acc: 'City Bank (Main)', daysAgo: 5 },
    { desc: 'Weekly Grocery Refill', amount: 4100, type: TransactionType.EXPENSE, cat: 'Groceries & Bazar', acc: 'City Bank (Main)', daysAgo: 3 },
    { desc: 'Quick Lunch and Chai', amount: 380, type: TransactionType.EXPENSE, cat: 'Dining & Restaurants', acc: 'Physical Cash', daysAgo: 1 },
    { desc: 'Donation to Orphanage Food Drive', amount: 2000, type: TransactionType.EXPENSE, cat: 'Gifts & Charity', acc: 'bKash Wallet', daysAgo: 2 },
  ];

  for (const t of sampleTransactions) {
    const txDate = new Date();
    txDate.setDate(now.getDate() - t.daysAgo);
    await prisma.transaction.create({
      data: {
        userId,
        description: t.desc,
        amount: t.amount,
        type: t.type,
        currency: 'BDT',
        date: txDate,
        categoryId: categories[t.cat].id,
        accountId: accounts[t.acc].id,
      },
    });
  }

  // 5. Recurring Expenses
  await prisma.recurringExpense.create({
    data: {
      userId,
      title: 'Home Apartment Rent',
      amount: 20000,
      frequency: Frequency.MONTHLY,
      nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      categoryId: categories['Housing & Rent'].id,
      accountId: accounts['City Bank (Main)'].id,
    },
  });

  // 6. Reminders
  await prisma.reminder.create({
    data: {
      userId,
      title: 'Credit Card Minimum Due Statement',
      amount: 12800,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 25),
      isPaid: false,
      category: 'Bills',
    },
  });

  // 7. Monthly Budget
  await prisma.budget.create({
    data: {
      userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      totalLimit: 65000,
      notes: 'Demo user monthly budget target',
    },
  });

  console.log('✅ Demo user seeded: demo@zenith.finance / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
