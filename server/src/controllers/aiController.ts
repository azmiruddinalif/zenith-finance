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
        anomaliesBn.push(`${c.name}-এ বাজেটের চেয়ে ৳${over.toLocaleString()} বেশি খরচ হয়েছে।`);
      }
    });

    if (totalExpense > prevExpense * 1.25 && prevExpense > 0) {
      anomalies.push(`Total spend increased by ${Math.round(((totalExpense - prevExpense) / prevExpense) * 100)}% compared to last month.`);
      anomaliesBn.push(`গত মাসের তুলনায় মোট খরচ প্রায় ${Math.round(((totalExpense - prevExpense) / prevExpense) * 100)}% বৃদ্ধি পেয়েছে।`);
    }

    if (anomalies.length === 0) {
      anomalies.push('Spending is well-disciplined within healthy safety margins.');
      anomaliesBn.push('আপনার ব্যয় নিয়ন্ত্রণে রয়েছে এবং চমৎকারভাবে বাজেট অনুসরণ করছেন।');
    }

    const recommendations = [
      {
        titleEn: `Optimize ${topCategory.name}`,
        titleBn: `${topCategory.name} খাতে খরচ কমানো`,
        detailEn: `${topCategory.name} is your highest expense category at ৳${topCategory.amount.toLocaleString()}.`,
        detailBn: `এই মাসে ${topCategory.name} খাতে সর্বোচ্চ ৳${topCategory.amount.toLocaleString()} খরচ হয়েছে।`,
        potentialSavings: Math.round(topCategory.amount * 0.15),
      },
      {
        titleEn: 'Automate Emergency Fund Transfer',
        titleBn: 'জরুরি তহবিলে স্বয়ংক্রিয় সঞ্চয়',
        detailEn: `Aim to set aside ৳${Math.round(totalIncome * 0.2).toLocaleString()} into a high-yield emergency reserve.`,
        detailBn: `আপনার মাসিক আয়ের প্রায় ২০% (৳${Math.round(totalIncome * 0.2).toLocaleString()}) সঞ্চয় তহবিলে স্থানান্তর করতে পারেন।`,
        potentialSavings: Math.round(totalIncome * 0.2),
      },
    ];

    const summaryEn = `Health Score is ${healthScore}/100. Total income ৳${totalIncome.toLocaleString()} vs expenses ৳${totalExpense.toLocaleString()}.`;
    const summaryBn = `আপনার আর্থিক স্বাস্থ্য স্কোর ${healthScore}/100। মোট আয় ৳${totalIncome.toLocaleString()} এবং ব্যয় ৳${totalExpense.toLocaleString()}।`;

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
