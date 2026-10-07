import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { 
  getTodayExpenses, 
  getThisWeekExpenses, 
  getThisMonthExpenses, 
  getTotalIncome, 
  getTotalExpenses,
  formatDateDDMMYYYY,
  groupTransactionsByDate 
} from '../utils/calculations';
import AddEditTransactionModal from './AddEditTransactionModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight,
  Trash2,
  Edit2,
  Inbox,
  AlertTriangle,
  Tag,
  Target,
  Smartphone,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { 
    accounts, 
    filteredTransactions, 
    totalBalance, 
    deleteTransaction,
    selectedAccountId,
    settings 
  } = useFinance();

  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [txnToEdit, setTxnToEdit] = useState(null);
  const [deleteTxnId, setDeleteTxnId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Summary Metrics calculated dynamically
  const todayExpenses = getTodayExpenses(filteredTransactions);
  const weekExpenses = getThisWeekExpenses(filteredTransactions);
  const monthExpenses = getThisMonthExpenses(filteredTransactions);
  const totalIncome = getTotalIncome(filteredTransactions);
  const totalExpenses = getTotalExpenses(filteredTransactions);

  // Monthly Budget Calculations
  const monthlyBudget = settings?.monthlyBudget || 20000;
  const budgetPercentage = Math.min(Math.round((monthExpenses / monthlyBudget) * 100), 100);
  const isBudgetWarning = budgetPercentage >= 80;

  const autoDetectedCount = filteredTransactions.filter(t => t.source === 'SMS').length;

  const activeAccountName = selectedAccountId === 'ALL' 
    ? 'All Accounts' 
    : (accounts.find(a => a.id === selectedAccountId)?.name || 'Account');

  // Sort transactions by date and time descending (most recent first, including Income & Expense)
  const sortedRecentTransactions = React.useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
      const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
      return dateB - dateA;
    });
  }, [filteredTransactions]);

  const handleDeleteConfirm = async () => {
    if (deleteTxnId) {
      await deleteTransaction(deleteTxnId);
      setToastMessage('Transaction deleted successfully.');
      setDeleteTxnId(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 rounded-3xl shadow-xl border border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Financial Overview</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-0.5">{activeAccountName}</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time local data summary</p>
        </div>

        <div className="flex items-center space-x-2">
          {autoDetectedCount > 0 && (
            <button
              onClick={() => navigate('/transactions')}
              className="px-3.5 py-2.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/50 font-semibold text-xs rounded-2xl flex items-center space-x-1.5 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>{autoDetectedCount} SMS Auto</span>
            </button>
          )}

          <button
            onClick={() => {
              setTxnToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs md:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Monthly Budget Spending Alert (if >= 80%) */}
      {isBudgetWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold">Monthly Budget Warning ({budgetPercentage}% used)</h3>
              <p className="text-[11px] text-amber-700">
                You have spent ₹{monthExpenses.toLocaleString('en-IN')} out of your ₹{monthlyBudget.toLocaleString('en-IN')} monthly limit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Balance */}
        <div className="col-span-2 lg:col-span-1 p-5 md:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Balance</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Opening balance ± net transactions</p>
          </div>
        </div>

        {/* Monthly Budget Progress Card */}
        <div className="col-span-2 lg:col-span-1 p-5 md:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Budget</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>₹{monthExpenses.toLocaleString('en-IN')}</span>
              <span className="text-slate-400">/ ₹{monthlyBudget.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  budgetPercentage >= 90 ? 'bg-rose-500' : budgetPercentage >= 75 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${budgetPercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{budgetPercentage}% of monthly limit used</p>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg md:text-2xl font-bold text-slate-900">
              ₹{todayExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">Spent today</span>
          </div>
        </div>

        {/* Total Income & Expenses comparison */}
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Income vs Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Income:</span>
              <span className="font-bold text-emerald-600">₹{totalIncome.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Expenses:</span>
              <span className="font-bold text-rose-600">₹{totalExpenses.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/categories')}
              className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors flex items-center space-x-1.5 text-xs font-semibold"
              title="View & Manage Categories"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Categories</span>
            </button>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Latest activity in {activeAccountName}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View All →
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">No transactions yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Add your first transaction or enable Automatic SMS detection to start tracking your income and spending.
            </p>
            <button
              onClick={() => {
                setTxnToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedRecentTransactions.slice(0, 5).map(txn => {
              const isIncome = txn.type === 'Income';

              return (
                <div key={txn.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/50 px-2 rounded-2xl transition-colors gap-2">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    }`}>
                      {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 truncate">
                        <span className="truncate max-w-[110px] sm:max-w-[200px]">{txn.description || txn.category}</span>
                        {txn.source === 'SMS' && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-100 dark:border-indigo-800 inline-flex items-center space-x-0.5 flex-shrink-0">
                            <Smartphone className="w-2.5 h-2.5" />
                            <span>SMS</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{txn.category}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/60 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300 flex-shrink-0">
                          {txn.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="text-right">
                      <div className={`text-xs md:text-sm font-extrabold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {isIncome ? '+' : '-'}₹{parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateDDMMYYYY(txn.date)} {txn.time ? `• ${txn.time}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center space-x-0.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          setTxnToEdit(txn);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTxnId(txn.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Toast Feedback */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

