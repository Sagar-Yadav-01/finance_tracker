import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Shield, Smartphone, HardDrive, Lock, ArrowRight, Download, SmartphoneNfc } from 'lucide-react';

export default function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const apkUrl = import.meta.env.VITE_ANDROID_APK_URL || '/personal-finance-tracker.apk';

  let isNativeApp = false;
  try {
    isNativeApp = Capacitor.isNativePlatform();
  } catch (e) {
    isNativeApp = false;
  }

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setCanInstallPwa(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleApkDownload = () => {
    const url = apkUrl.trim() !== '' ? apkUrl : '/personal-finance-tracker.apk';
    const a = document.createElement('a');
    a.href = url;
    a.download = 'personal-finance-tracker.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 px-6 py-4 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Personal Finance Tracker</span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="text-sm font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-semibold mb-6 mx-auto">
          <Lock className="w-3.5 h-3.5" />
          <span>100% Local-First & Private</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Master Your Financial Freedom <br />
          <span className="bg-gradient-to-r from-indigo-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Without Cloud Exposure.
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Track expenses, income, accounts, Cash, Bank, and UPI transactions in real-time. Your personal financial transactions stay encrypted on your device — never on cloud servers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Start Tracking Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {canInstallPwa && (
            <button
              onClick={handleInstallPwa}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Install Web App</span>
            </button>
          )}

          {!isNativeApp && (
            <button
              onClick={handleApkDownload}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-all"
            >
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Download Android APK</span>
            </button>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/60 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Local Storage Architecture</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Financial data lives in your browser's localStorage or Android's private SQLite database. Zero cloud databases.
            </p>
          </div>

          <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/60 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <SmartphoneNfc className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cash, Bank & UPI Separate</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Separate payment methods from bank accounts. No double counting, clean transaction tracking.
            </p>
          </div>

          <div className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/60 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">PIN & Recovery Key</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Android companion app includes 4-digit PIN lock and 16-character Recovery Key reset capability.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Personal Finance Tracker. All financial data remains locally stored on your device.
      </footer>
    </div>
  );
}
