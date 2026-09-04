# 💎 Zenith Finance (জেনিথ ফাইন্যান্স)
### *Intelligent Personal Wealth & Expense Engine*

![Zenith Finance Logo](/client/public/logo.jpg)

Zenith Finance is an ultra-modern, cross-platform personal finance and expense ecosystem built for Desktop (Electron & PWA) and Mobile (PWA). It features an **offline-first IndexedDB architecture**, **PostgreSQL with Prisma backend**, **Bank Statement CSV/Excel Import Studio**, and an **AI-powered spending analysis advisor** (in English & বাংলা).

---

## 🌟 Core Features

- **📊 Comprehensive Income & Expense Tracking**: Categorized transactions with account tracking (Cash, City Bank, bKash, Credit Cards).
- **💡 AI Spending Intelligence (AI দিয়ে spending analysis)**:
  - Financial Health Score (0 - 100).
  - Spending anomaly detection and velocity burn rate.
  - Actionable savings recommendations in both **English and Bengali (বাংলা)**.
- **📥 Bank Statement CSV & Excel Import Studio**:
  - Drag & drop bank statements (.csv, .xlsx, .xls).
  - Smart keyword-to-category engine (e.g., Shwapno -> Groceries, Uber/Pathao -> Transport, DESCO -> Utilities).
  - Row preview & deduplication before committing to PostgreSQL.
- **⚡ 1-Tap Rapid Expense Logging (Mobile PWA Mode)**:
  - Large numpad amount input with quick +৳100, +৳500, +৳1000 chips.
  - Horizontal category selector and account switcher.
- **🌐 Zero-Data-Loss Offline-First Support**:
  - Built-in Dexie.js (IndexedDB) local cache.
  - When offline, transactions are saved locally with pending sync badges.
  - Automatic background synchronization once reconnected to PostgreSQL.
- **🎯 Monthly Budgets**: Category limits, visual percentage meters, safe/warning/exceeded alert badges.
- **🔄 Recurring Expenses & Subscriptions**: Track Netflix, rent, internet bills with next due dates and 1-click expense creation.
- **🔔 Bill Reminders**: Upcoming payment deadlines with toggleable payment tracking.
- **💱 Multi-Currency Engine**: Live switcher between **BDT ৳**, **USD $**, **EUR €**, **GBP £**, **INR ₹**, **AED**, and **SAR**.
- **🖥️ Desktop Electron App**: Native Windows desktop shell with system menus and file dialogs.

---

## 📂 Project Structure

```
E:\zenith-finance\
├── client/                     # Vite + React 18 + TailwindCSS PWA
│   ├── public/logo.jpg         # Brand Logo
│   ├── public/manifest.json    # PWA Manifest
│   ├── public/sw.js            # Service Worker Offline Cache
│   ├── src/
│   │   ├── components/         # Dashboard, QuickAdd, CSV Import, AI Modal, etc.
│   │   ├── context/            # Finance global state & currency engine
│   │   ├── services/           # REST API & Dexie IndexedDB sync engine
│   │   └── types/              # TypeScript interfaces
├── server/                     # Node.js + Express + TypeScript API
│   ├── prisma/schema.prisma    # PostgreSQL Schema (8 models)
│   ├── src/controllers/        # Transactions, Budgets, AI, CSV Import
│   └── src/db/seed.ts          # Database seed script
├── electron/                   # Native Windows Desktop Shell
│   ├── main.js                 # Electron main process
│   └── preload.js              # Native IPC bridges
├── sample-bank-statement.csv   # Ready-to-use sample statement for import testing
└── package.json                # Root orchestration scripts
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup (PostgreSQL)
Ensure your PostgreSQL 18 service is running on `localhost:5432`.
In `server/.env`, customize your credentials if needed:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zenith_finance?schema=public"
PORT=5001
```

Inside `server/`:
```bash
cd server
npm install
npx prisma db push
npm run seed
```

### 2. Frontend Setup (Client)
Inside `client/`:
```bash
cd client
npm install
npm run dev
```
Access the app at `http://localhost:5173`.

### 3. Run Everything Concurrently
From the root directory `E:\zenith-finance`:
```bash
npm install
npm run dev
```

### 4. Run Electron Desktop App
```bash
npm run electron:dev
```
