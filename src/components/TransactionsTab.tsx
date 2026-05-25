import React, { useState } from 'react';
import { 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  HelpCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FilterX
} from 'lucide-react';
import { Transaction, LinkedAccount, CurrencyConfig, formatMoney } from '../types';

interface TransactionsTabProps {
  transactions: Transaction[];
  accounts: LinkedAccount[];
  categories: string[];
  onDeleteTransaction: (id: string) => void;
  onAddTransactionClick: () => void;
  selectedCurrency: CurrencyConfig;
}

export default function TransactionsTab({
  transactions,
  accounts,
  categories,
  onDeleteTransaction,
  onAddTransactionClick,
  selectedCurrency
}: TransactionsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDateRange, setSelectedDateRange] = useState('All Time');
  const [selectedAccount, setSelectedAccount] = useState('All Accounts');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting columns
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Multi-account and multi-category data pools
  const accountOptions = ['All Accounts', ...Array.from(new Set(accounts.map((a) => a.name)))];
  const categoryOptions = ['All Categories', ...categories];

  // Apply filters
  const filteredTransactions = transactions.filter((tx) => {
    // Search filter
    const searchMatch = tx.title.toLowerCase().includes(search.toLowerCase()) || 
                        tx.description.toLowerCase().includes(search.toLowerCase());
    
    // Category filter
    const categoryMatch = selectedCategory === 'All Categories' || tx.category === selectedCategory;

    // Account filter
    const accountMatch = selectedAccount === 'All Accounts' || tx.account === selectedAccount;

    // Date filters (simplified comparison for demo mockups)
    let dateMatch = true;
    if (selectedDateRange !== 'All Time') {
      const txDate = new Date(tx.date);
      const today = new Date('2023-11-01'); // Assume base snapshot month is late 2023
      
      if (selectedDateRange === 'Last 30 Days') {
        const diffTime = Math.abs(today.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        dateMatch = diffDays <= 30;
      } else if (selectedDateRange === 'Last Quarter') {
        const diffTime = Math.abs(today.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        dateMatch = diffDays <= 90;
      } else if (selectedDateRange === 'This Year') {
        dateMatch = txDate.getFullYear() === 2023;
      }
    }

    return searchMatch && categoryMatch && accountMatch && dateMatch;
  });

  // Apply Sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortKey === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      return sortDirection === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    }
  });

  // Pagination logic
  const totalItems = sortedTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Dynamically compute ledger statistics of filtered transactions!
  const totalIncome = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalSpending = Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  const netBalance = totalIncome - totalSpending;
  const savingsRate = totalIncome > 0 ? ((netBalance) / totalIncome) * 100 : 0;

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ['Date', 'Payee', 'Description', 'Category', 'Account', 'Amount'];
    const rows = sortedTransactions.map(tx => [
      tx.date,
      `"${tx.title.replace(/"/g, '""')}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.category,
      tx.account,
      tx.amount
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `budgetflow_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('All Categories');
    setSelectedDateRange('All Time');
    setSelectedAccount('All Accounts');
    setCurrentPage(1);
  };

  const toggleSort = (key: 'date' | 'amount') => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans text-primary tracking-tight">Transactions Ledger</h2>
          <p className="text-sm text-on-surface-variant">Review and manage your financial activity across all accounts.</p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 border border-outline text-primary font-semibold text-xs rounded-xl flex items-center gap-2 hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            type="button"
            onClick={onAddTransactionClick}
            className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters Bar panel */}
      <div className="bg-white border border-outline-variant rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search payee, ID, context..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
          />
        </div>

        {/* Category selections */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="appearance-none bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-on-surface cursor-pointer focus:ring-2 focus:ring-primary/25"
          >
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* Date Ranges */}
        <div className="relative">
          <select
            value={selectedDateRange}
            onChange={(e) => { setSelectedDateRange(e.target.value); setCurrentPage(1); }}
            className="appearance-none bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-on-surface cursor-pointer focus:ring-2 focus:ring-primary/25"
          >
            <option>All Time</option>
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>This Year</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* Accounts filter */}
        <div className="relative">
          <select
            value={selectedAccount}
            onChange={(e) => { setSelectedAccount(e.target.value); setCurrentPage(1); }}
            className="appearance-none bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-on-surface cursor-pointer focus:ring-2 focus:ring-primary/25"
          >
            {accountOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
            <ChevronDown className="w-4 h-4 text-xs" />
          </div>
        </div>

        {/* Clear filter */}
        {(search || selectedCategory !== 'All Categories' || selectedDateRange !== 'All Time' || selectedAccount !== 'All Accounts') && (
          <button 
            type="button"
            onClick={handleClearFilters}
            className="text-primary font-semibold text-xs hover:underline cursor-pointer flex items-center gap-1 ml-auto"
          >
            <FilterX className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Ledger Table Section */}
      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                <th 
                  onClick={() => toggleSort('date')}
                  className="px-6 py-4 text-xs font-semibold text-on-surface-variant cursor-pointer hover:text-primary transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    Date 
                    {sortKey === 'date' && (
                      sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronUp className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant">Account</th>
                <th 
                  onClick={() => toggleSort('amount')}
                  className="px-6 py-4 text-xs font-semibold text-on-surface-variant text-right cursor-pointer hover:text-primary transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {sortKey === 'amount' && (
                      sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronUp className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-outline-variant/60">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium text-xs">
                    No transactions matched your current filters. Clear filters or add a new transaction.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isExpense = tx.amount < 0;

                  return (
                    <tr key={tx.id} className="hover:bg-surface-container-low/60 transition-colors group">
                      <td className="px-6 py-4 text-xs text-on-surface font-semibold whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">{tx.title}</span>
                          <span className="text-[10px] text-on-surface-variant opacity-85 leading-relaxed">{tx.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          tx.category.toLowerCase() === 'salary' || tx.category.toLowerCase() === 'income'
                            ? 'bg-secondary-container/20 text-on-secondary-container border-secondary/20'
                            : 'bg-surface-container-high text-on-surface-variant border-outline-variant/50'
                        }`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant font-medium whitespace-nowrap">
                        {tx.account}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono tabular-nums font-bold text-sm whitespace-nowrap ${
                        isExpense ? 'text-primary' : 'text-secondary font-bold'
                      }`}>
                        {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount, selectedCurrency)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button 
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 px-2 hover:bg-error-container text-on-surface-variant hover:text-error rounded-lg transition-colors cursor-pointer group-hover:opacity-100 opacity-65 flex items-center gap-1 ml-auto"
                          title="Delete transaction entry"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline text-[10px] font-bold">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalItems > 0 && (
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant bg-surface-container-lowest gap-4">
            <p className="text-xs text-on-surface-variant font-medium">
              Showing <span className="font-bold">{startIndex + 1}-{Math.min(totalItems, startIndex + itemsPerPage)}</span> of <span className="font-bold">{totalItems}</span> results
            </p>
            
            <div className="flex gap-1">
              <button 
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3 py-1 bg-white border border-outline-variant hover:bg-surface-container-low text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePageChange(idx + 1)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    currentPage === idx + 1
                      ? 'bg-primary text-white font-sans'
                      : 'bg-white border border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button 
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-3 py-1 bg-white border border-outline-variant hover:bg-surface-container-low text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats Summary Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Income Card */}
        <div className="p-6 bg-white border border-outline-variant rounded-2xl shadow-sm">
          <span className="text-xs text-outline uppercase tracking-wider font-semibold">Total Income</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-sans text-secondary tabular-nums">
              +{formatMoney(totalIncome, selectedCurrency)}
            </span>
          </div>
          <p className="mt-2 text-xs text-secondary font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +12.5% vs last month
          </p>
        </div>

        {/* Spending Card */}
        <div className="p-6 bg-white border border-outline-variant rounded-2xl shadow-sm">
          <span className="text-xs text-outline uppercase tracking-wider font-semibold">Total Spending</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-sans text-primary tabular-nums">
              -{formatMoney(totalSpending, selectedCurrency)}
            </span>
          </div>
          <p className="mt-2 text-xs text-on-surface-variant font-medium flex items-center gap-1 opacity-80">
            <TrendingDown className="w-3.5 h-3.5" /> -4.2% vs last month
          </p>
        </div>

        {/* Net Balance Card */}
        <div className="md:col-span-2 p-6 bg-primary-container text-white rounded-2xl border border-outline-variant/10 shadow-md relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-xs text-primary-fixed-dim uppercase tracking-wider font-semibold">Net Balance</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold font-sans tracking-tight text-white tabular-nums">
                {netBalance >= 0 ? '+' : ''}{formatMoney(netBalance, selectedCurrency)}
              </span>
            </div>
            <p className="mt-3 text-xs opacity-90 leading-relaxed font-medium">
              {savingsRate > 0 
                ? `You've saved ${savingsRate.toFixed(0)}% of your income within this database filter. Great job!`
                : `Active outlays exceed deposits in this interval filter by ${formatMoney(Math.abs(netBalance), selectedCurrency)}.`}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
