/**
 * Pure calculation and filtering utility functions for financial calculations.
 */

/**
 * Calculates current balance for a single account
 */
export function calculateAccountBalance(account, transactions = []) {
  if (!account) return 0;
  const opening = parseFloat(account.openingBalance) || 0;
  
  const accountTxns = transactions.filter(t => t.accountId === account.id);
  const totalIncome = accountTxns
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalExpenses = accountTxns
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  return opening + totalIncome - totalExpenses;
}

/**
 * Calculates current balances for all accounts
 */
export function calculateAllAccountBalances(accounts = [], transactions = []) {
  const balances = {};
  accounts.forEach(acc => {
    balances[acc.id] = calculateAccountBalance(acc, transactions);
  });
  return balances;
}

/**
 * Calculates aggregate total balance across all accounts or for a selected account filter
 */
export function calculateTotalBalance(accounts = [], transactions = [], selectedAccountId = 'ALL') {
  if (selectedAccountId !== 'ALL') {
    const acc = accounts.find(a => a.id === selectedAccountId);
    return acc ? calculateAccountBalance(acc, transactions) : 0;
  }

  // Combined balance across all accounts
  const totalOpening = accounts.reduce((sum, a) => sum + (parseFloat(a.openingBalance) || 0), 0);
  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  return totalOpening + totalIncome - totalExpenses;
}

/**
 * Date filtering helpers
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const cleanStr = String(dateStr).split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function isSameDay(d1, d2) {
  const date1 = parseLocalDate(d1);
  const date2 = parseLocalDate(d2);
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

export function isSameWeek(d, referenceDate = new Date()) {
  const date = parseLocalDate(d);
  const ref = parseLocalDate(referenceDate);
  
  // Get start of week (Monday)
  const day = ref.getDay();
  const diff = ref.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(ref.getFullYear(), ref.getMonth(), diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
}

export function isSameMonth(d, referenceDate = new Date()) {
  const date = parseLocalDate(d);
  const ref = parseLocalDate(referenceDate);
  return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();
}

/**
 * Summary Metrics
 */
export function getTodayExpenses(transactions = []) {
  const today = new Date();
  return transactions
    .filter(t => t.type === 'Expense' && isSameDay(t.date, today))
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
}

export function getTodayIncome(transactions = []) {
  const today = new Date();
  return transactions
    .filter(t => t.type === 'Income' && isSameDay(t.date, today))
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
}

export function getThisWeekExpenses(transactions = []) {
  const today = new Date();
  return transactions
    .filter(t => t.type === 'Expense' && isSameWeek(t.date, today))
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
}

export function getThisMonthExpenses(transactions = [], referenceMonth = new Date()) {
  return transactions
    .filter(t => t.type === 'Expense' && isSameMonth(t.date, referenceMonth))
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
}

export function getTotalIncome(transactions = []) {
  return transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
}

export function getTotalExpenses(transactions = []) {
  return transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
}

/**
 * Filter transactions based on active account filter, payment method, type, search term, etc.
 */
export function filterTransactions(transactions = [], filters = {}) {
  const {
    selectedAccountId = 'ALL',
    paymentMethod = 'ALL',
    type = 'ALL',
    category = 'ALL',
    searchQuery = '',
    startDate = null,
    endDate = null
  } = filters;

  return transactions.filter(t => {
    // Account Filter
    if (selectedAccountId !== 'ALL' && t.accountId !== selectedAccountId) {
      return false;
    }
    // Payment Method Filter
    if (paymentMethod !== 'ALL' && t.paymentMethod !== paymentMethod) {
      return false;
    }
    // Type Filter (Income / Expense)
    if (type !== 'ALL' && t.type !== type) {
      return false;
    }
    // Category Filter
    if (category !== 'ALL' && t.category !== category) {
      return false;
    }
    // Search Query (description / category / payment method)
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const descMatch = (t.description || '').toLowerCase().includes(q);
      const catMatch = (t.category || '').toLowerCase().includes(q);
      const methodMatch = (t.paymentMethod || '').toLowerCase().includes(q);
      if (!descMatch && !catMatch && !methodMatch) {
        return false;
      }
    }
    // Date Range Filter
    if (startDate) {
      const tDate = new Date(t.date);
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      if (tDate < sDate) return false;
    }
    if (endDate) {
      const tDate = new Date(t.date);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      if (tDate > eDate) return false;
    }

    return true;
  });
}

/**
 * Breakdown calculations for Analytics
 */
export function getCategoryBreakdown(transactions = []) {
  const expenses = transactions.filter(t => t.type === 'Expense');
  const totals = {};

  expenses.forEach(t => {
    const cat = t.category || 'Other';
    totals[cat] = (totals[cat] || 0) + (parseFloat(t.amount) || 0);
  });

  return Object.keys(totals).map(name => ({
    name,
    amount: totals[name]
  })).sort((a, b) => b.amount - a.amount);
}

export function getPaymentMethodBreakdown(transactions = []) {
  const expenses = transactions.filter(t => t.type === 'Expense');
  const totals = { Cash: 0, Bank: 0, UPI: 0 };

  expenses.forEach(t => {
    const method = t.paymentMethod || 'Bank';
    if (totals[method] !== undefined) {
      totals[method] += (parseFloat(t.amount) || 0);
    } else {
      totals[method] = (parseFloat(t.amount) || 0);
    }
  });

  return Object.keys(totals).map(name => ({
    name,
    amount: totals[name]
  }));
}

