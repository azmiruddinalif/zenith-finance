import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

export const getRecurring = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const items = await prisma.recurringExpense.findMany({
      where: { userId },
      include: { category: true, account: true },
      orderBy: { nextDueDate: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRecurring = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, amount, frequency = 'MONTHLY', nextDueDate, categoryId, accountId, autoLog = false } = req.body;
    const item = await prisma.recurringExpense.create({
      data: {
        userId,
        title,
        amount: parseFloat(amount),
        frequency,
        nextDueDate: new Date(nextDueDate),
        categoryId,
        accountId,
        autoLog: Boolean(autoLog),
      },
      include: { category: true, account: true },
    });
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markRecurringAsLogged = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const recurring = await prisma.recurringExpense.findFirst({
      where: { id, userId },
      include: { category: true, account: true },
    });
    if (!recurring) return res.status(404).json({ success: false, message: 'Recurring item not found' });

    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          userId,
          description: `[Recurring] ${recurring.title}`,
          amount: recurring.amount,
          type: 'EXPENSE',
          categoryId: recurring.categoryId,
          accountId: recurring.accountId,
          isRecurring: true,
          date: new Date(),
        },
      });

      await tx.account.update({
        where: { id: recurring.accountId },
        data: { balance: { decrement: recurring.amount } },
      });

      const nextDate = new Date(recurring.nextDueDate);
      if (recurring.frequency === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
      else if (recurring.frequency === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
      else if (recurring.frequency === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (recurring.frequency === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + 1);

      await tx.recurringExpense.update({
        where: { id },
        data: {
          lastLogged: new Date(),
          nextDueDate: nextDate,
        },
      });
    });

    res.json({ success: true, message: 'Expense logged and next due date updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: [{ isPaid: 'asc' }, { dueDate: 'asc' }],
    });
    res.json({ success: true, data: reminders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleReminderPaid = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const current = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!current) return res.status(404).json({ success: false, message: 'Not found' });

    const updated = await prisma.reminder.update({
      where: { id },
      data: { isPaid: !current.isPaid },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
