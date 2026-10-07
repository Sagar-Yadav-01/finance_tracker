import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { filterTransactions, formatDateDDMMYYYY, groupTransactionsByDate } from '../utils/calculations';
import AddEditTransactionModal from './AddEditTransactionModal';
import PaymentMethodFilter from '../components/PaymentMethodFilter';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

import { 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit2, 
  Trash2, 
  ArrowUpDown,
  Inbox,
  Smartphone,
  Sparkles,
  Filter,
  Calculator,
  Calendar
} from 'lucide-react';

export default function TransactionsPage() {
  const { 
    transactions, 
    accounts, 
    categories, 
    deleteTransaction,
    selectedAccountId 
  } = useFinance();

  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL' | 'SMS' | 'MANUAL'
  const [sortField, setSortField] = useState('date'); // 'date' | 'amount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [txnToEdit, setTxnToEdit] = useState(null);
  const [deleteTxnId, setDeleteTxnId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Handle URL category query param (e.g. /transactions?category=Food)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category');
    if (catParam) {
      setCategoryFilter(catParam);
    }
  }, [location.search]);

  // Process filtered and sorted transactions
  const displayedTransactions = useMemo(() => {
    let filtered = filterTransactions(transactions, {
      selectedAccountId,
      type: typeFilter,
      category: categoryFilter,
      searchQuery,
      startDate,
      endDate
    });

    if (sourceFilter === 'SMS') {
      filtered = filtered.filter(t => t.source === 'SMS');
    } else if (sourceFilter === 'MANUAL') {
      filtered = filtered.filter(t => t.source !== 'SMS');
    }

    return filtered.sort((a, b) => {
      if (sortField === 'amount') {
        const amtA = parseFloat(a.amount);
        const amtB = parseFloat(b.amount);
        return sortOrder === 'desc' ? amtB - amtA : amtA - amtB;
      } else {
        const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
        const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }
    });
  }, [transactions, selectedAccountId, typeFilter, categoryFilter, sourceFilter, searchQuery, startDate, endDate, sortField, sortOrder]);

  const autoDetectedCount = useMemo(() => {
    return transactions.filter(t => t.source === 'SMS').length;
  }, [transactions]);

  // Summary calculation for currently filtered transactions
  const filteredSummary = useMemo(() => {
    let totalInc = 0;
    let totalExp = 0;

    displayedTransactions.forEach(t => {
      const val = parseFloat(t.amount) || 0;
      if (t.type === 'Income') {
        totalInc += val;
      } else {
        totalExp += val;
      }
    });

    const net = totalInc - totalExp;
    return {
      income: totalInc,
      expense: totalExp,
      net,
      count: displayedTransactions.length
    };
  }, [displayedTransactions]);

  const handleDeleteConfirm = async () => {
    if (deleteTxnId) {
      await deleteTransaction(deleteTxnId);
      setToastMessage('Transaction deleted successfully.');
      setDeleteTxnId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Transaction History</h1>
            {autoDetectedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 flex items-center space-x-1">
                <Smartphone className="w-3 h-3 text-indigo-600" />
                <span>{autoDetectedCount} SMS Auto</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Manage, review, and edit your finance transactions</p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setSourceFilter(prev => prev === 'SMS' ? 'ALL' : 'SMS')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
              sourceFilter === 'SMS' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto Detected {autoDetectedCount > 0 ? `(${autoDetectedCount})` : ''}</span>
          </button>

          <button
            onClick={() => {
              setTxnToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Controls */}
      <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative col-span-1 md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchant, description, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Payment Method Filter Component */}
          <div className="flex items-center justify-start md:justify-end">
            <PaymentMethodFilter />
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Types</option>
            <option value="Expense">Expense Only</option>
            <option value="Income">Income Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Sources</option>
            <option value="SMS">SMS Detected Only</option>
            <option value="MANUAL">Manual Only</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-medium flex items-center space-x-1 ml-auto"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort ({sortOrder.toUpperCase()})</span>
          </button>
        </div>
      </div>

      {/* Filtered Net / Total Summary Header */}
      <div className="bg-slate-900 text-white p-4 px-6 rounded-3xl shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {typeFilter === 'Expense' ? 'Filtered Total Expenses' : typeFilter === 'Income' ? 'Filtered Total Income' : 'Filtered Net Total'}
            </h3>
            <p className="text-[11px] text-slate-300 font-medium">
              Showing {filteredSummary.count} transactions {categoryFilter !== 'ALL' ? `(${categoryFilter})` : ''}
            </p>
          </div>
        </div>

        <div className="text-right">
          {typeFilter === 'Expense' && (
            <span className="text-lg md:text-xl font-extrabold text-rose-400">
              -₹{filteredSummary.expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          )}
          {typeFilter === 'Income' && (
            <span className="text-lg md:text-xl font-extrabold text-emerald-400">
              +₹{filteredSummary.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          )}
          {typeFilter === 'ALL' && (
            <span className={`text-lg md:text-xl font-extrabold ${filteredSummary.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {filteredSummary.net >= 0 ? '+' : '-'}₹{Math.abs(filteredSummary.net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      {/* Transactions Container (Responsive Card List on Mobile, Table on Desktop) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {displayedTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No matching transactions</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {sourceFilter === 'SMS' ? 'No auto-detected SMS transactions found yet.' : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div>
            {/* MOBILE COMPACT CARDS VIEW (block md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {displayedTransactions.map(txn => {
                const isIncome = txn.type === 'Income';
                const account = accounts.find(a => a.id === txn.accountId);

                return (
                  <div key={txn.id} className="p-4 flex flex-col space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                        }`}>
                          {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                            <span className="truncate max-w-[170px]">{txn.description || txn.category}</span>
                            {txn.source === 'SMS' && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-100 dark:border-indigo-800 inline-flex items-center space-x-0.5" title="Auto-detected from SMS">
                                <Smartphone className="w-2.5 h-2.5" />
                                <span>SMS</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {txn.category} • {txn.paymentMethod}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-extrabold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {isIncome ? '+' : '-'}₹{parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDateDDMMYYYY(txn.date)} {txn.time ? `• ${txn.time}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800/60">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{account?.name || 'Account'}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setTxnToEdit(txn);
                            setIsAddModalOpen(true);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTxnId(txn.id)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/40 hover:text-rose-600 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP ROW VIEW (hidden md:block) */}
            <div className="hidden md:block divide-y divide-slate-100 dark:divide-slate-800">
              {displayedTransactions.map(txn => {
                const isIncome = txn.type === 'Income';
                const account = accounts.find(a => a.id === txn.accountId);

                return (
                  <div key={txn.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        {isIncome ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                          <span>{txn.description || txn.category}</span>
                          {txn.source === 'SMS' && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-100 dark:border-indigo-800 inline-flex items-center space-x-1" title="Auto-detected from SMS">
                              <Smartphone className="w-3 h-3 text-indigo-600" />
                              <span>SMS Detected</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{txn.category}</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-medium text-slate-600 dark:text-slate-300">
                            {txn.paymentMethod}
                          </span>
                          <span>•</span>
                          <span>{account?.name || 'Account'}</span>
                          <span>•</span>
                          <span>{formatDateDDMMYYYY(txn.date)} {txn.time ? `• ${txn.time}` : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-base font-extrabold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {isIncome ? '+' : '-'}₹{parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setTxnToEdit(txn);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTxnId(txn.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={() => {
          setTxnToEdit(null);
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-20 right-4 md:hidden z-30 flex items-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-600/40 font-semibold text-xs transition-transform active:scale-95"
      >
        <Plus className="w-4 h-4" />
        <span>Add Transaction</span>
      </button>

      {/* Add / Edit Transaction Modal */}
      <AddEditTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTxnToEdit(null);
        }}
        transactionToEdit={txnToEdit}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTxnId}
        onClose={() => setDeleteTxnId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />

      {/* Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

