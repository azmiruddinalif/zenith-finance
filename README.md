# Zenith Finance
### *Intelligent Personal Wealth & Expense Platform*

![Zenith Finance Logo](client/public/logo.jpg)

Zenith Finance is a modern, cross-platform personal finance and expense ecosystem built for Desktop (Electron & PWA) and Mobile (PWA). It features an **offline-first IndexedDB architecture**, **PostgreSQL with Prisma ORM backend**, **multi-tenant JWT authentication**, **Bank Statement CSV/Excel Import Studio**, and an **AI-powered spending analysis engine**.

---

## Key Features

- **Multi-User Architecture & Security**:
  - Secure registration and login using salted `bcrypt` password hashing.
  - 30-day signed JSON Web Tokens (JWT) for session management.
  - Complete data isolation per user account.
  - Automated starter kit provisioning (starter accounts, categories, and budgets created on sign-up).

- **Offline-First Zero Data Loss Support**:
  - Powered by Dexie.js (IndexedDB).
  - Add, edit, or remove transactions even without an active internet connection.
  - Background synchronization queues updates and flushes them to PostgreSQL when connectivity is restored.

- **AI Spending Intelligence**:
  - Financial Health Score (0 - 100) tracking spending velocity.
  - Automatic anomaly and overspending detection.
  - Actionable, personalized savings strategies and recommendations.

- **Bank Statement CSV & Excel Import Studio**:
  - Drag-and-drop support for `.csv`, `.xlsx`, and `.xls` files.
  - Smart keyword-to-category mapping rules (e.g. supermarkets to Groceries, fuel/rides to Transport).
  - Interactive table preview and duplicate detection prior to committing.

- **1-Tap Rapid Expense Entry (Mobile PWA Mode)**:
  - Fast numeric entry with quick-amount chips (+100, +500, +1000).
  - Category pill carousel and account selector designed for one-handed mobile use.

- **Monthly Budgets & Category Tracking**:
  - Visual progress meters with status indicators (Normal, Warning >80%, Exceeded).
  - Configurable limits per category with remaining balance calculations.

- **Recurring Bills & Subscriptions**:
  - Track subscriptions (streaming services, rent, utility bills) with next due date countdowns.
  - One-click expense logging.

- **Multi-Currency Engine**:
  - Live currency switcher supporting **BDT**, **USD**, **EUR**, **GBP**, **INR**, **AED**, and **SAR** with exchange rate conversions.

- **Cross-Platform Delivery**:
  - **Desktop PWA & Web**: Hosted on Vercel with responsive desktop layout.
  - **Mobile PWA**: Installable to Android & iOS home screens via standalone manifest.
  - **Desktop Shell**: Native Windows executable wrapper powered by Electron.

---

## Project Structure

```
zenith-finance/
├── client/                     # Frontend (React 18 + Vite + TypeScript + TailwindCSS)
│   ├── public/logo.jpg         # Brand Logo
│   ├── public/manifest.json    # PWA Manifest
│   ├── public/sw.js            # Service Worker Cache
│   ├── src/
│   │   ├── components/         # UI Views & Modals (Dashboard, QuickAdd, CSV Import, AI)
│   │   ├── context/            # AuthContext & FinanceContext state management
│   │   ├── services/           # API client & Dexie IndexedDB sync engine
│   │   └── types/              # TypeScript interfaces
├── server/                     # Backend API (Node.js + Express + TypeScript + Prisma)
│   ├── prisma/schema.prisma    # PostgreSQL Schema (Multi-tenant data models)
│   ├── src/controllers/        # Auth, Transactions, Budgets, Recurring, Import, AI
│   ├── src/middleware/         # JWT Authentication verification
│   └── src/db/seed.ts          # Database seed script
├── electron/                   # Native Desktop Shell
│   ├── main.js                 # Electron main process
│   └── preload.js              # Native IPC bridge
├── sample-bank-statement.csv   # Ready-to-use sample file for testing statement import
└── package.json                # Monorepo orchestration scripts
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18 or newer
- **PostgreSQL**: A local or cloud-hosted PostgreSQL database instance

---

### Environment Configuration

Configure the environment variables in your server configuration file:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens |
| `PORT` | Server listening port (default: `5001`) |
| `CORS_ORIGIN` | Permitted frontend origins |
| `GEMINI_API_KEY` | *(Optional)* API key for dynamic AI recommendations |

For the client application:

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Full URL of the backend API (e.g. `https://your-api-domain.com/api`) |

---

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Initialize Database**:
   Set your `DATABASE_URL` in `server/.env` and run:
   ```bash
   cd server
   npx prisma db push
   npm run seed
   ```

3. **Run Both Server and Client**:
   From the project root:
   ```bash
   npm run dev
   ```
   - **Frontend**: http://localhost:5173
   - **Backend**: http://localhost:5001

4. **Run Native Electron Desktop App**:
   ```bash
   npm run electron:dev
   ```

---

### Production Deployment (Vercel)

This application is architected for Vercel deployment:

1. **Frontend**: Deploy the `client` directory to Vercel as a Vite project with the `VITE_API_URL` environment variable pointing to your deployed backend.
2. **Backend**: Deploy the `server` directory to Vercel Serverless (or a container host like Render / Railway) with your cloud `DATABASE_URL` and `JWT_SECRET`.
3. **Database**: Connect any cloud PostgreSQL provider (such as Neon, Supabase, or Vercel Postgres).

---

## License

MIT License. Designed and developed with Zenith Finance.
