import React, { useState } from 'react';
import { 
  TrendingUp, 
  Landmark, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  ShoppingCart, 
  DollarSign, 
  Car, 
  Utensils, 
  Film,
  Compass,
  Zap,
  CheckCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Transaction, BudgetCategory, UpcomingBill, CurrencyConfig, formatMoney } from '../types';

interface OverviewTabProps {
  totalBalance: number;
  budgets: BudgetCategory[];
  bills: UpcomingBill[];
  recentTransactions: Transaction[];
  onAnalyze: () => void;
  onNavigateToTab: (index: number) => void;
  onPayBill: (billId: string) => void;
  onAddTransactionClick: () => void;
  selectedCurrency: CurrencyConfig;
  onUpdateBill: (billId: string, updatedFields: Partial<UpcomingBill>) => void;
}

export default function OverviewTab({
  totalBalance,
  budgets,
  bills,
  recentTransactions,
  onAnalyze,
  onNavigateToTab,
  onPayBill,
  onAddTransactionClick,
  selectedCurrency,
  onUpdateBill
}: OverviewTabProps) {

  // Inline edit state
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');

  const startEditingAmount = (e: React.MouseEvent, billId: string, currentAmount: number) => {
    e.stopPropagation();
    setEditingBillId(billId);
    setEditingAmount((currentAmount * selectedCurrency.rate).toFixed(selectedCurrency.code === 'BHD' ? 3 : 2));
  };

  const saveAmountEdit = (billId: string) => {
    const parsedNum = parseFloat(editingAmount);
    if (!isNaN(parsedNum) && parsedNum >= 0) {
      const amountInUSD = parsedNum / selectedCurrency.rate;
      onUpdateBill(billId, { amount: amountInUSD });
    }
    setEditingBillId(null);
  };

  // Map category strings to specific Lucide components and colors
  const getCategoryTheme = (category: string) => {
    switch(category.toLowerCase()) {
      case 'salary':
      case 'income':
        return {
          icon: DollarSign,
          bg: 'bg-secondary-container/30',
          text: 'text-on-secondary-container'
        };
      case 'groceries':
      case 'food & dining':
      case 'shopping':
        return {
          icon: ShoppingCart,
          bg: 'bg-primary-fixed/40',
          text: 'text-on-primary-fixed-variant'
        };
      case 'automotive':
      case 'transport':
        return {
          icon: Car,
          bg: 'bg-primary-fixed/40',
          text: 'text-on-primary-fixed-variant'
        };
      case 'dining out':
      case 'dining':
        return {
          icon: Utensils,
          bg: 'bg-primary-fixed/40',
          text: 'text-on-primary-fixed-variant'
        };
      case 'entertainment':
        return {
          icon: Film,
          bg: 'bg-primary-fixed/40',
          text: 'text-on-primary-fixed-variant'
        };
      default:
        return {
          icon: Compass,
          bg: 'bg-primary-fixed/40',
          text: 'text-on-primary-fixed-variant'
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Bento Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Total Balance Card */}
        <div className="lg:col-span-4 bg-white border border-outline-variant rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Balance</p>
                <p className="text-[10px] text-on-surface-variant opacity-60">Compiled across all accounts</p>
              </div>
              <div className="bg-primary-fixed text-primary p-2.5 rounded-xl border border-primary/10">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
            
            <h3 className="text-3xl font-bold font-sans tracking-tight text-primary tabular-nums">
              {formatMoney(totalBalance, selectedCurrency)}
            </h3>
            
            <div className="mt-4 flex items-center gap-2">
              <span className="text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full font-bold flex items-center text-xs gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +2.4%
              </span>
              <span className="text-on-surface-variant text-xs">vs last month</span>
            </div>
          </div>
          
          {/* Background accent */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        {/* Monthly Spending vs Budget */}
        <div className="lg:col-span-8 bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Budget Status</p>
              <h4 className="text-lg font-bold text-primary">Monthly Spending</h4>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-xs font-medium text-on-surface-variant">Spent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-secondary-container rounded-full border border-secondary/20"></div>
                <span className="text-xs font-medium text-on-surface-variant">Remaining</span>
              </div>
            </div>
          </div>

          {/* Budget Progress Bars */}
          <div className="space-y-4">
            {budgets.slice(0, 3).map((cat) => {
              const spentPercent = (cat.currentSpent / cat.limitSpent) * 100;
              const isOver = cat.currentSpent > cat.limitSpent;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-primary">{cat.name}</span>
                    <span className="font-mono tabular-nums text-on-surface-variant">
                      {formatMoney(cat.currentSpent, selectedCurrency)} / <span className="text-outline">{formatMoney(cat.limitSpent, selectedCurrency)}</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden border border-outline-variant/30">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isOver ? 'bg-error' : 'bg-primary'
                      }`} 
                      style={{ width: `${Math.min(100, spentPercent)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid for Bills & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upcoming Bills Column */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-5">
              <h4 className="font-sans font-semibold text-primary">Upcoming Bills</h4>
              <button 
                type="button"
                onClick={() => onNavigateToTab(2)} // budget/bills planner
                className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center"
              >
                Planner <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {bills.map((bill) => {
                const parts = bill.dueDate.split(' ');
                const month = parts[0];
                const day = parts[1];

                return (
                  <div 
                    key={bill.id} 
                    className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-transparent hover:border-outline-variant/60 hover:bg-surface-container transition-all"
                  >
                    <div className="flex flex-col items-center justify-center bg-white border border-outline-variant rounded-lg p-1 w-12 shadow-sm shrink-0">
                      <span className="text-[9px] uppercase font-bold text-on-surface-variant">{month}</span>
                      <span className="text-base font-bold text-primary leading-tight font-sans">{day}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-primary text-sm truncate">{bill.title}</p>
                      <p className="text-[11px] text-on-surface-variant truncate opacity-80">{bill.category}</p>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 gap-1 min-w-[95px]">
                      {editingBillId === bill.id ? (
                        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] font-bold text-primary font-mono">{selectedCurrency.symbol.trim()}</span>
                          <input
                            type="number"
                            step={selectedCurrency.code === 'BHD' ? '0.001' : '0.01'}
                            className="w-16 px-1 py-0.5 bg-white border border-primary text-xs font-semibold text-right font-mono text-primary rounded outline-none focus:ring-1 focus:ring-primary"
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            onBlur={() => saveAmountEdit(bill.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveAmountEdit(bill.id);
                              } else if (e.key === 'Escape') {
                                setEditingBillId(null);
                              }
                            }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div 
                          onClick={(e) => startEditingAmount(e, bill.id, bill.amount)}
                          className="group/amt flex items-center gap-1 justify-end hover:bg-surface-container-high px-1.5 py-0.5 rounded border border-dashed border-transparent hover:border-outline-variant cursor-pointer transition-all"
                          title="Click to edit amount inline"
                        >
                          <p className="text-sm font-bold text-primary font-mono tabular-nums leading-none">
                            {formatMoney(bill.amount, selectedCurrency)}
                          </p>
                          <span className="text-[10px] text-outline opacity-0 group-hover/amt:opacity-100 transition-opacity">✎</span>
                        </div>
                      )}

                      <select
                        value={bill.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          onUpdateBill(bill.id, { status: e.target.value as any });
                        }}
                        className={`font-sans font-bold text-[9px] px-2 py-0.5 rounded-full inline-block transition-all border border-outline-variant/40 hover:border-outline cursor-pointer appearance-none text-center bg-transparent ${
                          bill.status === 'DUE SOON'
                            ? 'bg-error-container text-on-error-container hover:bg-error-container/85'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                        title="Click to edit status inline"
                      >
                        <option value="DUE SOON">DUE SOON</option>
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="MANUAL">MANUAL</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPayBill(bill.id);
                      }}
                      className="p-1 px-1.5 bg-secondary-container hover:bg-secondary/25 rounded-lg text-secondary border border-secondary/15 transition-colors cursor-pointer text-[10px] font-bold shrink-0 flex items-center gap-1"
                      title="Settle/Pay and register transaction"
                    >
                      <CheckCircle className="w-3 h-3 text-secondary" />
                      <span>Settle</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wealth Advisor Card */}
          <div className="bg-primary-container rounded-2xl p-6 text-white relative overflow-hidden shadow-md group border border-outline-variant/10">
            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 bg-secondary rounded-lg">
                    <Sparkles className="w-4 h-4 text-secondary-container" />
                  </span>
                  <h5 className="font-sans font-semibold text-white">Wealth Advisor</h5>
                </div>
                <p className="text-xs text-on-primary-container leading-relaxed">
                  Based on your actual savings rate, you could retire 2 years earlier by increasing monthly contributions into HYS by 5%.
                </p>
              </div>
              <button 
                type="button"
                onClick={onAnalyze}
                className="w-full bg-secondary-container text-on-secondary-container font-semibold py-2 px-4 rounded-xl text-xs hover:brightness-105 active:scale-95 transition-all text-center cursor-pointer border border-secondary/10"
              >
                Analyze Strategy
              </button>
            </div>
            {/* Background icon decorative accent */}
            <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-15 transition-opacity">
              <Sparkles className="w-32 h-32" />
            </div>
          </div>

        </div>

        {/* Recent Transactions Column */}
        <div className="lg:col-span-8 bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
            <h4 className="font-sans font-semibold text-primary">Recent Transactions</h4>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => onNavigateToTab(1)} // ledger
                className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                View Ledger
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant border-b border-outline-variant">Transaction</th>
                  <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant border-b border-outline-variant">Category</th>
                  <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant border-b border-outline-variant">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant border-b border-outline-variant text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {recentTransactions.map((tx) => {
                  const theme = getCategoryTheme(tx.category);
                  const IconComp = theme.icon;
                  const isExpense = tx.amount < 0;

                  return (
                    <tr 
                      key={tx.id}
                      onClick={() => onNavigateToTab(1)}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center text-primary shrink-0`}>
                            <IconComp className={`w-5 h-5 ${theme.text}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-primary text-sm truncate">{tx.title}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">{tx.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 bg-surface-container-high rounded-full text-xs font-semibold text-primary text-label-sm">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono tabular-nums font-bold text-sm whitespace-nowrap ${
                        isExpense ? 'text-primary' : 'text-secondary'
                      }`}>
                        {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount, selectedCurrency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-outline-variant bg-surface-bright text-center">
            <button 
              type="button"
              onClick={() => onNavigateToTab(1)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              View All Transactions
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
