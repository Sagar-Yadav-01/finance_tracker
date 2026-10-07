import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountSwitcher from '../components/AccountSwitcher';
import PinLockScreen from '../pages/PinLockScreen';
import SmsPermissionModal from '../components/SmsPermissionModal';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  PieChart, 
  Tag, 
  Settings as SettingsIcon, 
  LogOut, 
  ShieldCheck,
  Smartphone
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout, isPinLocked } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showSmsModal, setShowSmsModal] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      const answered = localStorage.getItem(`finance_sms_prompt_answered_${user.id}`);
      if (answered !== 'true') {
        setShowSmsModal(true);
      }
    }
  }, [user]);

  let isNativeApp = false;
  try {
    isNativeApp = Capacitor.isNativePlatform();
  } catch (e) {
    isNativeApp = false;
  }

  // Handle Native Android Hardware Back Button
  useEffect(() => {
    if (!isNativeApp) return;

    let handler;
    async function setupBackButton() {
      handler = await App.addListener('backButton', () => {
        if (location.pathname === '/dashboard' || location.pathname === '/') {
          App.exitApp();
        } else {
          navigate(-1);
        }
      });
    }

    setupBackButton();

    return () => {
      if (handler && typeof handler.remove === 'function') {
        handler.remove();
      }
    };
  }, [isNativeApp, location.pathname, navigate]);

  const handleApkDownload = () => {
    const apkUrl = import.meta.env.VITE_ANDROID_APK_URL || '/personal-finance-tracker.apk';
    const a = document.createElement('a');
    a.href = apkUrl;
    a.download = 'personal-finance-tracker.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Mobile Navigation (5 primary items)
  const mobileNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: Receipt },
    { path: '/accounts', label: 'Accounts', icon: Wallet },
    { path: '/analytics', label: 'Analytics', icon: PieChart },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Desktop Sidebar Navigation (All 6 items)
  const desktopNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: Receipt },
    { path: '/accounts', label: 'Accounts', icon: Wallet },
    { path: '/analytics', label: 'Analytics', icon: PieChart },
    { path: '/categories', label: 'Categories', icon: Tag },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (isPinLocked) {
    return <PinLockScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen p-4 flex-shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-3 py-4 mb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block">FinanceTracker</span>
            <span className="text-[11px] text-slate-400 font-medium">Local-First Vault</span>
          </div>
        </div>

        {/* Global Account Switcher in Sidebar */}
        <div className="px-3 mb-6">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
            Active Account Filter
          </span>
          <AccountSwitcher align="left" />
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          {desktopNavItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Download APK Button in Sidebar (WEBSITE ONLY) */}
        {!isNativeApp && (
          <div className="px-3 mb-4">
            <button
              onClick={handleApkDownload}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download Android APK</span>
            </button>
          </div>
        )}

        {/* User Info & Logout */}
        <div className="pt-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded-xl">
            <div className="truncate mr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP HEADER */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm">FinanceTracker</span>
        </div>
        <div className="flex items-center space-x-2">
          {!isNativeApp && (
            <button
              onClick={handleApkDownload}
              title="Download Android APK"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>APK</span>
            </button>
          )}
          <AccountSwitcher align="right" />
        </div>
      </header>

      {/* DESKTOP TOP HEADER BAR */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Local-First Vault Session:</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {user?.email || 'Authenticated User'}
            </span>
          </div>

          {!isNativeApp && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleApkDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Download Android APK</span>
              </button>
            </div>
          )}
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-32 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Fixed, 5 core items) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-2 flex justify-around items-center shadow-lg pb-[env(safe-area-inset-bottom,8px)]">
        {mobileNavItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2.5 rounded-xl text-[11px] font-medium transition-colors ${
                  isActive ? 'text-indigo-600 font-semibold bg-indigo-50/70' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* SMS Permission Access Pop-Up Modal */}
      <SmsPermissionModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
      />

    </div>
  );
}

