import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, X } from 'lucide-react';

export default function SmsPermissionModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { toggleSmsDetection, scanExistingSmsInbox } = useFinance();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  if (!isOpen) return null;

  const handleGrant = async () => {
    setScanning(true);
    setScanResult(null);

    const { transactionDetectionService } = await import('../services/transactionDetectionService');
    const permRes = await transactionDetectionService.requestPermissions();

    if (permRes.granted) {
      toggleSmsDetection(true);
      // Automatically trigger 2-3 months inbox scan newest first
      const scanRes = await scanExistingSmsInbox();
      setScanning(false);
      setScanResult(scanRes);
      
      // Save prompt response for current user
      if (user?.id) {
        localStorage.setItem(`finance_sms_prompt_answered_${user.id}`, 'true');
      }

      setTimeout(() => {
        onClose();
      }, 2500);
    } else {
      setScanning(false);
      if (user?.id) {
        localStorage.setItem(`finance_sms_prompt_answered_${user.id}`, 'true');
      }
      onClose();
    }
  };

  const handleSkip = () => {
    if (user?.id) {
      localStorage.setItem(`finance_sms_prompt_answered_${user.id}`, 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 md:p-8 space-y-6 relative">
        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Icon */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Smart Auto-Tracking
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">Enable Automatic SMS Scanner</h2>
          </div>
        </div>

        {/* Body Text */}
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p className="font-medium text-slate-800 text-sm">
            Automatically track expenses & income from your bank & UPI messages!
          </p>
          <p>
            When granted, Personal Finance Tracker scans your SMS inbox for transaction notifications over the last 2–3 months and categorizes them automatically.
          </p>
        </div>

        {/* Local Security Highlight Box */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-xs text-emerald-950">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong>100% Local & Private:</strong> All SMS parsing is performed entirely on your device. Zero SMS data or financial information is ever uploaded to external servers.
          </div>
        </div>

        {/* Scan Status / Result Notice */}
        {scanning && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center space-x-3 text-xs font-semibold text-indigo-900 animate-pulse">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span>Scanning SMS inbox (last 2–3 months, newest first)...</span>
          </div>
        )}

        {scanResult && scanResult.success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Scan Complete! Categorized {scanResult.createdCount} new transactions ({scanResult.duplicateCount} duplicates skipped).</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            disabled={scanning}
            onClick={handleSkip}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors disabled:opacity-50"
          >
            Skip for Now
          </button>

          <button
            type="button"
            disabled={scanning}
            onClick={handleGrant}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <span>{scanning ? 'Granting & Scanning...' : 'Grant SMS Access'}</span>
            {!scanning && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
