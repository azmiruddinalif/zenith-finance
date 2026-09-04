import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, type = 'EXPENSE', icon = 'wallet', color = '#10B981', budgetLimit = 0 } = req.body;
    const category = await prisma.category.create({
      data: { userId, name, type, icon, color, budgetLimit: parseFloat(budgetLimit) || 0 },
    });
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
