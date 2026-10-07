import { storageAdapter } from '../storage/storageAdapter';

export const financeService = {
  initialize(userId) {
    storageAdapter.initialize(userId);
  },

  // Account operations
  async getAccounts() {
    return await storageAdapter.getAccounts();
  },

  async consolidateDuplicateAccounts() {
    return await storageAdapter.consolidateDuplicateAccounts();
  },

  async addAccount(accountData) {
    if (!accountData.name || !accountData.name.trim()) {
      throw new Error('Account name is required');
    }
    const openingBalance = parseFloat(accountData.openingBalance);
    if (isNaN(openingBalance)) {
      throw new Error('Opening balance must be a valid number');
    }
    return await storageAdapter.saveAccount({
      ...accountData,
      name: accountData.name.trim(),
      bankName: accountData.bankName ? accountData.bankName.trim() : accountData.name.trim(),
      accountType: accountData.accountType || 'Savings',
      openingBalance: openingBalance,
      lastFourDigits: accountData.lastFourDigits ? String(accountData.lastFourDigits).slice(-4) : ''
    });
  },

  async updateAccount(accountData) {
    if (!accountData.id) throw new Error('Account ID missing');
    return await storageAdapter.updateAccount(accountData);
  },

  async deleteAccount(accountId, transactions = []) {
    // Check if transactions exist for this account
    const linkedTxns = transactions.filter(t => t.accountId === accountId);
    if (linkedTxns.length > 0) {
      throw new Error(`Cannot delete account. There are ${linkedTxns.length} existing transactions associated with this account. Please delete or reassign transactions first.`);
    }
    return await storageAdapter.deleteAccount(accountId);
  },

  // Transaction operations
  async getTransactions() {
    return await storageAdapter.getTransactions();
  },

  async addTransaction(txnData) {
    const amount = parseFloat(txnData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Transaction amount must be a positive number greater than zero.');
    }
    if (!txnData.accountId) {
      throw new Error('Please select an account for this transaction.');
    }
    if (!txnData.category) {
      throw new Error('Please select a category.');
    }
    if (!txnData.date) {
      throw new Error('Please specify a transaction date.');
    }

    return await storageAdapter.saveTransaction({
      amount: amount,
      type: txnData.type || 'Expense', // Income or Expense
      paymentMethod: txnData.paymentMethod || 'UPI', // Cash, Bank, UPI
      accountId: txnData.accountId,
      category: txnData.category,
      description: txnData.description ? txnData.description.trim() : '',
      date: txnData.date,
      time: txnData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: txnData.source || 'MANUAL',
      sourceReference: txnData.sourceReference || null
    });
  },

  async updateTransaction(txnData, userId = null) {
    const amount = parseFloat(txnData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Transaction amount must be a positive number greater than zero.');
    }

    // If description/merchant and category are set, learn user category rule for future SMS
    if (txnData.description && txnData.category) {
      const { categorizationEngine } = await import('./categorizationEngine');
      categorizationEngine.learnUserRule(userId, txnData.description, txnData.category);
    }

    return await storageAdapter.updateTransaction(txnData);
  },

  async deleteTransaction(id) {
    return await storageAdapter.deleteTransaction(id);
  },

  // Category operations
  async getCategories() {
    return await storageAdapter.getCategories();
  },

  async addCategory(catData) {
    if (!catData.name || !catData.name.trim()) {
      throw new Error('Category name is required');
    }
    return await storageAdapter.saveCategory({
      name: catData.name.trim(),
      icon: catData.icon || 'Folder',
      isDefault: false
    });
  },

  async updateCategory(catData) {
    return await storageAdapter.updateCategory(catData);
  },

  async deleteCategory(categoryId, transactions = []) {
    const linkedTxns = transactions.filter(t => t.category === categoryId);
    if (linkedTxns.length > 0) {
      throw new Error(`Cannot delete category. There are ${linkedTxns.length} transactions associated with this category.`);
    }
    return await storageAdapter.deleteCategory(categoryId);
  },

  // Settings & Security
  async getSettings() {
    return await storageAdapter.getSettings();
  },

  async saveSettings(settings) {
    return await storageAdapter.saveSettings(settings);
  },

  async getSecurityData() {
    return await storageAdapter.getSecurityData();
  },

  async saveSecurityData(data) {
    return await storageAdapter.saveSecurityData(data);
  },

  async resetLocalUserData() {
    return await storageAdapter.resetLocalUserData();
  }
};
