import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { calculateAccountBalance } from '../utils/calculations';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

import { 
  Wallet, 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  X,
  CreditCard,
  Inbox,
  ArrowRight
} from 'lucide-react';

export default function AccountsPage() {
  const { accounts, transactions, addAccount, updateAccount, deleteAccount, setSelectedAccountId } = useFinance();
  const navigate = useNavigate();

  const handleViewAccountTransactions = (accId, e) => {
    if (e) e.stopPropagation();
    setSelectedAccountId(accId);
    navigate('/transactions');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);

  // Modal Form State
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [openingBalance, setOpeningBalance] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteAccId, setDeleteAccId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const openAddModal = () => {
    setAccountToEdit(null);
    setName('');
    setBankName('');
    setAccountType('Savings');
    setOpeningBalance('');
    setLastFourDigits('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (acc) => {
    setAccountToEdit(acc);
    setName(acc.name);
    setBankName(acc.bankName || acc.name);
    setAccountType(acc.accountType || 'Savings');
    setOpeningBalance(acc.openingBalance);
    setLastFourDigits(acc.lastFourDigits || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Account name is required.');
      return;
    }

    const parsedOpening = parseFloat(openingBalance);
    if (isNaN(parsedOpening)) {
      setError('Opening balance must be a valid number.');
      return;
    }

    setSubmitting(true);
    try {
      if (accountToEdit) {
        await updateAccount({
          ...accountToEdit,
          name: name.trim(),
          bankName: bankName.trim() || name.trim(),
          accountType,
          openingBalance: parsedOpening,
          lastFourDigits: lastFourDigits.slice(-4)
        });
        setToastMessage('Account updated successfully.');
      } else {
        await addAccount({
          name: name.trim(),
          bankName: bankName.trim() || name.trim(),
          accountType,
          openingBalance: parsedOpening,
          lastFourDigits: lastFourDigits.slice(-4)
        });
        setToastMessage('Account created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteAccId) {
      try {
        await deleteAccount(deleteAccId);
        setToastMessage('Account removed successfully.');
      } catch (err) {
        alert(err.message);
      } finally {
        setDeleteAccId(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage bank accounts, cash, and balances</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs md:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bank Account</span>
        </button>
      </div>

      {/* Safety Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center space-x-3 text-indigo-950 text-xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <span>
          <strong>Privacy Note:</strong> Only enter basic account metadata (name, bank, opening balance). Never enter sensitive credentials, PINs, CVVs, or online passwords.
        </span>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const currentBalance = calculateAccountBalance(acc, transactions);
          const linkedCount = transactions.filter(t => t.accountId === acc.id).length;

          return (
            <div 
              key={acc.id}
              onClick={(e) => handleViewAccountTransactions(acc.id, e)}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all cursor-pointer hover:border-indigo-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      acc.isSystem ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {acc.isSystem ? <Wallet className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{acc.name}</h3>
                      <span className="text-xs text-slate-400 font-medium">{acc.bankName} • {acc.accountType}</span>
                    </div>
                  </div>

                  {!acc.isSystem && (
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(acc); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Account"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteAccId(acc.id); }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Balance</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Opening: ₹{parseFloat(acc.openingBalance).toLocaleString('en-IN')}</span>
                <button
                  onClick={(e) => handleViewAccountTransactions(acc.id, e)}
                  className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 hover:underline"
                >
                  <span>{linkedCount} transactions</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="font-bold text-slate-900 text-lg">
                {accountToEdit ? 'Edit Account' : 'Add Bank Account'}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HDFC Salary Account"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Salary">Salary</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Last 4 Digits (Optional)
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={lastFourDigits}
                  onChange={(e) => setLastFourDigits(e.target.value)}
                  placeholder="1234"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-2"
              >
                {submitting ? 'Saving...' : accountToEdit ? 'Save Changes' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Account Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteAccId}
        onClose={() => setDeleteAccId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Account"
        message="Are you sure you want to remove this account? This will check that no active transactions exist for this account before deletion."
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