export function getAccountWiseSpending(transactions = [], accounts = []) {
  const expenses = transactions.filter(t => t.type === 'Expense');
  const totals = {};

  accounts.forEach(acc => {
    totals[acc.id] = { name: acc.name, amount: 0 };
  });

  expenses.forEach(t => {
    if (totals[t.accountId]) {
      totals[t.accountId].amount += (parseFloat(t.amount) || 0);
    }
  });

  return Object.values(totals).filter(item => item.amount > 0);
}

export function getWeeklySpendingChart(transactions = []) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find start of current week (Monday)
  const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMon = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const currentMonday = new Date(today.getFullYear(), today.getMonth(), diffToMon);
  currentMonday.setHours(0, 0, 0, 0);

  // Generate 8 consecutive week buckets ending with current week
  const weekBuckets = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(currentMonday);
    start.setDate(currentMonday.getDate() - (i * 7));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const startLabel = `${String(start.getDate()).padStart(2, '0')} ${monthNames[start.getMonth()]}`;
    const endLabel = `${String(end.getDate()).padStart(2, '0')} ${monthNames[end.getMonth()]}`;
    const weekLabel = `${startLabel} - ${endLabel}`;

    weekBuckets.push({
      start,
      end,
      day: weekLabel,
      amount: 0
    });
  }

  // Populate week buckets using actual transaction dates
  transactions.filter(t => t.type === 'Expense').forEach(t => {
    const tDate = parseLocalDate(t.date);
    const bucket = weekBuckets.find(b => tDate >= b.start && tDate <= b.end);
    if (bucket) {
      bucket.amount += parseFloat(t.amount) || 0;
    }
  });

  return weekBuckets.map(b => ({
    day: b.day,
    label: b.day,
    amount: b.amount
  }));
}

export function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatFriendlyDateHeader(dateStr) {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const tDate = new Date(d);
  tDate.setHours(0, 0, 0, 0);

  const dayStr = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = monthNames[d.getMonth()];
  const yearStr = d.getFullYear();

  if (tDate.getTime() === today.getTime()) {
    return `Today • ${dayStr} ${monthStr} ${yearStr}`;
  } else if (tDate.getTime() === yesterday.getTime()) {
    return `Yesterday • ${dayStr} ${monthStr} ${yearStr}`;
  } else {
    return `${dayStr} ${monthStr} ${yearStr}`;
  }
}

/**
 * Groups sorted transactions by date (YYYY-MM-DD), returning an array of date groups:
 * [ { date, displayDate, transactions: [...] } ]
 */
export function groupTransactionsByDate(transactions = []) {
  const groups = [];
  let currentGroup = null;

  transactions.forEach(txn => {
    const txnDate = (txn.date || '').split('T')[0] || 'Unknown Date';
    if (!currentGroup || currentGroup.date !== txnDate) {
      currentGroup = {
        date: txnDate,
        displayDate: formatFriendlyDateHeader(txnDate),
        transactions: []
      };
      groups.push(currentGroup);
    }
    currentGroup.transactions.push(txn);
  });

  return groups;
}

export function getDailySpendingChart(transactions = []) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayTotals = {};
  const today = new Date();

  // Create entries for the last 14 days ending today
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${dayNum}`;
    const dayLabel = `${dayNum} ${monthNames[d.getMonth()]}`;
    dayTotals[dateKey] = { day: dayLabel, amount: 0 };
  }

  // Aggregate expenses by transaction date
  transactions.filter(t => t.type === 'Expense').forEach(t => {
    const cleanDate = (t.date || '').split('T')[0];
    if (dayTotals[cleanDate]) {
      dayTotals[cleanDate].amount += parseFloat(t.amount) || 0;
    } else {
      const d = parseLocalDate(t.date);
      if (!isNaN(d.getTime())) {
        const dayLabel = `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]}`;
        dayTotals[cleanDate] = { day: dayLabel, amount: parseFloat(t.amount) || 0 };
      }
    }
  });

  return Object.keys(dayTotals)
    .sort()
    .map(key => ({
      day: dayTotals[key].day,
      label: dayTotals[key].day,
      amount: dayTotals[key].amount
    }));
}

export function getMonthlySpendingChart(transactions = []) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentYear = now.getFullYear();
  const totals = {};

  months.forEach((m, idx) => { totals[idx] = 0; });

  transactions
    .filter(t => t.type === 'Expense')
    .forEach(t => {
      const d = parseLocalDate(t.date);
      if (d.getFullYear() === currentYear) {
        const mIdx = d.getMonth();
        if (totals[mIdx] !== undefined) {
          totals[mIdx] += parseFloat(t.amount) || 0;
        }
      }
    });

  return months.map((month, idx) => ({
    month,
    label: month,
    amount: totals[idx]
  }));
}

export function getMonthlyComparison(transactions = []) {
  const now = new Date();
  const currentMonthExpenses = getThisMonthExpenses(transactions, now);

  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthExpenses = getThisMonthExpenses(transactions, prevMonth);

  const diff = currentMonthExpenses - prevMonthExpenses;
  const pctChange = prevMonthExpenses > 0 
    ? ((diff / prevMonthExpenses) * 100).toFixed(1) 
    : (currentMonthExpenses > 0 ? 100 : 0);

  return {
    currentMonthExpenses,
    prevMonthExpenses,
    diff,
    pctChange
  };
}
