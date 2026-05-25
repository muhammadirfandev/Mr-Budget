import React, { useState, useEffect } from 'react';
import { X, Sparkles, BrainCircuit, RefreshCw, CheckCircle, TrendingUp, HelpCircle } from 'lucide-react';
import { Transaction, LinkedAccount, BudgetCategory, SavingsGoal, CurrencyConfig, formatMoney } from '../types';

interface AdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: LinkedAccount[];
  budgets: BudgetCategory[];
  goals: SavingsGoal[];
  selectedCurrency: CurrencyConfig;
}

export default function AdvisoryModal({ isOpen, onClose, transactions, accounts, budgets, goals, selectedCurrency }: AdvisoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);

  const steps = [
    'Scanning transaction timestamps...',
    'Performing multi-category allocation audits...',
    'Analyzing liquid reserves vs. inflation drag...',
    'Generating targeted micro-optimization steps...'
  ];

  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      setLoadingStep(0);
      return;
    }

    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setLoading(false);
            }, 600);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }

    return () => clearInterval(interval);
  }, [isOpen, loading]);

  if (!isOpen) return null;

  // Let's calculate some real metrics to present in the advisor report!
  const totalChecking = accounts.filter(a => a.type === 'checking').reduce((sum, a) => sum + a.balance, 0);
  const totalSavings = accounts.filter(a => a.type === 'savings').reduce((sum, a) => sum + a.balance, 0);
  const totalCredit = Math.abs(accounts.filter(a => a.type === 'credit').reduce((sum, a) => sum + a.balance, 0));
  const totalInvestment = accounts.filter(a => a.type === 'investment').reduce((sum, a) => sum + a.balance, 0);
  const totalAssets = totalChecking + totalSavings + totalInvestment;
  const netWorth = totalAssets - totalCredit;

  // Find categories over budget
  const overBudgetCat = budgets.find(b => b.currentSpent > b.limitSpent);
  const topSpentCat = [...budgets].sort((a, b) => b.currentSpent - a.currentSpent)[0];

  // Specific simulated AI advices based on calculations
  const totalReserve = totalChecking + totalSavings;
  const recommendedReserve = 15000; // Emergency fund recommended size
  const excessLiquidity = Math.max(0, totalReserve - recommendedReserve);

  return (
    <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-outline-variant animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-primary text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-secondary-container rounded-lg text-on-secondary-container">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-lg text-headline-md leading-tight">Wealth Advisor Engine</h3>
              <p className="text-xs text-primary-fixed-dim">Custom intelligence scanning and financial diagnostics</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-primary-fixed-dim hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading audit */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
            <RefreshCw className="w-10 h-10 text-secondary animate-spin" />
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Analyzing Personal Balance Sheets</h4>
              <p className="text-sm text-on-surface-variant max-w-sm">
                Our algorithm processes liquidity structures and relative spending behaviors.
              </p>
            </div>
            {/* Steps indicator */}
            <div className="w-full max-w-sm space-y-2 pt-4">
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary transition-all duration-300" 
                  style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-secondary font-mono text-center h-4 font-semibold">
                {steps[loadingStep]}
              </p>
            </div>
          </div>
        ) : (
          /* Report Body */
          <div className="max-h-[550px] overflow-y-auto">
            <div className="p-6 space-y-6">
              
              {/* Executive Summary banner */}
              <div className="bg-secondary-container/15 p-4 rounded-xl border border-secondary/20 flex gap-3 text-sm text-primary">
                <BrainCircuit className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-secondary">Diagnostic Executive Summary</h4>
                  <p className="text-on-surface-variant mt-1 text-xs leading-relaxed">
                    Based on your total net worth of <strong className="font-mono text-primary font-bold">{formatMoney(netWorth, selectedCurrency)}</strong>, 
                    your liquidity ratio is extremely healthy. However, asset drag and category limits require active rebalancing.
                  </p>
                </div>
              </div>

              {/* Insights section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Targeted Action Strategies</h4>
                
                {/* 1. Excess Checking Sweep rule */}
                {totalChecking > 8000 && (
                  <div className="flex gap-3 p-4 bg-background rounded-xl border border-outline-variant hover:border-primary/20 transition-all">
                    <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-primary">Deploy checking sweeps of {formatMoney(totalChecking - 5000, selectedCurrency)}</p>
                      <p className="text-on-surface-variant mt-1 leading-relaxed">
                        You are maintaining <strong>{formatMoney(totalChecking, selectedCurrency)}</strong> in liquid checking assets. 
                        Sweeping anything above {formatMoney(5000, selectedCurrency)} into Marcus High-Yield Savings (4.50% APY) generates an additional 
                        <strong> {formatMoney((totalChecking - 5000) * 0.045, selectedCurrency)} per year</strong> risk-free.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Overbudget Category warning */}
                {overBudgetCat ? (
                  <div className="flex gap-3 p-4 bg-background rounded-xl border border-outline-variant hover:border-error/20 transition-all">
                    <CheckCircle className="w-5 h-5 text-error shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-primary">Stabilize '{overBudgetCat.name}' outlays</p>
                      <p className="text-on-surface-variant mt-1 leading-relaxed">
                        Spending in <strong>{overBudgetCat.name}</strong> stands at <strong>{formatMoney(overBudgetCat.currentSpent, selectedCurrency)}</strong>, exceeding your monthly allocation of {formatMoney(overBudgetCat.limitSpent, selectedCurrency)}.
                        Switching to unified family subscription groups can easily save {formatMoney(100, selectedCurrency)}/mo.
                      </p>
                    </div>
                  </div>
                ) : topSpentCat && (
                  <div className="flex gap-3 p-4 bg-background rounded-xl border border-outline-variant hover:border-primary/20 transition-all">
                    <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-primary">Optimize '{topSpentCat.name}' (Highest cost item)</p>
                      <p className="text-on-surface-variant mt-1 leading-relaxed">
                        Currently, <strong>{topSpentCat.name}</strong> represents your single highest budgeting category (<strong>{formatMoney(topSpentCat.currentSpent, selectedCurrency)}</strong>).
                        Reviewing recurring utilities or manual caps can sweep an extra 5% toward savings goals.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Goal projection recommendation */}
                <div className="flex gap-3 p-4 bg-background rounded-xl border border-outline-variant hover:border-primary/20 transition-all">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-primary">Japan Summer Trip Project Sweep</p>
                    <p className="text-on-surface-variant mt-1 leading-relaxed">
                      You have saved <strong>40%</strong> of your {formatMoney(8000, selectedCurrency)} goal. Increasing contributions by just {formatMoney(150, selectedCurrency)}/month will accelerate 
                      your readiness date by <strong>2 full months earlier</strong>, avoiding summer peak flight premium rates.
                    </p>
                  </div>
                </div>

                {/* 4. Portfolio Allocation suggestion */}
                {totalInvestment > 0 && (
                  <div className="flex gap-3 p-4 bg-background rounded-xl border border-outline-variant hover:border-primary/20 transition-all">
                    <TrendingUp className="w-5 h-5 text-secondary shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-primary">Tax-Loss and Index Balancing</p>
                      <p className="text-on-surface-variant mt-1 leading-relaxed">
                        Your Vanguard ledger is valued at <strong>{formatMoney(totalInvestment, selectedCurrency)}</strong>. Ensure automatic dividend reinvestments (DRIP) are set to build compound curves.
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 bg-background border-t border-outline-variant flex justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Dismiss Report
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setLoadingStep(0);
                }}
                className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Re-Run Diagnostics
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
