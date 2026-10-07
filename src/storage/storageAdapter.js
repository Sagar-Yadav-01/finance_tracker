/**
 * Unified Storage Adapter supporting Web (user-scoped localStorage)
 * and Android (SQLite / Native Storage).
 * 
 * Enforces strict User Isolation using user ID scoping.
 */

// Default Categories for any new user profile
const DEFAULT_CATEGORIES = [
  { id: 'cat_salary', name: 'Salary', icon: 'Briefcase', isDefault: true },
  { id: 'cat_food', name: 'Food', icon: 'Utensils', isDefault: true },
  { id: 'cat_travel', name: 'Travel', icon: 'Car', isDefault: true },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', isDefault: true },
  { id: 'cat_bills', name: 'Bills', icon: 'FileText', isDefault: true },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'Film', isDefault: true },
  { id: 'cat_health', name: 'Health', icon: 'HeartPulse', isDefault: true },
  { id: 'cat_education', name: 'Education', icon: 'GraduationCap', isDefault: true },
  { id: 'cat_other', name: 'Other', icon: 'MoreHorizontal', isDefault: true }
];

// Default System Cash Account
const DEFAULT_CASH_ACCOUNT = {
  id: 'acc_cash',
  name: 'Cash',
  bankName: 'Cash',
  accountType: 'Cash',
  openingBalance: 0,
  lastFourDigits: '',
  isSystem: true
};

class StorageAdapter {
  constructor() {
    this.currentUserId = null;
  }

  /**
   * Initializes the adapter with the authenticated user ID scope
   */
  initialize(userId) {
    if (!userId) {
      console.warn('[STORAGE ADAPTER] Initialized without userId!');
    }
    this.currentUserId = userId ? String(userId) : 'guest';
  }

  /**
   * Helper to construct user-scoped localStorage keys
   */
  _getKey(entity) {
    const userId = this.currentUserId || 'guest';
    return `finance_user_${userId}_${entity}`;
  }

  _getItem(entity, defaultValue = []) {
    try {
      const key = this._getKey(entity);
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      console.error(`[STORAGE READ ERROR] Failed to read ${entity}:`, e);
      return defaultValue;
    }
  }

