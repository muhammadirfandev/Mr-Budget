import React, { useState } from 'react';
import { X, Plus, Calendar, DollarSign } from 'lucide-react';
import { Transaction, LinkedAccount, CurrencyConfig } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
  accounts: LinkedAccount[];
  categories: string[];
  selectedCurrency: CurrencyConfig;
}

export default function AddTransactionModal({ isOpen, onClose, onAdd, accounts, categories, selectedCurrency }: AddTransactionModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Groceries');
  const [accountName, setAccountName] = useState(accounts[0]?.name || 'Main Checking');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return;

    // Scale the raw input amount to USD base for global database consistency
    const usdAmount = numericAmount / selectedCurrency.rate;
    const finalAmount = type === 'expense' ? -Math.abs(usdAmount) : Math.abs(usdAmount);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title,
      description: description || (type === 'expense' ? 'Debit Purchase' : 'Deposit Sync'),
      category,
      amount: finalAmount,
      date,
      account: accountName,
    };

    onAdd(newTx);
    onClose();
    // Reset form
    setTitle('');
    setAmount('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-background">
          <div>
            <h3 className="font-sans font-semibold text-lg text-primary text-headline-md">Add Transaction</h3>
            <p className="text-xs text-on-surface-variant">Log your financial movements instantaneously</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Transaction Type Picker */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2 bg-background p-1 rounded-xl border border-outline-variant">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm font-bold border border-secondary/20'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Payee / Merchant</label>
            <input
              type="text"
              required
              placeholder="e.g. Starbucks, Target, Employer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm"
            />
          </div>

          {/* Amount input & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Amount ({selectedCurrency.code})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-semibold">{selectedCurrency.symbol.trim()}</span>
                <input
                  type="number"
                  step={selectedCurrency.code === 'BHD' ? '0.001' : '0.01'}
                  required
                  placeholder={selectedCurrency.code === 'BHD' ? '0.000' : '0.00'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-3 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Category Selection & Account Sync */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Account</label>
              <select
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.name} ({acc.bank})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description field */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Reference / Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Transaction #WF-9021, Monthly Subscription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-outline-variant flex justify-end gap-2 bg-background -mx-6 -mb-6 p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
