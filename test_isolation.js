// Automated Verification Test for Personal Finance Tracker
import { storageAdapter } from './src/storage/storageAdapter.js';
import { calculateTotalBalance, getCategoryBreakdown } from './src/utils/calculations.js';

async function runTests() {
  console.log('--- STARTING MULTI-USER ISOLATION & CALCULATION TESTS ---');

  // Global window/localStorage mock for Node environment if missing
  if (typeof globalThis.localStorage === 'undefined') {
    const store = {};
    globalThis.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
  }

  // TEST 1: User 1 Setup
  const USER_1 = 'user_101';
  storageAdapter.initialize(USER_1);
  await storageAdapter.resetLocalUserData(); // Clean test environment

  const accUser1 = await storageAdapter.saveAccount({
    name: 'HDFC Savings',
    bankName: 'HDFC Bank',
    accountType: 'Savings',
    openingBalance: 10000,
    lastFourDigits: '4321'
  });

  const txnUser1 = await storageAdapter.saveTransaction({
    amount: 500,
    type: 'Expense',
    paymentMethod: 'UPI',
    accountId: accUser1.id,
    category: 'Food',
    description: 'Swiggy Dinner',
    date: '2026-09-04',
    time: '20:00'
  });

  const u1Accounts = await storageAdapter.getAccounts();
  const u1Txns = await storageAdapter.getTransactions();
  const u1Balance = calculateTotalBalance(u1Accounts, u1Txns, 'ALL');

  console.log(`[USER 1] Accounts count: ${u1Accounts.length}, Transactions count: ${u1Txns.length}`);
  console.log(`[USER 1] Calculated Total Balance: ₹${u1Balance} (Expected: ₹9500)`);
  if (u1Balance !== 9500) throw new Error('User 1 balance mismatch!');

  // TEST 2: User 2 Switch & Data Isolation Check
  const USER_2 = 'user_202';
  storageAdapter.initialize(USER_2);
  await storageAdapter.resetLocalUserData(); // Clean test environment

  const u2AccountsInitial = await storageAdapter.getAccounts();
  const u2TxnsInitial = await storageAdapter.getTransactions();

  console.log(`[USER 2 INITIAL] Accounts count: ${u2AccountsInitial.length}, Transactions count: ${u2TxnsInitial.length}`);
  // User 2 should NOT see User 1's HDFC account!
  const hasUser1AccInUser2 = u2AccountsInitial.some(a => a.id === accUser1.id);
  const hasUser1TxnInUser2 = u2TxnsInitial.some(t => t.id === txnUser1.id);

  if (hasUser1AccInUser2 || hasUser1TxnInUser2) {
    throw new Error('CRITICAL SECURITY LEAK: User 2 can see User 1 local data!');
  }
  console.log('[USER ISOLATION PASSED] User 2 cannot see User 1 local data!');

  // User 2 adds their own account
  const accUser2 = await storageAdapter.saveAccount({
    name: 'SBI Savings',
    bankName: 'SBI',
    accountType: 'Savings',
    openingBalance: 25000,
    lastFourDigits: '9876'
  });

  const u2AccountsFinal = await storageAdapter.getAccounts();
  const u2Balance = calculateTotalBalance(u2AccountsFinal, [], 'ALL');
  console.log(`[USER 2] Calculated Total Balance: ₹${u2Balance} (Expected: ₹25000)`);
  if (u2Balance !== 25000) throw new Error('User 2 balance mismatch!');

  // TEST 3: User 1 Re-login & Data Restoration Check
  storageAdapter.initialize(USER_1);
  const u1AccountsRestored = await storageAdapter.getAccounts();
  const u1TxnsRestored = await storageAdapter.getTransactions();
  const u1BalanceRestored = calculateTotalBalance(u1AccountsRestored, u1TxnsRestored, 'ALL');

  console.log(`[USER 1 RESTORED] Accounts count: ${u1AccountsRestored.length}, Transactions count: ${u1TxnsRestored.length}`);
  console.log(`[USER 1 RESTORED] Total Balance: ₹${u1BalanceRestored} (Expected: ₹9500)`);

  if (u1BalanceRestored !== 9500 || u1TxnsRestored.length !== 1) {
    throw new Error('User 1 data restoration failed!');
  }

  // TEST 4: Category Breakdown Calculation
  const catBreakdown = getCategoryBreakdown(u1TxnsRestored);
  console.log('[CATEGORY BREAKDOWN]', catBreakdown);
  if (catBreakdown[0].name !== 'Food' || catBreakdown[0].amount !== 500) {
    throw new Error('Category breakdown calculation mismatch!');
  }

  console.log('\n==================================================');
  console.log('✅ ALL MULTI-USER ISOLATION AND CALCULATION TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
