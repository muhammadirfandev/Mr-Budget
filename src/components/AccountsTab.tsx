import React, { useState } from 'react';
import { 
  Plus, 
  TrendingUp, 
  DollarSign, 
  HelpCircle, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CreditCard,
  LineChart,
  Wallet,
  Coins,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Link2
} from 'lucide-react';
import { LinkedAccount, SavingsGoal, CurrencyConfig, formatMoney } from '../types';

interface AccountsTabProps {
  accounts: LinkedAccount[];
  goals: SavingsGoal[];
  onLinkAccountClick: () => void;
  onContributeToGoal: (goalId: string, amount: number) => void;
  onOpenAdvisor: () => void;
  selectedCurrency: CurrencyConfig;
  onSyncAccounts: () => void;
  isSyncing: boolean;
}

export default function AccountsTab({
  accounts,
  goals,
  onLinkAccountClick,
  onContributeToGoal,
  onOpenAdvisor,
  selectedCurrency,
  onSyncAccounts,
  isSyncing
}: AccountsTabProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('1000');

  // Derive sums dynamically based on accounts!
  const totalLiquidity = accounts
    .filter((a) => a.type === 'checking' || a.type === 'savings')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalDebt = Math.abs(accounts
    .filter((a) => a.type === 'credit')
    .reduce((sum, a) => sum + a.balance, 0));

  const totalInvestment = accounts
    .filter((a) => a.type === 'investment')
    .reduce((sum, a) => sum + a.balance, 0);

  const netWorth = (totalLiquidity + totalInvestment) - totalDebt;

  // Render SVG circular progress dials
  const renderGoalDial = (goal: SavingsGoal) => {
    const radius = 35;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius; // 219.9
    const percent = Math.min(100, (goal.currentSaved / goal.targetSaved) * 100);
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    // Dial color class mapping
    let strokeColorClass = 'text-secondary-container';
    if (goal.color === 'sky') strokeColorClass = 'text-tertiary-fixed-dim';
    if (goal.color === 'rose') strokeColorClass = 'text-error-container';

    return (
      <div className="relative w-16 h-16 shrink-0 select-none">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Base circle */}
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            className="text-white/10 stroke-current" 
            strokeWidth={strokeWidth} 
            fill="transparent" 
          />
          {/* Progress circle */}
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            className={`${strokeColorClass} stroke-current transition-all duration-500`} 
            strokeWidth={strokeWidth} 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent" 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white font-sans">{percent.toFixed(0)}%</span>
        </div>
      </div>
    );
  };

  const handleContribute = (goalId: string) => {
    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0) return;
    
    // Convert entered amount (in selected currency) back to USD base for storage
    const usdAmount = amt / selectedCurrency.rate;
    
    onContributeToGoal(goalId, usdAmount);
    setSelectedGoalId(null);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return Smartphone;
      case 'savings': return Coins;
      case 'credit': return CreditCard;
      default: return LineChart;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans text-primary tracking-tight">Accounts &amp; Goals</h2>
          <p className="text-sm text-on-surface-variant">Manage your liquidity channels and track your path to financial freedom.</p>
        </div>
        <div>
          <button 
            type="button"
            onClick={onLinkAccountClick}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-primary border border-outline-variant rounded-xl font-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <Link2 className="w-4 h-4" />
            Link New Account
          </button>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Accounts Overviews & Linked lists */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Overview Metrics Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Liquidity block */}
            <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <p className="text-[10px] font-bold text-outline-variant uppercase tracking-wider mb-2">Total Liquidity</p>
              <h4 className="text-xl font-bold text-primary font-sans tracking-tight tabular-nums">
                {formatMoney(totalLiquidity, selectedCurrency)}
              </h4>
              <p className="text-xs text-secondary font-medium flex items-center gap-1 mt-2">
                <TrendingUp className="w-3.5 h-3.5" /> +2.4% this month
              </p>
            </div>

            {/* Debt block */}
            <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-outline-variant uppercase tracking-wider mb-2">Total Debt</p>
              <h4 className="text-xl font-bold text-error font-sans tracking-tight tabular-nums">
                -{formatMoney(totalDebt, selectedCurrency)}
              </h4>
              <p className="text-xs text-on-surface-variant opacity-80 mt-2">Across linked credit accounts</p>
            </div>

            {/* Net Worth block */}
            <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-outline-variant uppercase tracking-wider mb-2">Net Worth</p>
              <h4 className="text-xl font-bold text-primary font-sans tracking-tight tabular-nums">
                {formatMoney(netWorth, selectedCurrency)}
              </h4>
              <span className="text-[10px] text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full inline-flex font-bold mt-2">
                PREMIUM PLAN
              </span>
            </div>

          </div>

          {/* Linked Bank Accounts */}
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-semibold text-primary text-base">Linked Accounts</h3>
                <button
                  type="button"
                  onClick={onSyncAccounts}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-highest text-primary hover:bg-surface-container-high disabled:opacity-50 text-xs font-bold rounded-lg border border-outline-variant/65 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] h-8 shrink-0"
                  title="Simulate secure handshake sync"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Connection'}
                </button>
              </div>

              <div className="divide-y divide-outline-variant/60">
                {accounts.map((acc) => {
                  const IconComponent = getAccountIcon(acc.type);
                  const isNegative = acc.balance < 0;

                  return (
                    <div key={acc.id} className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-primary text-sm truncate">{acc.name}</h4>
                          <p className="text-[11px] text-on-surface-variant leading-relaxed truncate">
                            {acc.bank} •••• {isSyncing ? (
                              <span className="inline-block animate-pulse text-secondary text-xs font-bold font-mono">Pinging...</span>
                            ) : acc.last4}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold font-mono tracking-tight tabular-nums ${isNegative ? 'text-primary' : 'text-primary'}`}>
                          {acc.balance >= 0 ? '' : '-'}{formatMoney(Math.abs(acc.balance), selectedCurrency)}
                        </p>
                        <p className="text-[11px] text-on-surface-variant opacity-80 mt-0.5">
                          {isSyncing ? (
                            <span className="inline-block animate-pulse text-secondary text-[10px] font-semibold">Handshaking...</span>
                          ) : acc.syncTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-surface-container-low text-center border-t border-outline-variant">
              <button 
                type="button"
                onClick={onOpenAdvisor}
                className="text-xs font-bold text-primary flex items-center justify-center gap-1.5 mx-auto hover:gap-2.5 transition-all cursor-pointer"
              >
                View Detailed Portfolio Audit <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Right column: Savings Goals list dials (asymmetric dark section!) */}
        <div className="lg:col-span-4 bg-primary-container text-white rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            
            <div>
              <h3 className="text-lg font-bold font-sans text-white tracking-tight">Savings Goals</h3>
              <p className="text-xs text-primary-fixed-dim mt-1">Direct sweeps from checkings into active targets</p>
            </div>

            {/* Goals Dials items list */}
            <div className="space-y-4">
              {goals.map((goal) => {
                const percent = (goal.currentSaved / goal.targetSaved) * 100;

                return (
                  <div key={goal.id} className="space-y-3">
                    <div 
                      onClick={() => setSelectedGoalId(selectedGoalId === goal.id ? null : goal.id)}
                      className="flex items-center gap-4 group cursor-pointer bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all"
                    >
                      {renderGoalDial(goal)}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{goal.name}</h4>
                        <p className="text-xs text-primary-fixed-dim font-mono tracking-tight tabular-nums mt-0.5 font-semibold">
                          {formatMoney(goal.currentSaved, selectedCurrency)} / <span className="opacity-70">{formatMoney(goal.targetSaved, selectedCurrency)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Expand contributing action on select */}
                    {selectedGoalId === goal.id && (
                      <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-3 animate-in slide-in-from-top-3 duration-200">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-primary-fixed mb-1.5">
                            Contribute from Liquid Checking ({selectedCurrency.symbol.trim()})
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              className="bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1 flex-1 font-mono text-xs text-right"
                              value={contribAmount}
                              onChange={(e) => setContribAmount(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handleContribute(goal.id)}
                              className="px-4 py-1.5 bg-secondary-container text-on-secondary-container font-bold text-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                            >
                              Sweep
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick action info */}
            <div className="text-[10px] text-primary-fixed-dim text-center opacity-85 py-2">
              💡 Hint: click any Goal card to easily contribution-sweep from liquidity checkings directly!
            </div>

          </div>

          <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary opacity-10 blur-3xl rounded-full"></div>
        </div>

      </div>

      {/* Optimized Savings featured advisory card with beautiful image */}
      <div className="col-span-12 h-64 rounded-2xl overflow-hidden relative group">
        <img 
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[800ms] select-none" 
          alt="Clean financial laptop setting" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaDOuHexyPIfb68tSZcSBlW61aDJiX38DAXswE2K99xOVt7SWrGt4iCe80HWY72LmjKo3OBp0ra6hwUeVwOM1UpB8Q7NCmCjTThXTg88XvZP-ganzq8r8plH005NXCzUWbxvHtmHiL-yeIQSJgCUJ6VD5arK_gIjQUjU26tvDPkPPYs9nq429754iuoZSF0jsXfUpcZO0PdjQyqPM6CbDEHeQNC9Tyj951X6LgmniEbEs-F5a4MiB5VMSs1dNSGMdHeHhcPdkA5sg"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-transparent flex items-center px-6 sm:px-8">
          <div className="max-w-md text-white space-y-4">
            <h4 className="text-xl font-bold font-sans text-white tracking-tight">Optimize Yours Savings</h4>
            <p className="text-xs text-primary-fixed-dim leading-relaxed">
              Based on your current spending levels and active linked assets, you could reach your "Japan Trip" target goal 2 months earlier by cutting just $150/mo in dining out.
            </p>
            <button 
              type="button"
              onClick={onOpenAdvisor}
              className="bg-secondary text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-secondary/90 transition-colors cursor-pointer"
            >
              Apply Strategy
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
