import React, { useState } from 'react';
import { X, Link as LinkIcon, DollarSign, Wallet } from 'lucide-react';
import { LinkedAccount, CurrencyConfig } from '../types';

interface LinkAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (account: LinkedAccount) => void;
  selectedCurrency: CurrencyConfig;
}

export default function LinkAccountModal({ isOpen, onClose, onLink, selectedCurrency }: LinkAccountModalProps) {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('Chase Bank');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'checking' | 'savings' | 'credit' | 'investment'>('checking');
  const [apy, setApy] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    const numericBalance = parseFloat(balance);
    if (isNaN(numericBalance)) return;

    // Convert input starting balance to USD base for universal internal ledger keeping
    const usdBalance = numericBalance / selectedCurrency.rate;

    // Credit cards have negative balance representation in this system
    const finalBalance = type === 'credit' ? -Math.abs(usdBalance) : Math.abs(usdBalance);

    const newAccount: LinkedAccount = {
      id: `acc-${Date.now()}`,
      name,
      bank,
      last4: Math.floor(1000 + Math.random() * 9000).toString(),
      balance: finalBalance,
      syncTime: 'Just Linked',
      type,
      apy: type === 'savings' && apy ? `${parseFloat(apy).toFixed(2)}% APY` : undefined,
    };

    onLink(newAccount);
    onClose();
    // Reset state
    setName('');
    setBalance('');
    setApy('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-background">
          <div>
            <h3 className="font-sans font-semibold text-lg text-primary text-headline-md">Link New Account</h3>
            <p className="text-xs text-on-surface-variant">Securely authorize checking, savings, or investment streams</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Account Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">Account Category</label>
            <div className="grid grid-cols-4 gap-2 bg-background p-1 rounded-xl border border-outline-variant">
              {(['checking', 'savings', 'credit', 'investment'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                    type === t
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Account name */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Account Nickname</label>
            <input
              type="text"
              required
              placeholder="e.g. Primary Checking, Premium Investment, Card Platinum"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm"
            />
          </div>

          {/* Bank Partner Selection */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Institution Partner</label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm"
            >
              <option value="Chase Bank">Chase Bank</option>
              <option value="Marcus Goldman Sachs">Marcus Goldman Sachs</option>
              <option value="Capital One">Capital One</option>
              <option value="Vanguard">Vanguard</option>
              <option value="Fidelity Investments">Fidelity Investments</option>
              <option value="Bank of America">Bank of America</option>
              <option value="Wells Fargo">Wells Fargo</option>
            </select>
          </div>

          {/* Balance & APY input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                {type === 'credit' ? `Outstanding Balance (${selectedCurrency.code})` : `Starting Balance (${selectedCurrency.code})`}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-semibold">{selectedCurrency.symbol.trim()}</span>
                <input
                  type="number"
                  step={selectedCurrency.code === 'BHD' ? '0.001' : '0.01'}
                  required
                  placeholder={selectedCurrency.code === 'BHD' ? '0.000' : '0.00'}
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full pl-12 pr-3 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm font-mono"
                />
              </div>
            </div>

            {type === 'savings' && (
              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">Annual Yield (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="4.50"
                    value={apy}
                    onChange={(e) => setApy(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">%</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant flex gap-3 text-xs text-on-surface-variant">
            <Wallet className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-primary">Secure End-to-End Handshake</p>
              <p className="mt-0.5">MR Budget uses read-only API sync protocols. We will never store your credential logins or have access to initiate transfers.</p>
            </div>
          </div>

          {/* Action Footer */}
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
              className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" />
              Establish Link
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
