import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { categoryId, accountId, type, startDate, endDate, search, limit = 50, offset = 0 } = req.query;

    const where: any = { userId };
    if (categoryId) where.categoryId = String(categoryId);
    if (accountId) where.accountId = String(accountId);
    if (type) where.type = String(type);
    if (search) {
      where.OR = [
        { description: { contains: String(search), mode: 'insensitive' } },
        { notes: { contains: String(search), mode: 'insensitive' } },
        { tags: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(String(startDate));
      if (endDate) where.date.lte = new Date(String(endDate));
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true, account: true },
        orderBy: { date: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ success: true, data: transactions, total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type, amount, currency = 'BDT', description, categoryId, accountId, date, notes, tags, isRecurring } = req.body;

    if (!amount || !description || !categoryId || !accountId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId,
          type,
          amount: parseFloat(amount),
          currency,
          description,
          categoryId,
          accountId,
          date: date ? new Date(date) : new Date(),
          notes,
          tags,
          isRecurring: Boolean(isRecurring),
        },
        include: { category: true, account: true },
      });

      const balanceDelta = type === 'INCOME' ? parseFloat(amount) : -parseFloat(amount);
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: balanceDelta } },
      });

      return created;
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const tx = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    await prisma.$transaction(async (prismaTx) => {
      const balanceDelta = tx.type === 'INCOME' ? -tx.amount : tx.amount;
      await prismaTx.account.update({
        where: { id: tx.accountId },
        data: { balance: { increment: balanceDelta } },
      });
      await prismaTx.transaction.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [accounts, monthTransactions, allTransactions] = await Promise.all([
      prisma.account.findMany({ where: { userId } }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
        include: { category: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        take: 10,
        orderBy: { date: 'desc' },
        include: { category: true, account: true },
      }),
    ]);

    const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
    const monthlyIncome = monthTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0);
    const monthlyExpense = monthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amount, 0);
    const netSavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? ((netSavings / monthlyIncome) * 100).toFixed(1) : 0;

    const categoryBreakdown: Record<string, { name: string; color: string; icon: string; amount: number }> = {};
    monthTransactions.filter(t => t.type === 'EXPENSE').forEach((t) => {
      if (!categoryBreakdown[t.category.id]) {
        categoryBreakdown[t.category.id] = {
          name: t.category.name,
          color: t.category.color,
          icon: t.category.icon,
          amount: 0,
        };
      }
      categoryBreakdown[t.category.id].amount += t.amount;
    });

    res.json({
      success: true,
      data: {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        netSavings,
        savingsRate: Number(savingsRate),
        accounts,
        recentTransactions: allTransactions,
        categoryBreakdown: Object.values(categoryBreakdown),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
