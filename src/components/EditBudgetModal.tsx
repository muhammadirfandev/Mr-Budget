import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { BudgetCategory, CurrencyConfig } from '../types';

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: BudgetCategory[];
  onUpdate: (updatedBudgets: BudgetCategory[]) => void;
  selectedCurrency: CurrencyConfig;
}

export default function EditBudgetModal({ isOpen, onClose, budgets, onUpdate, selectedCurrency }: EditBudgetModalProps) {
  // Let's copy initial budget values to local edits
  const [editedBudgets, setEditedBudgets] = useState<BudgetCategory[]>([]);

  // Initialize values when modal opens
  React.useEffect(() => {
    if (isOpen) {
      // Convert budget limits to current currency for user-friendly editing
      const converted = budgets.map((b) => ({
        ...b,
        limitSpent: b.limitSpent * selectedCurrency.rate,
      }));
      setEditedBudgets(converted);
    }
  }, [isOpen, budgets, selectedCurrency]);

  if (!isOpen) return null;

  const handleLimitChange = (id: string, value: string) => {
    const num = parseFloat(value);
    setEditedBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, limitSpent: isNaN(num) ? 0 : num } : b))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Re-convert back to USD base on save
    const usdBudgets = editedBudgets.map((b) => ({
      ...b,
      limitSpent: b.limitSpent / selectedCurrency.rate,
    }));
    onUpdate(usdBudgets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-background">
          <div>
            <h3 className="font-sans font-semibold text-lg text-primary text-headline-md">Edit Monthly Budget</h3>
            <p className="text-xs text-on-surface-variant">Adjust your limits for the upcoming cycle ({selectedCurrency.code})</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Lists */}
        <form onSubmit={handleSave}>
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {editedBudgets.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-primary truncate">{b.name}</span>
                  <span className="text-[10px] text-on-surface-variant bg-surface-container-low border px-2 py-0.5 rounded-full capitalize">
                    {b.type}
                  </span>
                </div>
                
                <div className="relative w-40 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-semibold">{selectedCurrency.symbol.trim()}</span>
                  <input
                    type="number"
                    step={selectedCurrency.code === 'BHD' ? '0.1' : '5'}
                    required
                    value={b.limitSpent ? parseFloat(b.limitSpent.toFixed(selectedCurrency.code === 'BHD' ? 3 : 2)) : ''}
                    onChange={(e) => handleLimitChange(b.id, e.target.value)}
                    className="w-full pl-12 pr-3 py-1.5 border border-outline rounded-lg text-right focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm font-mono font-semibold"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-outline-variant flex justify-end gap-2 bg-background p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Update Limits
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
