import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';

import { authenticateToken } from './middleware/auth';
import { register, login, getMe, socialLogin, updateProfile } from './controllers/authController';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getDashboardSummary,
} from './controllers/transactionController';
import {
  getCategories,
  createCategory,
} from './controllers/categoryController';
import {
  getAccounts,
  createAccount,
} from './controllers/accountController';
import {
  getBudgets,
  setBudget,
} from './controllers/budgetController';
import {
  getRecurring,
  createRecurring,
  markRecurringAsLogged,
  getReminders,
  toggleReminderPaid,
} from './controllers/recurringController';
import {
  previewStatement,
  commitImportedTransactions,
} from './controllers/importController';
import {
  getAiSpendingAnalysis,
} from './controllers/aiController';
import { checkDbConnection } from './db/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Api-Version');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Health Check
app.get('/api/health', async (_req, res) => {
  const dbOk = await checkDbConnection();
  res.json({
    status: 'online',
    app: 'Zenith Finance Multi-User API',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes (Public)
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/social-login', socialLogin);

// Protected Routes (Require JWT)
app.use('/api', authenticateToken as any);

app.get('/api/auth/me', getMe as any);
app.put('/api/auth/profile', updateProfile as any);
app.get('/api/dashboard', getDashboardSummary as any);

app.get('/api/transactions', getTransactions as any);
app.post('/api/transactions', createTransaction as any);
app.delete('/api/transactions/:id', deleteTransaction as any);

app.get('/api/categories', getCategories as any);
app.post('/api/categories', createCategory as any);

app.get('/api/accounts', getAccounts as any);
app.post('/api/accounts', createAccount as any);

app.get('/api/budgets', getBudgets as any);
app.post('/api/budgets', setBudget as any);

app.get('/api/recurring', getRecurring as any);
app.post('/api/recurring', createRecurring as any);
app.post('/api/recurring/:id/log', markRecurringAsLogged as any);
app.get('/api/reminders', getReminders as any);
app.patch('/api/reminders/:id/toggle', toggleReminderPaid as any);

app.post('/api/import/preview', upload.single('file'), previewStatement as any);
app.post('/api/import/commit', commitImportedTransactions as any);

app.get('/api/ai/analysis', getAiSpendingAnalysis as any);

if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    console.log(`⚡ Zenith Finance Multi-User Server running on http://localhost:${PORT}`);
    await checkDbConnection();
  });
}

export { app };
export default app;

// Global Error Handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    database: process.env.DATABASE_URL ? 'configured' : 'missing_database_url',
  });
});
