import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { categorizationEngine } from '../services/categorizationEngine';
import { X, DollarSign, Calendar, Clock, CreditCard, Tag, FileText, Plus, Sparkles } from 'lucide-react';

export default function AddEditTransactionModal({ isOpen, onClose, transactionToEdit = null }) {
  const { user } = useAuth();
  const { accounts, categories, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState('Expense');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'Expense');
      setAmount(transactionToEdit.amount || '');
      setPaymentMethod(transactionToEdit.paymentMethod || 'Bank');
      setAccountId(transactionToEdit.accountId || '');
      setCategory(transactionToEdit.category || 'Food');
      setDescription(transactionToEdit.description || '');
      setDate(transactionToEdit.date || new Date().toISOString().split('T')[0]);
      setTime(transactionToEdit.time || '');
    } else {
      // Default initialization
      setType('Expense');
      setAmount('');
      setPaymentMethod('UPI');
      // Set default account: prefers first non-cash account, or cash account
      const firstBank = accounts.find(a => !a.isSystem);
      setAccountId(firstBank ? firstBank.id : (accounts[0]?.id || 'acc_cash'));
      setCategory('Food');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }
    setError('');
  }, [transactionToEdit, isOpen, accounts]);

  // Handle Cash payment method selection auto-mapping
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'Cash') {
      const cashAcc = accounts.find(a => a.isSystem || a.name.toLowerCase() === 'cash');
      if (cashAcc) setAccountId(cashAcc.id);
    }
  };

  // Auto categorization suggestion on description change
  const handleDescriptionChange = (text) => {
    setDescription(text);
    if (!transactionToEdit && text.length > 2) {
      const suggested = categorizationEngine.suggestCategory(text);
      if (suggested && suggested !== 'Other') {
        const found = categories.find(c => c.name.toLowerCase() === suggested.toLowerCase());
        if (found) setCategory(found.name);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number greater than zero.');
      return;
    }

    if (!accountId) {
      setError('Please select an account.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: parsedAmount,
        type,
        paymentMethod,
        accountId,
        category,
        description: description.trim(),
        date,
        time
      };

      if (description.trim()) {
        categorizationEngine.learnUserRule(user?.id, description.trim(), category);
      }

      if (transactionToEdit) {
        await updateTransaction({ ...transactionToEdit, ...payload });
      } else {
        await addTransaction(payload);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span>{transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
              {error}
            </div>
          )}

          {/* Type Toggle: Expense / Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('Expense')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                type === 'Expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('Income')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                type === 'Income'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Description & Auto-Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Description / Merchant</span>
              <span className="text-[10px] text-indigo-500 font-normal flex items-center">
                <Sparkles className="w-3 h-3 mr-1" /> Auto-categorize
              </span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="e.g. Swiggy Lunch, Grocery, Salary"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Payment Method & Account Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                <option value="UPI">UPI</option>
                <option value="Bank">Bank Transfer / Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Financial Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bankName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Dropdown & Quick Selection Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            
            {/* Quick Category Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Salary'].map(catName => (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setCategory(catName)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all border ${
                    category === catName
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {catName}
                </button>
              ))}
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-4 font-semibold text-sm rounded-xl text-white shadow-lg transition-all ${
                type === 'Expense' 
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {submitting ? 'Saving...' : transactionToEdit ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
