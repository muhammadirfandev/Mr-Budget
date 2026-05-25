import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  CalendarDays, 
  Goal, 
  Plus, 
  Bell, 
  HelpCircle,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import { Transaction, LinkedAccount, BudgetCategory, SavingsGoal, UpcomingBill, CurrencyCode, CURRENCIES, formatMoney } from './types';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_ACCOUNTS, 
  INITIAL_BUDGET_CATEGORIES, 
  INITIAL_GOALS, 
  INITIAL_BILLS 
} from './mockData';

import OverviewTab from './components/OverviewTab';
import TransactionsTab from './components/TransactionsTab';
import BudgetTab from './components/BudgetTab';
import AccountsTab from './components/AccountsTab';

// Modals
import AddTransactionModal from './components/AddTransactionModal';
import LinkAccountModal from './components/LinkAccountModal';
import EditBudgetModal from './components/EditBudgetModal';
import AdvisoryModal from './components/AdvisoryModal';

export default function App() {
  // Global Database State
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<CurrencyCode>('PKR');
  const selectedCurrency = CURRENCIES[selectedCurrencyCode];

  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [accounts, setAccounts] = useState<LinkedAccount[]>(INITIAL_ACCOUNTS);
  const [budgets, setBudgets] = useState<BudgetCategory[]>(INITIAL_BUDGET_CATEGORIES);
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_GOALS);
  const [bills, setBills] = useState<UpcomingBill[]>(INITIAL_BILLS);

  const [isSyncing, setIsSyncing] = useState(false);

  // Layout navigation: 0 = Overview, 1 = Transactions Ledger, 2 = Budget Planner, 3 = Accounts & Goals
  const [activeTab, setActiveTab] = useState(0);

  // Modals Visibility
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isLinkAccOpen, setIsLinkAccOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [isAdvisoryOpen, setIsAdvisoryOpen] = useState(false);

  // Global State Modifiers
  const handleAddTransaction = (newTx: Transaction) => {
    // Save to list
    setTransactions((prev) => [newTx, ...prev]);

    // Perform interactive credit/bank balance deductions instantly!
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.name === newTx.account) {
          // Subtract or add
          return {
            ...acc,
            balance: acc.balance + newTx.amount, // Adding because negative amounts subtract
          };
        }
        return acc;
      })
    );

    // Also update current spent inside corresponding category in budget planner automatically!
    setBudgets((prevBudgets) =>
      prevBudgets.map((b) => {
        const isMatch = b.name.toLowerCase() === newTx.category.toLowerCase() ||
                        (b.name === 'Groceries' && newTx.category === 'Food & Dining');
        if (isMatch && newTx.amount < 0) {
          return {
            ...b,
            currentSpent: b.currentSpent + Math.abs(newTx.amount),
          };
        }
        return b;
      })
    );
  };

  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    // Refund bank balance
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.name === txToDelete.account) {
          return {
            ...acc,
            balance: acc.balance - txToDelete.amount,
          };
        }
        return acc;
      })
    );

    // Refund budget spending
    setBudgets((prevBudgets) =>
      prevBudgets.map((b) => {
        const isMatch = b.name.toLowerCase() === txToDelete.category.toLowerCase() ||
                        (b.name === 'Groceries' && txToDelete.category === 'Food & Dining');
        if (isMatch && txToDelete.amount < 0) {
          return {
            ...b,
            currentSpent: Math.max(0, b.currentSpent - Math.abs(txToDelete.amount)),
          };
        }
        return b;
      })
    );

    // Filter transaction list
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLinkAccount = (newAcc: LinkedAccount) => {
    setAccounts((prev) => [...prev, newAcc]);
  };

  const handleUpdateBudget = (updated: BudgetCategory[]) => {
    setBudgets(updated);
  };

  const handleUpdateBill = (billId: string, updatedFields: Partial<UpcomingBill>) => {
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, ...updatedFields } : b))
    );
  };

  const handlePayBill = (billId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    // Add a corresponding transaction automatically!
    const category = bill.title.toLowerCase().includes('rent') ? 'Rent & Housing' : 'Entertainment';
    handleAddTransaction({
      id: `tx-bill-${Date.now()}`,
      title: bill.title,
      description: `Bill Payment - ${bill.category}`,
      category,
      amount: -bill.amount,
      date: new Date().toISOString().split('T')[0],
      account: 'Main Checking',
    });

    // Remove bill from upcoming lists
    setBills((prev) => prev.filter((b) => b.id !== billId));
  };

  const handleContributeToGoal = (goalId: string, amount: number) => {
    // Deduct from Main Checking or most liquid account
    setAccounts((prevAccounts) => {
      const mainChecking = prevAccounts.find((a) => a.name === 'Main Checking');
      if (mainChecking && mainChecking.balance >= amount) {
        return prevAccounts.map((a) =>
          a.name === 'Main Checking' ? { ...a, balance: a.balance - amount } : a
        );
      }
      return prevAccounts;
    });

    // Add to specific Goal progress metrics!
    setGoals((prevGoals) =>
      prevGoals.map((g) =>
        g.id === goalId ? { ...g, currentSaved: Math.min(g.targetSaved, g.currentSaved + amount) } : g
      )
    );
  };

  const handleAddBudgetCategory = (newCat: Omit<BudgetCategory, 'id' | 'currentSpent'>) => {
    const freshCat: BudgetCategory = {
      ...newCat,
      id: `cat-${Date.now()}`,
      currentSpent: 0,
    };
    setBudgets((prev) => [...prev, freshCat]);
  };

  const handleSyncAccounts = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          const newLast4 = Math.floor(1000 + Math.random() * 9000).toString();
          const latency = Math.floor(45 + Math.random() * 85);
          return {
            ...acc,
            last4: newLast4,
            syncTime: `Updated just now (${latency}ms ping)`,
          };
        })
      );
      setIsSyncing(false);
    }, 1500);
  };

  // Derive global numerical stats dynamically from current lists!
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const categoriesList = Array.from(new Set([
    ...budgets.map((b) => b.name),
    'Salary',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Automotive',
    'Food & Dining'
  ]));

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen font-sans selection:bg-secondary-container">
      
      {/* Sidebar Navigation - Visible on Desktop screens */}
      <aside className="hidden md:flex flex-col h-full py-6 px-4 bg-surface-container-lowest border-r border-outline-variant fixed left-0 top-0 w-64 z-55">
        
        {/* Logo and Brand Title */}
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold text-primary tracking-tight">Mr Budget</h1>
          <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mt-0.5 opacity-75">
            Financial Control
          </p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab(0)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer ${
              activeTab === 0
                ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary/15 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="font-sans">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer ${
              activeTab === 1
                ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary/15 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
            }`}
          >
            <ReceiptText className="w-5 h-5 shrink-0" />
            <span className="font-sans">Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(2)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer ${
              activeTab === 2
                ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary/15 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
            }`}
          >
            <CalendarDays className="w-5 h-5 shrink-0" />
            <span className="font-sans">Budget Planner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(3)}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold text-xs rounded-xl transition-all duration-150 cursor-pointer ${
              activeTab === 3
                ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary/15 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
            }`}
          >
            <Goal className="w-5 h-5 shrink-0" />
            <span className="font-sans">Accounts &amp; Goals</span>
          </button>
        </nav>

        {/* Global actions at bottom */}
        <div className="mt-auto pt-6 px-2">
          <button
            type="button"
            onClick={() => setIsAddTxOpen(true)}
            className="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm border border-primary/10"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen flex flex-col justify-between">
        
        {/* Top AppBar Section */}
        <header className="flex justify-between items-center px-4 md:px-8 w-full h-16 sticky top-0 z-40 bg-white border-b border-outline-variant">
          
          <div className="flex items-center gap-6 flex-1 max-w-lg min-w-0">
            {/* Page Tab indicator inside header for visual polish */}
            <h2 className="hidden sm:block text-base font-bold text-primary shrink-0">
              {activeTab === 0 && 'Overview'}
              {activeTab === 1 && 'Ledger List'}
              {activeTab === 2 && 'Planner'}
              {activeTab === 3 && 'Liquidity Suite'}
            </h2>

            {/* Simulated Search bar */}
            <div className="flex items-center bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant w-full max-w-xs focus-within:border-primary transition-colors">
              <Search className="w-4 h-4 text-outline shrink-0" />
              <input
                type="text"
                placeholder="Search accounts..."
                onClick={() => { if (activeTab !== 1) setActiveTab(1); }}
                className="bg-transparent border-none text-xs w-full pl-2 placeholder:text-outline text-primary font-medium"
              />
            </div>
          </div>

          {/* Quick Info Alerts notifications & Profiles */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Currency Selector */}
            <div className="relative">
              <select
                id="currency-selector"
                value={selectedCurrencyCode}
                onChange={(e) => setSelectedCurrencyCode(e.target.value as CurrencyCode)}
                className="bg-surface-container-low text-xs font-bold text-primary pl-3 pr-8 py-1.5 rounded-full border border-outline-variant focus:outline-none focus:border-primary appearance-none cursor-pointer transition-colors hover:bg-surface-container-high h-[36px] min-w-[110px]"
                title="Select Base Currency"
              >
                <option value="USD">🇺🇸 USD ($)</option>
                <option value="EUR">🇪🇺 EUR (€)</option>
                <option value="PKR">🇵🇰 PKR (₨)</option>
                <option value="BHD">🇧🇭 BHD (BD)</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[8px] font-bold">▼</span>
            </div>

            {/* Stats notification shortcuts */}
            <button
              type="button"
              onClick={() => setIsAdvisoryOpen(true)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer relative"
              title="Alert Notifications"
            >
              <Bell className="w-5 h-5 text-on-surface-variant" />
              {/* Pulse status indicator */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse"></span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdvisoryOpen(true)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
              title="Wealth Advisory AI help"
            >
              <HelpCircle className="w-5 h-5 text-on-surface-variant" />
            </button>

            {/* Profile Avatar portrait of professional headshot */}
            <div 
              onClick={() => setIsAdvisoryOpen(true)}
              className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant bg-surface-container cursor-pointer hover:border-primary/50 transition-colors"
            >
              <img 
                alt="User Profile" 
                className="w-full h-full object-cover select-none"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJyQZ2Er5Ufqz9K7ClQekPOkYEfEL1Pkxu71cGPTkQwghsIC2nV3Ok-Xn9c08y9JOeIJPN5AYoPDVkHTrJdqpBk365Vt5mTlNWEiC3vetmY_AL3oDj_xqWiKTWl6B89LhDUWQlr3q8D1MI0rLZAMzzCYrAsFWn6QhS3-iPxtTLsPWTdyJrrwNNk0R5e2iCscE1enkj7Lcndt-L9Z8g-5f-8TrwdSvV-priG_BIvfc2JG3Qbig5U7MgvzpUhGLChx-yheYw0-2TlJ0"
              />
            </div>
          </div>

        </header>

        {/* Tab Canvas Content area */}
        <div className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full mb-16 md:mb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              {activeTab === 0 && (
                <OverviewTab
                  totalBalance={totalBalance}
                  budgets={budgets}
                  bills={bills}
                  recentTransactions={transactions.slice(0, 4)}
                  onAnalyze={() => setIsAdvisoryOpen(true)}
                  onNavigateToTab={setActiveTab}
                  onPayBill={handlePayBill}
                  onAddTransactionClick={() => setIsAddTxOpen(true)}
                  selectedCurrency={selectedCurrency}
                  onUpdateBill={handleUpdateBill}
                />
              )}

              {activeTab === 1 && (
                <TransactionsTab
                  transactions={transactions}
                  accounts={accounts}
                  categories={categoriesList}
                  onDeleteTransaction={handleDeleteTransaction}
                  onAddTransactionClick={() => setIsAddTxOpen(true)}
                  selectedCurrency={selectedCurrency}
                />
              )}

              {activeTab === 2 && (
                <BudgetTab
                  budgets={budgets}
                  onEditBudgetClick={() => setIsEditBudgetOpen(true)}
                  onAddCategory={handleAddBudgetCategory}
                  onOpenAdvisor={() => setIsAdvisoryOpen(true)}
                  selectedCurrency={selectedCurrency}
                />
              )}

              {activeTab === 3 && (
                <AccountsTab
                  accounts={accounts}
                  goals={goals}
                  onLinkAccountClick={() => setIsLinkAccOpen(true)}
                  onContributeToGoal={handleContributeToGoal}
                  onOpenAdvisor={() => setIsAdvisoryOpen(true)}
                  selectedCurrency={selectedCurrency}
                  onSyncAccounts={handleSyncAccounts}
                  isSyncing={isSyncing}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Floating Action Button - Desktop Quick actions shortcut */}
      <button 
        type="button"
        onClick={() => setIsAddTxOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 bg-primary hover:bg-primary-container text-white w-14 h-14 rounded-full shadow-2xl items-center justify-center z-45 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/10"
        title="Add transaction logs"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation for mobile screens only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-outline-variant flex items-center justify-around px-4 z-45">
        
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 0 ? 'text-primary font-bold' : 'text-on-surface-variant opacity-70'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 1 ? 'text-primary font-bold' : 'text-on-surface-variant opacity-70'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Ledger</span>
        </button>

        {/* Floating Add trigger on mobile */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={() => setIsAddTxOpen(true)}
            className="bg-primary text-white h-11 w-11 rounded-full shadow-lg flex items-center justify-center cursor-pointer border border-white/10"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab(2)}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 2 ? 'text-primary font-bold' : 'text-on-surface-variant opacity-70'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Budget</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(3)}
          className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 3 ? 'text-primary font-bold' : 'text-on-surface-variant opacity-70'
          }`}
        >
          <Goal className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Goals</span>
        </button>

      </nav>

      {/* Global Modals Portal */}
      <AnimatePresence>
        
        {/* Add Transaction */}
        {isAddTxOpen && (
          <AddTransactionModal
            isOpen={isAddTxOpen}
            onClose={() => setIsAddTxOpen(false)}
            onAdd={handleAddTransaction}
            accounts={accounts}
            categories={categoriesList}
            selectedCurrency={selectedCurrency}
          />
        )}

        {/* Link Bank Account */}
        {isLinkAccOpen && (
          <LinkAccountModal
            isOpen={isLinkAccOpen}
            onClose={() => setIsLinkAccOpen(false)}
            onLink={handleLinkAccount}
            selectedCurrency={selectedCurrency}
          />
        )}

        {/* Edit Budget Limits */}
        {isEditBudgetOpen && (
          <EditBudgetModal
            isOpen={isEditBudgetOpen}
            onClose={() => setIsEditBudgetOpen(false)}
            budgets={budgets}
            onUpdate={handleUpdateBudget}
            selectedCurrency={selectedCurrency}
          />
        )}

        {/* Advanced Wealth Advisor Report Diagnostics */}
        {isAdvisoryOpen && (
          <AdvisoryModal
            isOpen={isAdvisoryOpen}
            onClose={() => setIsAdvisoryOpen(false)}
            transactions={transactions}
            accounts={accounts}
            budgets={budgets}
            goals={goals}
            selectedCurrency={selectedCurrency}
          />
        )}

      </AnimatePresence>

    </div>
  );
}
