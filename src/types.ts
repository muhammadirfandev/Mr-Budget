export interface Transaction {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number; // Positive for Income, Negative for Expense
  date: string; // e.g. "2023-10-24" or formatted
  account: string; // e.g. "Main Checking"
  merchantId?: string;
}

export interface LinkedAccount {
  id: string;
  name: string;
  bank: string;
  last4: string;
  balance: number;
  syncTime: string; // e.g. "Updated 2m ago"
  type: 'checking' | 'savings' | 'credit' | 'investment';
  apy?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  currentSpent: number;
  limitSpent: number;
  type: string; // 'Monthly Fixed' | 'Variable Weekly' | 'Discretionary' etc.
  iconName: string; // lucide icon name
}

export interface SavingsGoal {
  id: string;
  name: string;
  currentSaved: number;
  targetSaved: number;
  color: string; // Tailwind bg color class
}

export interface UpcomingBill {
  id: string;
  title: string;
  category: string;
  dueDate: string; // e.g. "Sep 12"
  amount: number;
  status: 'DUE SOON' | 'SCHEDULED' | 'MANUAL';
}

export type CurrencyCode = 'USD' | 'EUR' | 'PKR' | 'BHD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number;
  placement: 'before' | 'after';
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, placement: 'before' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, placement: 'before' },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', rate: 278.0, placement: 'before' },
  BHD: { code: 'BHD', symbol: 'BHD ', name: 'Bahraini Dinar', rate: 0.376, placement: 'before' },
};

export const formatMoney = (amountInUSD: number, currency: CurrencyConfig): string => {
  const converted = amountInUSD * currency.rate;
  const isBHD = currency.code === 'BHD';
  const decimals = isBHD ? 3 : 2;
  const formattedValue = Math.abs(converted).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  const sign = amountInUSD < 0 ? '-' : '';
  if (currency.placement === 'before') {
    return `${sign}${currency.symbol}${formattedValue}`;
  } else {
    return `${sign}${formattedValue}${currency.symbol}`;
  }
};


