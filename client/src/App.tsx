import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { TransactionManager } from './components/TransactionManager';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetManager } from './components/BudgetManager';
import { RecurringManager } from './components/RecurringManager';
import { QuickAddModal } from './components/QuickAddModal';
import { BankImportModal } from './components/BankImportModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { AuthScreen } from './components/AuthScreen';

const MainWorkspace: React.FC = () => {
  const { activeTab, notification } = useFinance();

  return (
    <div className="min-h-screen flex flex-col bg-[#070A0F]">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full overflow-x-hidden">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'transactions' && <TransactionManager />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'budgets' && <BudgetManager />}
          {activeTab === 'recurring' && <RecurringManager />}
        </main>
      </div>

      <BottomNav />

      {/* Global Modals */}
      <QuickAddModal />
      <BankImportModal />
      <AiAdvisorModal />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/30 animate-fade-in flex items-center gap-2">
          <span>{notification}</span>
        </div>
      )}

    </div>
  );
};

const RootRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070A0F] text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading Zenith Finance...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <FinanceProvider>
      <MainWorkspace />
    </FinanceProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RootRouter />
    </AuthProvider>
  );
};
