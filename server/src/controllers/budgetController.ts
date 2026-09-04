import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

export const getBudgets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const [budget, categories, transactions] = await Promise.all([
      prisma.budget.findFirst({ where: { userId, month, year } }),
      prisma.category.findMany({ where: { userId, type: 'EXPENSE' } }),
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'EXPENSE',
          date: { gte: firstDay, lte: lastDay },
        },
      }),
    ]);

    const categorySpending: Record<string, number> = {};
    let totalSpent = 0;
    transactions.forEach((tx) => {
      categorySpending[tx.categoryId] = (categorySpending[tx.categoryId] || 0) + tx.amount;
      totalSpent += tx.amount;
    });

    const categoryBudgets = categories.map((cat) => {
      const spent = categorySpending[cat.id] || 0;
      const limit = cat.budgetLimit || 0;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      return {
        ...cat,
        spent,
        remaining: Math.max(0, limit - spent),
        percentage: Math.min(100, Number(percentage.toFixed(1))),
        isOverBudget: limit > 0 && spent > limit,
      };
    });

    res.json({
      success: true,
      data: {
        month,
        year,
        totalLimit: budget?.totalLimit || 50000,
        totalSpent,
        totalRemaining: Math.max(0, (budget?.totalLimit || 50000) - totalSpent),
        categoryBudgets,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setBudget = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { month, year, totalLimit, notes } = req.body;
    const budget = await prisma.budget.upsert({
      where: { userId_month_year: { userId, month: Number(month), year: Number(year) } },
      update: { totalLimit: parseFloat(totalLimit), notes },
      create: { userId, month: Number(month), year: Number(year), totalLimit: parseFloat(totalLimit), notes },
    });
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
