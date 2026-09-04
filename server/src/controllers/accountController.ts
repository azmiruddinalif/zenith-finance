import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

export const getAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, type = 'BANK', balance = 0, currency = 'BDT', color = '#10B981', accountNumber } = req.body;
    const account = await prisma.account.create({
      data: {
        userId,
        name,
        type,
        balance: parseFloat(balance) || 0,
        currency,
        color,
        accountNumber,
      },
    });
    res.status(201).json({ success: true, data: account });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
