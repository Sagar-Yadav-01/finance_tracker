import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { financeService } from '../services/financeService';
import { transactionDetectionService } from '../services/transactionDetectionService';
import { calculateTotalBalance, filterTransactions } from '../utils/calculations';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({
    theme: 'light',
    currency: 'INR',
    selectedAccountFilter: 'ALL',
    selectedPaymentMethodFilter: 'ALL',
    monthlyBudget: 20000
  });
  const [selectedAccountId, setSelectedAccountId] = useState('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL');
  const [smsDetectionEnabled, setSmsDetectionEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load finance data whenever authenticated user changes
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setTransactions([]);
        setAccounts([]);
        setCategories([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        financeService.initialize(user.id);

        const [accs, txns, cats, sets] = await Promise.all([
          financeService.getAccounts(),
          financeService.getTransactions(),
          financeService.getCategories(),
          financeService.getSettings()
        ]);

        // Auto-consolidate duplicate bank accounts (such as multiple SBI/UNION accounts)
        const { mergedCount, accounts: cleanAccs, transactions: cleanTxns } = await financeService.consolidateDuplicateAccounts();
        if (mergedCount > 0) {
          console.log(`[FINANCE CONTEXT] Consolidated ${mergedCount} duplicate bank accounts on startup.`);
        }

        setAccounts(cleanAccs || accs || []);
        setTransactions(cleanTxns || txns || []);
        setCategories(cats || []);
        setSettings(sets || {});
        
        const enabled = transactionDetectionService.isEnabled(user.id);
        setSmsDetectionEnabledState(enabled);

        if (sets && sets.selectedAccountFilter) {
          setSelectedAccountId(sets.selectedAccountFilter);
        }
        if (sets && sets.selectedPaymentMethodFilter) {
          setSelectedPaymentMethod(sets.selectedPaymentMethodFilter);
        }
      } catch (err) {
        console.error('[FINANCE CONTEXT ERROR] Failed to load local finance data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Persist account filter preference
  const handleSetSelectedAccountId = (accId) => {
    setSelectedAccountId(accId);
    financeService.saveSettings({ selectedAccountFilter: accId });
  };

  // Persist payment method filter preference
  const handleSetSelectedPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    financeService.saveSettings({ selectedPaymentMethodFilter: method });
  };

  // Toggle SMS detection
  const toggleSmsDetection = (enabled) => {
    if (!user) return;
    transactionDetectionService.setEnabled(user.id, enabled);
    setSmsDetectionEnabledState(enabled);
  };

  // Process raw SMS text into a real transaction
  const processIncomingSmsText = async (smsText, smsTimestamp = null) => {
    if (!user) return { status: 'ERROR', reason: 'No active user session' };
    const result = await transactionDetectionService.processIncomingSms(
      smsText,
      accounts,
      user.id,
      addTransaction,
      addAccount,
      smsTimestamp
    );
    return result;
  };

  // Real-Time Native SMS Broadcast Listener
  useEffect(() => {
    if (!user || !smsDetectionEnabled) return;

    console.log('[FINANCE CONTEXT] Registering real-time native SMS broadcast listener...');
    const listener = transactionDetectionService.listenForNativeSms((smsText, sender, smsTimestamp) => {
      console.log(`[REAL-TIME SMS DETECTED] From: ${sender}, Message: ${smsText}`);
      transactionDetectionService.processIncomingSms(
        smsText,
        accounts,
        user.id,
        addTransaction,
        addAccount,
        smsTimestamp
      );
    });

    return () => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    };
  }, [user, smsDetectionEnabled, accounts]);

  // Scan existing historical SMS messages
  const scanExistingSmsInbox = async () => {
    if (!user) return { success: false, reason: 'No active user session' };
    return await transactionDetectionService.scanExistingSmsInbox(
      accounts,
      user.id,
      addTransaction,
      addAccount
    );
  };

  // Dynamic calculations
  const totalBalance = useMemo(() => {
    return calculateTotalBalance(accounts, transactions, selectedAccountId);
  }, [accounts, transactions, selectedAccountId]);

  const activeFilteredTransactions = useMemo(() => {
    return filterTransactions(transactions, {
      selectedAccountId,
      paymentMethod: selectedPaymentMethod
    });
  }, [transactions, selectedAccountId, selectedPaymentMethod]);

  // Transaction CRUD
  const addTransaction = async (txnData) => {
    const newTxn = await financeService.addTransaction(txnData);
    setTransactions(prev => [newTxn, ...prev]);
    return newTxn;
  };

  const updateTransaction = async (txnData) => {
    const updated = await financeService.updateTransaction(txnData, user?.id);
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    return updated;
  };

  const deleteTransaction = async (id) => {
    await financeService.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Account CRUD
  const addAccount = async (accData) => {
    const newAcc = await financeService.addAccount(accData);
    setAccounts(prev => [...prev, newAcc]);
    return newAcc;
  };

  const updateAccount = async (accData) => {
    const updated = await financeService.updateAccount(accData);
    setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
    return updated;
  };

  const deleteAccount = async (id) => {
    await financeService.deleteAccount(id, transactions);
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (selectedAccountId === id) {
      handleSetSelectedAccountId('ALL');
    }
  };

  // Category CRUD
  const addCategory = async (catData) => {
    const newCat = await financeService.addCategory(catData);
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = async (catData) => {
    const updated = await financeService.updateCategory(catData);
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    return updated;
  };

  const deleteCategory = async (id) => {
    await financeService.deleteCategory(id, transactions);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Settings & Budget
  const updateSettings = async (newSets) => {
    const updated = await financeService.saveSettings(newSets);
    setSettings(updated);
    return updated;
  };

  // Export Data to CSV
  const exportCSV = () => {
    if (transactions.length === 0) return false;
    const headers = ['ID', 'Date', 'Time', 'Type', 'Amount', 'Category', 'Payment Method', 'Account', 'Description', 'Source'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.time || '',
      t.type,
      t.amount,
      `"${t.category || ''}"`,
      t.paymentMethod || '',
      `"${accounts.find(a => a.id === t.accountId)?.name || t.accountId || ''}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.source || 'MANUAL'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  };

  // Export Backup JSON
  const exportJSON = () => {
    const dataPayload = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      userEmail: user?.email,
      transactions,
      accounts,
      categories,
      settings
    };
    const jsonString = JSON.stringify(dataPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  };

  // Restore Backup JSON
  const restoreJSON = async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.transactions || !Array.isArray(data.transactions)) {
        throw new Error('Invalid JSON backup file structure');
      }

      for (const acc of data.accounts || []) {
        await financeService.addAccount(acc).catch(() => {});
      }
      for (const cat of data.categories || []) {
        await financeService.addCategory(cat).catch(() => {});
      }
      for (const txn of data.transactions || []) {
        await financeService.addTransaction(txn).catch(() => {});
      }

      const [updatedAccs, updatedTxns, updatedCats] = await Promise.all([
        financeService.getAccounts(),
        financeService.getTransactions(),
        financeService.getCategories()
      ]);

      setAccounts(updatedAccs);
      setTransactions(updatedTxns);
      setCategories(updatedCats);
      return true;
    } catch (e) {
      throw new Error(e.message || 'Failed to restore JSON backup');
    }
  };

  // Destructive reset
  const resetLocalUserData = async () => {
    await financeService.resetLocalUserData();
    setTransactions([]);
    setAccounts([{ id: 'acc_cash', name: 'Cash', bankName: 'Cash', accountType: 'Cash', openingBalance: 0, isSystem: true }]);
    setSelectedAccountId('ALL');
    setSelectedPaymentMethod('ALL');
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      accounts,
      categories,
      settings,
      selectedAccountId,
      setSelectedAccountId: handleSetSelectedAccountId,
      selectedPaymentMethod,
      setSelectedPaymentMethod: handleSetSelectedPaymentMethod,
      totalBalance,
      filteredTransactions: activeFilteredTransactions,
      loading,
      smsDetectionEnabled,
      toggleSmsDetection,
      processIncomingSmsText,
      scanExistingSmsInbox,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      exportCSV,
      exportJSON,
      restoreJSON,
      resetLocalUserData
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}

