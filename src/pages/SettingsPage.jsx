import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { Link, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { transactionDetectionService } from '../services/transactionDetectionService';

import { 
  Settings as SettingsIcon, 
  Wallet, 
  ShieldCheck, 
  KeyRound, 
  Smartphone, 
  HardDrive, 
  LogOut, 
  Trash2, 
  Copy, 
  Check, 
  X,
  Tag,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Play,
  Moon,
  Sun,
  Printer
} from 'lucide-react';

export default function SettingsPage() {
  const { 
    user, 
    logout, 
    securityData, 
    setupPinAndRecoveryKey, 
    updatePin, 
    deletePin,
    toggleBiometric,
    theme,
    toggleTheme,
    saveSecurityQuestions
  } = useAuth();

  const { 
    settings,
    updateSettings,
    resetLocalUserData,
    smsDetectionEnabled,
    toggleSmsDetection,
    processIncomingSmsText,
    scanExistingSmsInbox,
    exportCSV,
    exportJSON,
    restoreJSON,
    filteredTransactions
  } = useFinance();

  const navigate = useNavigate();

  const handleExportPdfReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to export the PDF financial report.');
      return;
    }

    const userName = user?.name || 'User';
    const userEmail = user?.email || '';
    const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    let totalInc = 0;
    let totalExp = 0;
    filteredTransactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'Income') totalInc += amt;
      else totalExp += amt;
    });

    const netBal = totalInc - totalExp;

    const rowsHtml = filteredTransactions.map(t => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${t.date} ${t.time || ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold;">${t.description || t.category}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${t.category}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${t.paymentMethod}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: ${t.type === 'Income' ? '#059669' : '#dc2626'}; text-align: right;">
          ${t.type === 'Income' ? '+' : '-'}₹${parseFloat(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Spending Report - ${userName}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 40px; }
          .header { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 24px; font-weight: 800; color: #1e1b4b; margin: 0; }
          .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; }
          .card-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; }
          .card-value { font-size: 20px; font-weight: 800; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 8px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Personal Financial Report</h1>
            <div class="meta">Account Vault: ${userName} (${userEmail}) • Generated: ${dateStr}</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="card">
            <div class="card-label">Total Income</div>
            <div class="card-value" style="color: #059669;">₹${totalInc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-label">Total Expenses</div>
            <div class="card-value" style="color: #dc2626;">₹${totalExp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-label">Net Balance</div>
            <div class="card-value" style="color: ${netBal >= 0 ? '#059669' : '#dc2626'};">₹${netBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">Detailed Transaction Ledger (${filteredTransactions.length} items)</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description / Merchant</th>
              <th>Category</th>
              <th>Channel</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };


  let isNativeApp = false;
  try {
    isNativeApp = Capacitor.isNativePlatform();
  } catch (e) {
    isNativeApp = false;
  }

  // Delete PIN Confirm Modal State
  const [isDeletePinConfirmOpen, setIsDeletePinConfirmOpen] = useState(false);

  // PIN Setup / Change Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [isKeyConfirmed, setIsKeyConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Recovery Key Reveal Modal State
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [verifyPinInput, setVerifyPinInput] = useState('');
  const [revealError, setRevealError] = useState('');
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);

  // SMS Consent Explanation Modal State
  const [isSmsConsentOpen, setIsSmsConsentOpen] = useState(false);
  const [smsTestModalOpen, setSmsTestModalOpen] = useState(false);
  const [simulatedSmsText, setSimulatedSmsText] = useState('');
  const [smsPermissionGranted, setSmsPermissionGranted] = useState(false);
  const [isScanningSmsHistory, setIsScanningSmsHistory] = useState(false);

  const checkSmsPerms = React.useCallback(async () => {
    const res = await transactionDetectionService.checkPermissions();
    setSmsPermissionGranted(res.granted);
  }, []);

  React.useEffect(() => {
    checkSmsPerms();
    window.addEventListener('focus', checkSmsPerms);
    return () => window.removeEventListener('focus', checkSmsPerms);
  }, [checkSmsPerms]);

  // Budget Modal State
  const [budgetInput, setBudgetInput] = useState(settings?.monthlyBudget || 20000);

  // Destructive Reset Modal State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const apkUrl = import.meta.env.VITE_ANDROID_APK_URL || '';

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');

    if (!newPin || newPin.length < 4) {
      setPinError('PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match.');
      return;
    }

    try {
      if (!securityData.isPinSet) {
        const rawKey = await setupPinAndRecoveryKey(newPin);
        setGeneratedKey(rawKey);
      } else {
        await updatePin(newPin);
        setIsPinModalOpen(false);
        setToastMessage('PIN updated successfully.');
      }
    } catch (err) {
      setPinError(err.message || 'Failed to save PIN.');
    }
  };

  const handleFinishFirstSetup = () => {
    if (!isKeyConfirmed) {
      setPinError('Please confirm that you have saved your Recovery Key.');
      return;
    }
    setIsPinModalOpen(false);
    setGeneratedKey('');
    setToastMessage('Security PIN & Recovery Key established successfully.');
  };

  const handleRevealRecoveryKey = async (e) => {
    e.preventDefault();
    setRevealError('');

    const { hashPin } = await import('../utils/cryptoUtils');
    const enteredHash = await hashPin(verifyPinInput);

    if (enteredHash === securityData.pinVerifierHash) {
      setIsKeyRevealed(true);
    } else {
      setRevealError('Incorrect PIN.');
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSmsClick = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setIsSmsConsentOpen(true);
    } else {
      toggleSmsDetection(false);
      setToastMessage('Automatic SMS Transaction Detection disabled.');
    }
  };

  const handleGrantSmsAccessClick = () => {
    setIsSmsConsentOpen(true);
  };

  const handleRevokeSmsAccessClick = async () => {
    await transactionDetectionService.openAppSettings();
  };

  const handleConfirmSmsConsent = async () => {
    setIsSmsConsentOpen(false);
    const res = await transactionDetectionService.requestPermissions();
    if (res.granted) {
      setSmsPermissionGranted(true);
      toggleSmsDetection(true);
      setToastMessage('Automatic SMS Access Granted & Detection Enabled.');
    } else {
      setSmsPermissionGranted(false);
      setToastMessage('SMS Permission denied. Enable permission from Android Settings.');
    }
  };

  const handleScanExistingSms = async () => {
    setIsScanningSmsHistory(true);
    try {
      const res = await scanExistingSmsInbox();
      if (res.success) {
        setToastMessage(`SMS Scan Complete! Checked ${res.totalScanned} inbox messages: Created ${res.createdCount} new transactions (${res.duplicateCount} duplicates skipped).`);
      } else {
        setToastMessage(`SMS Inbox Scan: ${res.reason}`);
      }
    } catch (e) {
      setToastMessage(`Scan error: ${e.message}`);
    } finally {
      setIsScanningSmsHistory(false);
    }
  };

  const handleRunSimulatedSms = async (textToRun) => {
    const sms = textToRun || simulatedSmsText;
    if (!sms) return;
    const res = await processIncomingSmsText(sms);
    if (res.status === 'SUCCESS') {
      setToastMessage(`SMS Processed! Created ₹${res.transaction.amount} ${res.transaction.category} transaction.`);
    } else if (res.status === 'DUPLICATE') {
      setToastMessage('Duplicate SMS detected. Transaction already exists in history.');
    } else {
      setToastMessage(`SMS Ignored: ${res.reason}`);
    }
    setSmsTestModalOpen(false);
  };

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) return;
    await updateSettings({ monthlyBudget: val });
    setToastMessage(`Monthly Budget updated to ₹${val.toLocaleString('en-IN')}`);
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await restoreJSON(event.target.result);
        setToastMessage('Financial data restored successfully from backup.');
      } catch (err) {
        alert(err.message || 'Failed to restore backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeletePin = async () => {
    await deletePin();
    setIsDeletePinConfirmOpen(false);
    setToastMessage('Security PIN removed successfully.');
  };

  const handleDestructiveReset = async () => {
    await resetLocalUserData();
    setIsResetConfirmOpen(false);
    setToastMessage('All local financial data for this user has been permanently deleted.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Application Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage profile, security, categories, SMS detection, data exports, and app preferences</p>
      </div>

      {/* 1. ACCOUNT SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Account & Profile</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{user?.name || 'Authenticated User'}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* 2. SECURITY PREFERENCES SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1.5" />
          2. Security Preferences
        </h2>

        {/* PIN Setup Status */}
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">App Security PIN</h3>
            <p className="text-xs text-slate-500">
              {securityData.isPinSet ? '4-digit PIN lock active.' : 'No PIN configured yet.'}
            </p>
          </div>

          <button
            onClick={() => {
              setNewPin('');
              setConfirmPin('');
              setGeneratedKey('');
              setIsKeyConfirmed(false);
              setPinError('');
              setIsPinModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            {securityData.isPinSet ? 'Change PIN' : 'Set Up PIN'}
          </button>
        </div>

        {/* View Recovery Key */}
        {securityData.isPinSet && (
          <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recovery Key</h3>
              <p className="text-xs text-slate-500">Reveal your 16-character reset key (PIN required).</p>
            </div>

            <button
              onClick={() => {
                setVerifyPinInput('');
                setRevealError('');
                setIsKeyRevealed(false);
                setIsRevealModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Reveal Key
            </button>
          </div>
        )}

        {/* Delete Security PIN */}
        {securityData.isPinSet && (
          <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-rose-600">Delete Security PIN</h3>
              <p className="text-xs text-slate-500">Remove PIN lock requirement on app startup.</p>
            </div>

            <button
              onClick={() => setIsDeletePinConfirmOpen(true)}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition-colors"
            >
              Delete PIN
            </button>
          </div>
        )}

        {/* Optional Biometrics Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Biometric Authentication</h3>
            <p className="text-xs text-slate-500">Use fingerprint / face unlock on supported Android devices.</p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securityData.biometricEnabled}
              onChange={(e) => toggleBiometric(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Visual Theme Selection */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">App Theme (Light / Dark)</h3>
            <p className="text-xs text-slate-500">Toggle between Light mode and Dark mode UI appearance.</p>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => toggleTheme('light')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                theme === 'light' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => toggleTheme('dark')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                theme === 'dark' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CATEGORIES SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Tag className="w-4 h-4 text-indigo-600 mr-1.5" />
              3. Category Management
            </h2>
            <p className="text-xs text-slate-500 mt-1">Manage income and expense categories, custom icons, and category rules.</p>
          </div>

          <Link
            to="/categories"
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Manage Categories
          </Link>
        </div>
      </div>

      {/* 4. AUTOMATIC TRANSACTION DETECTION (SMS) SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Sparkles className="w-4 h-4 text-indigo-600 mr-1.5" />
              4. Automatic Transaction Detection
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Automatically detect bank and UPI transaction SMS messages and categorize them into your finance history.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={smsDetectionEnabled}
              onChange={handleToggleSmsClick}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Status</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              smsDetectionEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-700'
            }`}>
              {smsDetectionEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Permission Status</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              smsPermissionGranted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {smsPermissionGranted ? 'Granted' : 'Not Granted'}
            </span>
          </div>
        </div>

        {/* Platform Status Detail */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Platform Engine: {transactionDetectionService.getNativeStatus()}</span>
          </div>
          <p>
            Automatically detect bank and UPI transaction SMS messages and categorize them into your finance history. Messages are processed 100% locally on this device.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {!smsPermissionGranted ? (
            <button
              onClick={handleGrantSmsAccessClick}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Grant SMS Access</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleScanExistingSms}
                disabled={isScanningSmsHistory}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isScanningSmsHistory ? 'Scanning SMS Inbox...' : 'Scan Existing SMS Inbox'}</span>
              </button>

              <button
                onClick={handleRevokeSmsAccessClick}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded-xl transition-all flex items-center space-x-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>Revoke SMS Access (Android Settings)</span>
              </button>
            </>
          )}

          <button
            onClick={() => setSmsTestModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Test / Simulate SMS Detection</span>
          </button>

          <button
            onClick={() => navigate('/transactions')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Review Auto-Detected History</span>
          </button>
        </div>
      </div>

      {/* 5. DATA PRIVACY, BUDGET & STORAGE SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
          <HardDrive className="w-4 h-4 text-indigo-600 mr-1.5" />
          5. Data & Privacy, Budget, and Backups
        </h2>

        {/* Monthly Budget Setting */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Monthly Spending Budget</h3>
            <p className="text-xs text-slate-500">Set your monthly limit to receive spending progress alerts.</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
            />
            <button
              onClick={handleSaveBudget}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Save
            </button>
          </div>
        </div>

        {/* Export Data */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Export Finance Data</h3>
            <p className="text-xs text-slate-500">Download your transactions to CSV spreadsheet, JSON, or print PDF report.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={exportJSON}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON Backup</span>
            </button>
            <button
              onClick={handleExportPdfReport}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Restore Backup */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Restore Backup</h3>
            <p className="text-xs text-slate-500">Import a previously saved JSON backup file.</p>
          </div>
          <label className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center space-x-1 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore File</span>
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>
        </div>

        {/* Delete Local Data */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h3 className="text-sm font-semibold text-rose-600">Delete Local Data / Reset App</h3>
            <p className="text-xs text-slate-500">Permanently delete all financial records for this user from this device.</p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition-colors"
          >
            Delete Data
          </button>
        </div>
      </div>

      {/* 6. APPLICATION & BUILD SECTION */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold">6. Application & Build Info</h2>
            <p className="text-xs text-slate-400">FinanceTracker v1.0.0 • Local-First React + Capacitor</p>
          </div>
        </div>

        {!isNativeApp ? (
          <div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Download the standalone release APK for Android devices directly without Play Store dependencies.
            </p>
            <button
              onClick={() => {
                if (apkUrl && apkUrl.trim() !== '') {
                  window.location.href = apkUrl;
                } else {
                  alert('Android APK download link: Configured via VITE_ANDROID_APK_URL.');
                }
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center space-x-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download Release APK</span>
            </button>
          </div>
        ) : (
          <p className="text-xs text-emerald-400 font-medium">
            ✓ Running inside standalone native Android app build.
          </p>
        )}
      </div>

      {/* SMS Consent Explanation Dialog */}
      {isSmsConsentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Automatic Transaction Detection</h3>
                <p className="text-xs text-slate-500">Local-First SMS Processing</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This app can read eligible transaction SMS messages from banks and UPI apps to automatically track expenses and income.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your SMS messages are processed <strong>locally on this device</strong>. No SMS data is uploaded to the server.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSmsConsentOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSmsConsent}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30"
              >
                Grant Permission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated SMS Test Modal */}
      {smsTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Test SMS Transaction Detection</h3>
              <button type="button" onClick={() => setSmsTestModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500">Pick a sample SMS trigger or paste custom bank SMS text to test real transaction creation:</p>

            <div className="space-y-2">
              {transactionDetectionService.getSampleSmsList().map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunSimulatedSms(sample)}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-xs font-mono text-slate-800 transition-colors"
                >
                  "{sample}"
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Custom Bank SMS Text
              </label>
              <textarea
                rows="3"
                value={simulatedSmsText}
                onChange={(e) => setSimulatedSmsText(e.target.value)}
                placeholder="e.g. Your UPI payment of Rs.650 to ZOMATO was successful."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleRunSimulatedSms(simulatedSmsText)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md"
            >
              Run SMS Detection & Create Transaction
            </button>
          </div>
        </div>
      )}

      {/* PIN Setup Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6">
            {!generatedKey ? (
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-lg">
                    {securityData.isPinSet ? 'Change PIN' : 'Set Up App PIN'}
                  </h3>
                  <button type="button" onClick={() => setIsPinModalOpen(false)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {pinError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                    {pinError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-center tracking-[0.5em] text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    required
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-center tracking-[0.5em] text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-2"
                >
                  {securityData.isPinSet ? 'Update PIN' : 'Continue to Recovery Key'}
                </button>
              </form>
            ) : (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Save Your Recovery Key</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Store this 16-character key in a safe place. You will need it if you forget your PIN.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between font-mono text-base font-bold text-slate-900 tracking-wider">
                  <span>{generatedKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <label className="flex items-center space-x-2 text-xs text-slate-700 text-left cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isKeyConfirmed}
                    onChange={(e) => setIsKeyConfirmed(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>I have saved my Recovery Key in a secure place.</span>
                </label>

                {pinError && (
                  <p className="text-xs text-rose-600 font-medium">{pinError}</p>
                )}

                <button
                  type="button"
                  onClick={handleFinishFirstSetup}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Complete PIN Setup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reveal Recovery Key Modal */}
      {isRevealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Recovery Key Verification</h3>
              <button type="button" onClick={() => setIsRevealModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {!isKeyRevealed ? (
              <form onSubmit={handleRevealRecoveryKey} className="space-y-4">
                <p className="text-xs text-slate-500">Enter your 4-digit security PIN to reveal your Recovery Key verifier metadata.</p>
                {revealError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                    {revealError}
                  </div>
                )}
                <input
                  type="password"
                  maxLength="6"
                  required
                  value={verifyPinInput}
                  onChange={(e) => setVerifyPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-center tracking-[0.5em] text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Verify PIN & Reveal Key
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-500">Your Recovery Key is active and stored securely as a verifier hash. If you forgot your PIN, click "Forgot PIN" on the unlock screen to reset.</p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs font-semibold text-slate-700">
                  Status: Verifier Hash Active (16 Alphanumeric Format)
                </div>
                <button
                  onClick={() => setIsRevealModalOpen(false)}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete PIN Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeletePinConfirmOpen}
        onClose={() => setIsDeletePinConfirmOpen(false)}
        onConfirm={handleDeletePin}
        title="Delete Security PIN?"
        message="This will remove your 4-digit security PIN and Recovery Key requirement. The application will open directly without locking on launch. You can set up a new PIN anytime."
      />

      {/* Destructive Wiping Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleDestructiveReset}
        title="Permanently Delete Local Data?"
        message="This will permanently delete all transactions, custom categories, accounts, and local preferences for this user from this device. This action CANNOT be undone."
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

