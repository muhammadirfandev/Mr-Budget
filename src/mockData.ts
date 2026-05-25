import { Transaction, LinkedAccount, BudgetCategory, SavingsGoal, UpcomingBill } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_ACCOUNTS: LinkedAccount[] = [
  {
    id: 'acc-1',
    name: 'HBL Checking',
    bank: 'Habib Bank Limited',
    last4: '1947',
    balance: 0.00,
    syncTime: 'Updated 2m ago',
    type: 'checking'
  }
];

export const INITIAL_BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    id: 'cat-1',
    name: 'Rent & Housing',
    currentSpent: 0.00,
    limitSpent: 0.00,
    type: 'Monthly Fixed',
    iconName: 'Home'
  },
  {
    id: 'cat-2',
    name: 'Groceries',
    currentSpent: 0.00,
    limitSpent: 0.00,
    type: 'Variable Weekly',
    iconName: 'ShoppingCart'
  },
  {
    id: 'cat-3',
    name: 'Entertainment',
    currentSpent: 0.00,
    limitSpent: 0.00,
    type: 'Discretionary',
    iconName: 'Film'
  },
  {
    id: 'cat-4',
    name: 'Dining Out',
    currentSpent: 0.00,
    limitSpent: 0.00,
    type: 'Variable Discretionary',
    iconName: 'Utensils'
  }
];

export const INITIAL_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund',
    currentSaved: 0,
    targetSaved: 0,
    color: 'emerald'
  },
  {
    id: 'goal-2',
    name: 'Japan Summer Trip',
    currentSaved: 0,
    targetSaved: 0,
    color: 'sky'
  },
  {
    id: 'goal-3',
    name: 'Home Down Payment',
    currentSaved: 0,
    targetSaved: 0,
    color: 'rose'
  }
];

export const INITIAL_BILLS: UpcomingBill[] = [
  {
    id: 'bill-1',
    title: 'Adobe Creative Cloud',
    category: 'Subscription • Monthly',
    dueDate: 'Sep 12',
    amount: 0.00,
    status: 'DUE SOON'
  },
  {
    id: 'bill-2',
    title: 'Electric Co.',
    category: 'Utilities • Auto-pay',
    dueDate: 'Sep 15',
    amount: 0.00,
    status: 'SCHEDULED'
  },
  {
    id: 'bill-3',
    title: 'Rent / Mortgage',
    category: 'Housing • Manual',
    dueDate: 'Sep 18',
    amount: 0.00,
    status: 'MANUAL'
  }
];
