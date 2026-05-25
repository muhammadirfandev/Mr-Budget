import React, { useState } from 'react';
import { 
  Edit2, 
  FileText, 
  TrendingUp, 
  Home, 
  ShoppingCart, 
  Film, 
  Utensils, 
  Compass, 
  Sliders, 
  Sparkles,
  Plus,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { BudgetCategory, CurrencyConfig, formatMoney } from '../types';

interface BudgetTabProps {
  budgets: BudgetCategory[];
  onEditBudgetClick: () => void;
  onAddCategory: (category: Omit<BudgetCategory, 'id' | 'currentSpent'>) => void;
  onOpenAdvisor: () => void;
  selectedCurrency: CurrencyConfig;
}

export default function BudgetTab({ budgets, onEditBudgetClick, onAddCategory, onOpenAdvisor, selectedCurrency }: BudgetTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatType, setNewCatType] = useState('Variable Weekly');
  const [newCatIcon, setNewCatIcon] = useState('Compass');

  // Dynamically compute global sums
  const totalAllocated = budgets.reduce((sum, b) => sum + b.limitSpent, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.currentSpent, 0);
  const remainingBudget = totalAllocated - totalSpent;
  const spentRatio = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatLimit) return;

    const numLimit = parseFloat(newCatLimit);
    if (isNaN(numLimit)) return;

    // Convert input (which is in selected currency) to USD base
    const usdLimit = numLimit / selectedCurrency.rate;

    onAddCategory({
      name: newCatName,
      limitSpent: usdLimit,
      type: newCatType,
      iconName: newCatIcon
    });

    // Reset Form
    setNewCatName('');
    setNewCatLimit('');
    setNewCatType('Variable Weekly');
    setNewCatIcon('Compass');
    setShowAddForm(false);
  };

  // Helper to map icon names to actual Lucide component
  const getBudgetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home;
      case 'ShoppingCart': return ShoppingCart;
      case 'Film': return Film;
      case 'Utensils': return Utensils;
      default: return Compass;
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans text-primary tracking-tight">Monthly Budget</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-outline">Manage and allocate your funds for October 2023</p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={onEditBudgetClick}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-xl font-semibold text-xs hover:bg-surface-container-low transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            Edit Budget
          </button>
          <button 
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-xs hover:opacity-90 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </section>

      {/* Stats Overview Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Total Allocated Card */}
        <div className="md:col-span-4 p-6 bg-white border border-outline-variant rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Allocated</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-sans tracking-tight text-primary tabular-nums">
              {formatMoney(totalAllocated, selectedCurrency)}
            </span>
            <span className="text-xs font-semibold text-secondary">+5% vs last month</span>
          </div>
          <div className="mt-4 h-2 w-full bg-surface-container rounded-full overflow-hidden border">
            <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${Math.min(100, spentRatio)}%` }}></div>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="md:col-span-4 p-6 bg-white border border-outline-variant rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Spent</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-sans tracking-tight text-primary tabular-nums">
              {formatMoney(totalSpent, selectedCurrency)}
            </span>
            <span className="text-xs text-on-surface-variant font-medium">{spentRatio.toFixed(0)}% of budget</span>
          </div>
          <div className="mt-4 h-2 w-full bg-surface-container rounded-full overflow-hidden border">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, spentRatio)}%` }}></div>
          </div>
        </div>

        {/* Remaining Balance Card */}
        <div className="md:col-span-4 p-6 bg-primary-container text-white rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-primary-fixed uppercase tracking-wider">Remaining Balance</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-sans tracking-tight text-white tabular-nums">
                {formatMoney(remainingBudget, selectedCurrency)}
              </span>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-secondary-container flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-secondary-container" />
            On track for savings goal
          </p>
        </div>

      </section>

      {/* Budget Categories breakdown */}
      <section className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-semibold text-primary text-base">Category Breakdown</h3>
          <div className="flex items-center gap-1 text-on-surface-variant text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5 text-outline" /> Sort by: Progress
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs font-semibold border-b border-outline-variant">
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Progress</th>
                <th className="px-6 py-3 text-right">Spent</th>
                <th className="px-6 py-3 text-right">Limit</th>
                <th className="px-6 py-3 text-right">Remaining</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-outline-variant/60">
              {budgets.map((cat) => {
                const IconComponent = getBudgetIcon(cat.iconName);
                const spentPercentage = (cat.currentSpent / cat.limitSpent) * 100;
                const isOverBudget = cat.currentSpent > cat.limitSpent;
                const remaining = cat.limitSpent - cat.currentSpent;

                return (
                  <tr key={cat.id} className="hover:bg-surface-bright transition-all duration-150">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary border shrink-0">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm">{cat.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">{cat.type}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 w-1/4">
                      <div className="space-y-1 min-w-[120px]">
                        <div className="flex justify-between text-[11px] font-semibold text-on-surface">
                          <span>{spentPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden border">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverBudget ? 'bg-error' : 'bg-secondary'
                            }`} 
                            style={{ width: `${Math.min(100, spentPercentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right font-mono tabular-nums text-sm font-semibold text-primary">
                      {formatMoney(cat.currentSpent, selectedCurrency)}
                    </td>
                    
                    <td className="px-6 py-5 text-right font-mono tabular-nums text-sm text-on-surface-variant">
                      {formatMoney(cat.limitSpent, selectedCurrency)}
                    </td>
                    
                    <td className={`px-6 py-5 text-right font-mono tabular-nums text-sm font-bold ${
                      isOverBudget ? 'text-error' : 'text-secondary'
                    }`}>
                      {remaining >= 0 ? '' : '-'}{formatMoney(Math.abs(remaining), selectedCurrency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table inline form for "Add New Category" */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex flex-col items-center justify-center">
          {showAddForm ? (
            <form onSubmit={handleCreateCategory} className="w-full max-w-lg bg-white p-4 rounded-xl border border-outline-variant space-y-3 animate-in fade-in duration-200">
              <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Create New Budget Slot</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Travel, Insurance"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Monthly Peak Limit ({selectedCurrency.symbol.trim()})</label>
                  <input
                    type="number"
                    step="5"
                    required
                    placeholder="e.g. 250"
                    value={newCatLimit}
                    onChange={(e) => setNewCatLimit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Interval Type</label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline rounded-lg text-xs"
                  >
                    <option>Variable Weekly</option>
                    <option>Monthly Fixed</option>
                    <option>Discretionary</option>
                    <option>Semi-Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Visual Marker Icon</label>
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-full px-3 py-1.5 border border-outline rounded-lg text-xs"
                  >
                    <option value="Compass">Compass Accent (Default)</option>
                    <option value="Home">Home (Mortgage/Rent)</option>
                    <option value="ShoppingCart">Shopping Cart (Goods)</option>
                    <option value="Film">Film Marker (Entertainment)</option>
                    <option value="Utensils">Utensils (Dining)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-on-surface-variant hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Add Category
                </button>
              </div>

            </form>
          ) : (
            <button 
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Category
            </button>
          )}
        </div>
      </section>

      {/* Bottom info advertising section card */}
      <section className="relative rounded-2xl overflow-hidden min-h-[220px] flex items-center p-6 sm:p-8 bg-primary text-on-primary">
        <img 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none" 
          alt="Lush grow sprout" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNXUrZxBGb2WqSHnEPbPf1GMneWocS0F3hzc8dJQXc8JOnqK_rtkgX47pw-7TUbgp8iC6RuwV87Sz2FSQy6zzCFVZ4EJI09R1Ny_nrjA23TxfbdyAjx8XnCSH0p0vfSMSjUcvkqwbHb-eaLU0IaMQC8XX8o924J64qCFkfQZ6PSj7kxlyFKPdu-9fWoNGN1FyzeMd8H3daspusF5I4XL6E3qQiC6pxrrkKEwpYLDhWojt7SQHLBXzQGm7Zq2ppsoEfnQWY-CVWSlY"
        />
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-secondary-container rounded-lg text-primary text-headline-sm">
              <Sparkles className="w-4 h-4 text-secondary" />
            </span>
            <h4 className="font-bold text-lg text-white font-sans leading-none tracking-tight">Smart Savings Insights</h4>
          </div>
          <p className="text-sm text-primary-fixed-dim leading-relaxed">
            Based on your recurring outlays in Entertainment, you could save up to $150 more this month by unifying your individual subscription slots into single family circles.
          </p>
          <button 
            type="button"
            onClick={onOpenAdvisor}
            className="bg-secondary text-white px-5 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm"
          >
            View Recommendations
          </button>
        </div>
      </section>

    </div>
  );
}
