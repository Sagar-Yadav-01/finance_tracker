import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  getCategoryBreakdown, 
  getPaymentMethodBreakdown, 
  getAccountWiseSpending, 
  getWeeklySpendingChart, 
  getDailySpendingChart,
  getMonthlySpendingChart,
  getMonthlyComparison 
} from '../utils/calculations';

import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

import { PieChart as PieIcon, BarChart3, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'];

export default function AnalyticsPage() {
  const { filteredTransactions, accounts } = useFinance();
  const [timeframe, setTimeframe] = useState('WEEKLY'); // 'DAILY' | 'WEEKLY' | 'MONTHLY'

  const categoryData = getCategoryBreakdown(filteredTransactions);
  const paymentMethodData = getPaymentMethodBreakdown(filteredTransactions);
  const accountSpendingData = getAccountWiseSpending(filteredTransactions, accounts);
  const monthlyComparison = getMonthlyComparison(filteredTransactions);

  // Timeframe chart data
  let trendData = [];
  let trendXKey = 'day';
  let trendTitle = 'Spending Trend';

  if (timeframe === 'DAILY') {
    trendData = getDailySpendingChart(filteredTransactions);
    trendXKey = 'label';
    trendTitle = 'Daily Time-of-Day Spending';
  } else if (timeframe === 'MONTHLY') {
    trendData = getMonthlySpendingChart(filteredTransactions);
    trendXKey = 'month';
    trendTitle = 'Annual Monthly Spending Trend';
  } else {
    trendData = getWeeklySpendingChart(filteredTransactions);
    trendXKey = 'day';
    trendTitle = 'Weekly Spending Trend (Mon - Sun)';
  }

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const incomeVsExpenseData = [
    { name: 'Income', amount: totalIncome },
    { name: 'Expense', amount: totalExpense }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Interactive breakdown of spending trends, categories, and payment channels</p>
        </div>

        {/* Timeframe Toggle Tabs */}
        <div className="flex items-center space-x-1 bg-slate-200/70 p-1.5 rounded-2xl self-start sm:self-auto border border-slate-300/60">
          <button
            onClick={() => setTimeframe('DAILY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'DAILY'
                ? 'bg-white text-indigo-600 shadow-md shadow-indigo-600/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeframe('WEEKLY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'WEEKLY'
                ? 'bg-white text-indigo-600 shadow-md shadow-indigo-600/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('MONTHLY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'MONTHLY'
                ? 'bg-white text-indigo-600 shadow-md shadow-indigo-600/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Monthly Stat Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Month Expense</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{monthlyComparison.currentMonthExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            vs Previous Month: ₹{monthlyComparison.prevMonthExpenses.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Month-over-Month Change</span>
          <div className={`text-2xl font-extrabold mt-2 flex items-center ${
            monthlyComparison.diff > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {monthlyComparison.diff > 0 ? <ArrowUpRight className="w-6 h-6 mr-1" /> : <ArrowDownRight className="w-6 h-6 mr-1" />}
            {monthlyComparison.pctChange}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {monthlyComparison.diff > 0 ? 'Increased spending' : 'Decreased or equal spending'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Flow</span>
          <div className={`text-2xl font-extrabold mt-2 ${
            totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            ₹{(totalIncome - totalExpense).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">Income minus Expenses</p>
        </div>
      </div>

      {/* Grid of Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Timeframe Dynamic Expense Trend Line/Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <TrendingUp className="w-5 h-5 text-indigo-600 mr-2" />
              {trendTitle}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {timeframe}
            </span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {timeframe === 'DAILY' ? (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={trendXKey} stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip formatter={(val) => [`₹${val}`, 'Spent']} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={trendXKey} stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip formatter={(val) => [`₹${val}`, 'Spending']} />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
            <PieIcon className="w-5 h-5 text-emerald-600 mr-2" />
            Category Breakdown
          </h2>
          <div className="h-64">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No expense data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`₹${val}`, 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Method Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 text-amber-600 mr-2" />
            Payment Channel Breakdown (Cash vs Bank vs UPI)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(val) => [`₹${val}`, 'Spent']} />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
            <Wallet className="w-5 h-5 text-teal-600 mr-2" />
            Income vs Expenses Comparison
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(val) => [`₹${val}`, 'Total']} />
                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

