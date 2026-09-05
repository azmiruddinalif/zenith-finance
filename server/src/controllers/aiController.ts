import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

export const getAiSpendingAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [currentMonthTxs, prevMonthTxs, categories, budget] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, date: { gte: firstDayCurrentMonth } },
        include: { category: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: firstDayPrevMonth, lte: lastDayPrevMonth } },
        include: { category: true },
      }),
      prisma.category.findMany({ where: { userId } }),
      prisma.budget.findFirst({ where: { userId, month: now.getMonth() + 1, year: now.getFullYear() } }),
    ]);

    const totalIncome = currentMonthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpense = currentMonthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const prevExpense = prevMonthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

    const categoryTotals: Record<string, { name: string; amount: number; limit: number }> = {};
    currentMonthTxs.filter(t => t.type === 'EXPENSE').forEach((t) => {
      if (!categoryTotals[t.category.id]) {
        categoryTotals[t.category.id] = {
          name: t.category.name,
          amount: 0,
          limit: t.category.budgetLimit,
        };
      }
      categoryTotals[t.category.id].amount += t.amount;
    });

    const categoryList = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);
    const topCategory = categoryList[0] || { name: 'General', amount: 0 };

    let healthScore = 78;
    const monthlyLimit = budget?.totalLimit || 50000;
    const spendRatio = totalIncome > 0 ? totalExpense / totalIncome : 0.8;

    if (spendRatio < 0.5) healthScore += 18;
    else if (spendRatio < 0.7) healthScore += 10;
    else if (spendRatio > 0.9) healthScore -= 15;

    if (totalExpense > monthlyLimit) healthScore -= 20;
    healthScore = Math.max(20, Math.min(98, healthScore));

    const anomalies: string[] = [];
    const anomaliesBn: string[] = [];

    categoryList.forEach((c) => {
      if (c.limit > 0 && c.amount > c.limit) {
        const over = c.amount - c.limit;
        anomalies.push(`Over budget in ${c.name}: exceeded limit by ৳${over.toLocaleString()}.`);
        anomaliesBn.push(`Exceeded budget limit in ${c.name} by ৳${over.toLocaleString()}.`);
      }
    });

    if (totalExpense > prevExpense * 1.25 && prevExpense > 0) {
      anomalies.push(`Total spend increased by ${Math.round(((totalExpense - prevExpense) / prevExpense) * 100)}% compared to last month.`);
      anomaliesBn.push(`Total expense increased by ${Math.round(((totalExpense - prevExpense) / prevExpense) * 100)}% compared to last month.`);
    }

    if (anomalies.length === 0) {
      anomalies.push('Spending is well-disciplined within healthy safety margins.');
      anomaliesBn.push('Spending is well-disciplined within healthy safety margins.');
    }

    const recommendations = [
      {
        titleEn: `Optimize ${topCategory.name}`,
        titleBn: `Optimize ${topCategory.name}`,
        detailEn: `${topCategory.name} is your highest expense category at ৳${topCategory.amount.toLocaleString()}.`,
        detailBn: `${topCategory.name} is your highest expense category at ৳${topCategory.amount.toLocaleString()}.`,
        potentialSavings: Math.round(topCategory.amount * 0.15),
      },
      {
        titleEn: 'Automate Emergency Fund Transfer',
        titleBn: 'Automate Emergency Fund Transfer',
        detailEn: `Aim to set aside ৳${Math.round(totalIncome * 0.2).toLocaleString()} into a high-yield emergency reserve.`,
        detailBn: `Aim to set aside ৳${Math.round(totalIncome * 0.2).toLocaleString()} into a high-yield emergency reserve.`,
        potentialSavings: Math.round(totalIncome * 0.2),
      },
    ];

    const summaryEn = `Health Score is ${healthScore}/100. Total income ৳${totalIncome.toLocaleString()} vs expenses ৳${totalExpense.toLocaleString()}.`;
    const summaryBn = `Financial health score is ${healthScore}/100. Total income ৳${totalIncome.toLocaleString()} vs expenses ৳${totalExpense.toLocaleString()}.`;

    res.json({
      success: true,
      data: {
        healthScore,
        summaryEn,
        summaryBn,
        anomalies,
        anomaliesBn,
        recommendations,
        topCategory,
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        spendingVelocityPerDay: Math.round(totalExpense / Math.max(1, now.getDate())),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