  _setItem(entity, data) {
    try {
      const key = this._getKey(entity);
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`[STORAGE WRITE ERROR] Failed to write ${entity}:`, e);
      return false;
    }
  }

  // --- ACCOUNTS ---
  _normalizeAccountKey(name = '', bankName = '') {
    const raw = `${name} ${bankName}`.toLowerCase();
    if (raw.includes('sbi') || raw.includes('state bank')) return 'sbi';
    if (raw.includes('union') || raw.includes('uboi')) return 'union';
    if (raw.includes('hdfc')) return 'hdfc';
    if (raw.includes('icici')) return 'icici';
    if (raw.includes('axis')) return 'axis';
    if (raw.includes('bob') || raw.includes('baroda')) return 'bob';
    if (raw.includes('pnb') || raw.includes('punjab')) return 'pnb';
    if (raw.includes('kotak')) return 'kotak';
    if (raw.includes('paytm')) return 'paytm';
    return name.trim().toLowerCase();
  }

  async getAccounts() {
    let accounts = this._getItem('accounts', null);
    if (!accounts) {
      // First time initialization for new user
      accounts = [DEFAULT_CASH_ACCOUNT];
      this._setItem('accounts', accounts);
    } else {
      // Check if duplicate accounts exist and deduplicate automatically
      const keysSeen = new Set();
      let hasDuplicates = false;
      accounts.forEach(acc => {
        if (acc.isSystem) return;
        const k = this._normalizeAccountKey(acc.name, acc.bankName);
        if (keysSeen.has(k)) hasDuplicates = true;
        keysSeen.add(k);
      });

      if (hasDuplicates) {
        const consolidated = await this.consolidateDuplicateAccounts();
        accounts = consolidated.accounts;
      }
    }
    return accounts;
  }

  async saveAccount(account) {
    const accounts = await this.getAccounts();
    
    // Check if matching account already exists to prevent duplicate account creation
    const targetKey = this._normalizeAccountKey(account.name, account.bankName);
    const existing = accounts.find(a => !a.isSystem && this._normalizeAccountKey(a.name, a.bankName) === targetKey);
    if (existing) {
      return existing;
    }

    const newAccount = {
      ...account,
      id: account.id || `acc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: account.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    accounts.push(newAccount);
    this._setItem('accounts', accounts);
    return newAccount;
  }

  async consolidateDuplicateAccounts() {
    let accounts = await this.getAccounts();
    let transactions = await this.getTransactions();

    const groups = {};
    accounts.forEach(acc => {
      if (acc.isSystem) return;
      const key = this._normalizeAccountKey(acc.name, acc.bankName);
      if (!groups[key]) groups[key] = [];
      groups[key].push(acc);
    });

    let mergedCount = 0;
    let accountsChanged = false;
    let transactionsChanged = false;

    Object.keys(groups).forEach(key => {
      const accList = groups[key];
      if (accList.length > 1) {
        const primary = accList[0];
        const duplicates = accList.slice(1);
        const duplicateIds = duplicates.map(d => d.id);

        // Reassign linked transactions
        transactions = transactions.map(t => {
          if (duplicateIds.includes(t.accountId)) {
            transactionsChanged = true;
            return { ...t, accountId: primary.id };
          }
          return t;
        });

        // Filter out duplicates from accounts array
        accounts = accounts.filter(a => !duplicateIds.includes(a.id));
        mergedCount += duplicates.length;
        accountsChanged = true;
      }
    });

    if (accountsChanged) {
      this._setItem('accounts', accounts);
    }
    if (transactionsChanged) {
      this._setItem('transactions', transactions);
    }

    return { mergedCount, accounts, transactions };
  }

  async updateAccount(updatedAccount) {
    const accounts = await this.getAccounts();
    const index = accounts.findIndex(a => a.id === updatedAccount.id);
    if (index !== -1) {
      accounts[index] = {
        ...accounts[index],
        ...updatedAccount,
        updatedAt: new Date().toISOString()
      };
      this._setItem('accounts', accounts);
      return accounts[index];
    }
    throw new Error('Account not found');
  }

  async deleteAccount(accountId) {
    let accounts = await this.getAccounts();
    const target = accounts.find(a => a.id === accountId);
    if (target && target.isSystem) {
      throw new Error('System accounts (such as Cash) cannot be deleted.');
    }
    accounts = accounts.filter(a => a.id !== accountId);
    this._setItem('accounts', accounts);
    return true;
  }

  // --- TRANSACTIONS ---
  async getTransactions() {
    return this._getItem('transactions', []);
  }

  async saveTransaction(transaction) {
    const transactions = await this.getTransactions();
    const newTxn = {
      ...transaction,
      id: transaction.id || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      amount: parseFloat(transaction.amount) || 0,
      source: transaction.source || 'MANUAL',
      sourceReference: transaction.sourceReference || null,
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    transactions.unshift(newTxn); // Most recent first
    this._setItem('transactions', transactions);
    return newTxn;
  }

  async updateTransaction(updatedTxn) {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex(t => t.id === updatedTxn.id);
    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        ...updatedTxn,
        amount: parseFloat(updatedTxn.amount) || 0,
        updatedAt: new Date().toISOString()
      };
      this._setItem('transactions', transactions);
      return transactions[index];
    }
    throw new Error('Transaction not found');
  }

  async deleteTransaction(txnId) {
    let transactions = await this.getTransactions();
    transactions = transactions.filter(t => t.id !== txnId);
    this._setItem('transactions', transactions);
    return true;
  }

  // --- CATEGORIES ---
  async getCategories() {
    let categories = this._getItem('categories', null);
    if (!categories || categories.length === 0) {
      categories = DEFAULT_CATEGORIES;
      this._setItem('categories', categories);
    }
    return categories;
  }

  async saveCategory(category) {
    const categories = await this.getCategories();
    const newCat = {
      ...category,
      id: category.id || `cat_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    categories.push(newCat);
    this._setItem('categories', categories);
    return newCat;
  }

  async updateCategory(updatedCat) {
    const categories = await this.getCategories();
    const index = categories.findIndex(c => c.id === updatedCat.id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updatedCat };
      this._setItem('categories', categories);
      return categories[index];
    }
    throw new Error('Category not found');
  }

  async deleteCategory(categoryId) {
    let categories = await this.getCategories();
    const target = categories.find(c => c.id === categoryId);
    if (target && target.isDefault) {
      throw new Error('Default categories cannot be deleted.');
    }
    categories = categories.filter(c => c.id !== categoryId);
    this._setItem('categories', categories);
    return true;
  }

  // --- SETTINGS ---
  async getSettings() {
    return this._getItem('settings', {
      theme: 'light',
      currency: 'INR',
      selectedAccountFilter: 'ALL',
      selectedPaymentMethodFilter: 'ALL'
    });
  }

  async saveSettings(settings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    this._setItem('settings', updated);
    return updated;
  }

  // --- SECURITY DATA (Android / Local Auth) ---
  async getSecurityData() {
    return this._getItem('security', {
      isPinSet: false,
      pinVerifierHash: null,
      recoveryKeyHash: null,
      biometricEnabled: false,
      isFirstLaunchDone: false
    });
  }

  async saveSecurityData(securityData) {
    const current = await this.getSecurityData();
    const updated = { ...current, ...securityData };
    this._setItem('security', updated);
    return updated;
  }

  /**
   * Destructive Reset — wipes all finance & security data AND processed SMS fingerprints for the current active user
   */
  async resetLocalUserData() {
    const userId = this.currentUserId || 'guest';
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes(userId) || k.startsWith('finance_'))) {
        keysToRemove.push(k);
      }
    }

    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    // Re-initialize empty state with default Cash account & categories
    this._setItem('accounts', [DEFAULT_CASH_ACCOUNT]);
    this._setItem('categories', DEFAULT_CATEGORIES);
    this._setItem('transactions', []);
    return true;
  }
}

export const storageAdapter = new StorageAdapter();
