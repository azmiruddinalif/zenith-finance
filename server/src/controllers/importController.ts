import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth';
import * as xlsx from 'xlsx';

export const previewStatement = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const categories = await prisma.category.findMany({ where: { userId } });
    const accounts = await prisma.account.findMany({ where: { userId } });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: '' });

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty' });
    }

    const headers = Object.keys(rows[0]);
    const parsedTransactions = rows.map((row, idx) => {
      let dateVal = new Date();
      let descVal = 'Bank Transaction';
      let amountVal = 0;
      let typeVal = 'EXPENSE';

      for (const h of headers) {
        const hLower = h.toLowerCase();
        const val = String(row[h]).trim();

        if (hLower.includes('date') || hLower.includes('time') || hLower.includes('তারিখ')) {
          const parsedDate = new Date(val);
          if (!isNaN(parsedDate.getTime())) dateVal = parsedDate;
        } else if (hLower.includes('desc') || hLower.includes('particular') || hLower.includes('narrat')) {
          if (val) descVal = val;
        } else if (hLower.includes('debit') || hLower.includes('withdrawal')) {
          const num = parseFloat(val.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(num) && num > 0) {
            amountVal = num;
            typeVal = 'EXPENSE';
          }
        } else if (hLower.includes('credit') || hLower.includes('deposit')) {
          const num = parseFloat(val.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(num) && num > 0) {
            amountVal = num;
            typeVal = 'INCOME';
          }
        } else if (hLower.includes('amount') || hLower.includes('টাকা')) {
          const num = parseFloat(val.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(num) && num !== 0) {
            amountVal = Math.abs(num);
            if (num < 0) typeVal = 'EXPENSE';
          }
        }
      }

      return {
        rowId: idx + 1,
        date: dateVal.toISOString().split('T')[0],
        description: descVal,
        amount: amountVal || 100,
        type: typeVal,
        categoryId: categories[0]?.id || '',
        categoryName: categories[0]?.name || 'General',
        accountId: accounts[0]?.id || '',
      };
    });

    res.json({
      success: true,
      data: {
        totalRows: parsedTransactions.length,
        transactions: parsedTransactions.slice(0, 100),
        categories,
        accounts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const commitImportedTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { transactions, accountId } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, message: 'No transactions to commit' });
    }

    let createdCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const item of transactions) {
        const targetAccId = item.accountId || accountId;
        const amount = parseFloat(item.amount);
        const type = item.type || 'EXPENSE';

        await tx.transaction.create({
          data: {
            userId,
            date: new Date(item.date),
            description: item.description,
            amount,
            type,
            currency: 'BDT',
            categoryId: item.categoryId,
            accountId: targetAccId,
            tags: 'Imported-CSV',
          },
        });

        const delta = type === 'INCOME' ? amount : -amount;
        await tx.account.update({
          where: { id: targetAccId },
          data: { balance: { increment: delta } },
        });

        createdCount++;
      }
    });

    res.json({
      success: true,
      message: `Successfully imported ${createdCount} transactions.`,
      count: createdCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
