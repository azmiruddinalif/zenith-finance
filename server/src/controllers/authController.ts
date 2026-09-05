import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';


const JWT_SECRET = process.env.JWT_SECRET || 'zenith_ultra_secure_jwt_secret_key_2026_production';

// Helper: Auto-provision starter financial environment for new users
export async function provisionStarterKit(userId: string, currency: string = 'BDT') {
  // 1. Starter Accounts
  const starterAccounts = [
    { name: 'Primary Bank Account', type: 'BANK' as any, balance: 0, currency, color: '#0284C7' },
    { name: 'Cash on Hand', type: 'CASH' as any, balance: 0, currency, color: '#10B981' },
    { name: 'Mobile Wallet / Digital', type: 'MOBILE_WALLET' as any, balance: 0, currency, color: '#E11D48' },
  ];

  for (const acc of starterAccounts) {
    await prisma.account.create({
      data: { ...acc, userId },
    });
  }

  // 2. Starter Categories
  const starterCategories = [
    { name: 'Salary & Earnings', type: 'INCOME' as any, icon: 'badge-dollar-sign', color: '#10B981', budgetLimit: 0 },
    { name: 'Freelance & Side Income', type: 'INCOME' as any, icon: 'laptop', color: '#06B6D4', budgetLimit: 0 },
    { name: 'Housing & Rent', type: 'EXPENSE' as any, icon: 'home', color: '#F59E0B', budgetLimit: 20000 },
    { name: 'Groceries & Food', type: 'EXPENSE' as any, icon: 'shopping-cart', color: '#10B981', budgetLimit: 15000 },
    { name: 'Dining & Restaurants', type: 'EXPENSE' as any, icon: 'utensils', color: '#EC4899', budgetLimit: 8000 },
    { name: 'Utilities & Bills', type: 'EXPENSE' as any, icon: 'zap', color: '#EAB308', budgetLimit: 5000 },
    { name: 'Transport & Fuel', type: 'EXPENSE' as any, icon: 'car', color: '#6366F1', budgetLimit: 6000 },
    { name: 'Shopping & Apparel', type: 'EXPENSE' as any, icon: 'shopping-bag', color: '#A855F7', budgetLimit: 6000 },
    { name: 'Healthcare & Medical', type: 'EXPENSE' as any, icon: 'heart-pulse', color: '#EF4444', budgetLimit: 4000 },
    { name: 'Entertainment & Subscriptions', type: 'EXPENSE' as any, icon: 'tv', color: '#8B5CF6', budgetLimit: 3000 },
  ];

  for (const cat of starterCategories) {
    await prisma.category.create({
      data: { ...cat, userId },
    });
  }

  // 3. Initial Budget
  const now = new Date();
  await prisma.budget.create({
    data: {
      userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      totalLimit: 50000,
      notes: 'Initial monthly budget target',
    },
  });
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, defaultCurrency = 'BDT' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        defaultCurrency,
        monthlyBudget: 50000,
      },
    });

    // Auto-provision initial categories and accounts
    await provisionStarterKit(user.id, defaultCurrency);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          defaultCurrency: user.defaultCurrency,
          monthlyBudget: user.monthlyBudget,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          defaultCurrency: user.defaultCurrency,
          monthlyBudget: user.monthlyBudget,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, defaultCurrency: true, monthlyBudget: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const socialLogin = async (req: Request, res: Response) => {
  try {
    const { provider = 'google', email, name, defaultCurrency = 'BDT' } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required for social sign in' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Create new user record for social auth
      const randomSecret = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const hashedPassword = await bcrypt.hash(`oauth_${provider}_${randomSecret}`, 10);
      
      const displayName = name && name.trim().length > 0 
        ? name.trim() 
        : (provider === 'google' ? normalizedEmail.split('@')[0] : 'Facebook User');

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: displayName,
          defaultCurrency,
          monthlyBudget: 50000,
        },
      });

      // Auto-provision initial categories and accounts
      await provisionStarterKit(user.id, defaultCurrency);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: `Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)} successfully`,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          defaultCurrency: user.defaultCurrency,
          monthlyBudget: user.monthlyBudget,
        },
      },
    });
  } catch (error: any) {
    console.error('Social login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Social sign-in failed' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, defaultCurrency, monthlyBudget } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(defaultCurrency && { defaultCurrency }),
        ...(monthlyBudget !== undefined && { monthlyBudget: Number(monthlyBudget) }),
      },
      select: { id: true, name: true, email: true, defaultCurrency: true, monthlyBudget: true, createdAt: true },
    });
    res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
