import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionDetectionService } from '../services/transactionDetectionService';
import { Shield, KeyRound, Lock, AlertCircle, Fingerprint, HelpCircle, Palette, Utensils, Car } from 'lucide-react';

export default function PinLockScreen() {
  const { unlockAppWithPin, resetPinWithRecoveryKey, resetPinWithSecurityQuestions, securityData, setIsPinLocked } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Attempt Counter & Lockout state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Forgot PIN / Reset mode
  const [forgotTab, setForgotTab] = useState(null); // null | 'KEY' | 'QUESTIONS'
  const [recoveryKey, setRecoveryKey] = useState('');
  const [ansColor, setAnsColor] = useState('');
  const [ansFood, setAnsFood] = useState('');
  const [ansCar, setAnsCar] = useState('');

  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Lockout Countdown Effect
  useEffect(() => {
    let interval;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Auto-trigger native biometric prompt on mount if enabled
  useEffect(() => {
    if (securityData?.biometricEnabled) {
      handleBiometricUnlock();
    }
  }, []);

  const handleBiometricUnlock = async () => {
    setError('');
    const res = await transactionDetectionService.authenticateBiometric();
    if (res.success) {
      setIsPinLocked(false);
    } else {
      setError(res.reason || 'Biometric authentication failed.');
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');

    if (lockoutTimer > 0) {
      setError(`Locked due to multiple failed attempts. Try again in ${lockoutTimer}s.`);
      return;
    }

    if (!pin || pin.length < 4) {
      setError('Please enter your 4-digit PIN.');
      return;
    }

    const { hashPin } = await import('../utils/cryptoUtils');
    const enteredHash = await hashPin(pin);

    const success = unlockAppWithPin(enteredHash);
    if (!success) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPin('');
      if (newAttempts >= 5) {
        setLockoutTimer(30);
        setError('Too many failed attempts! PIN entry locked for 30 seconds.');
      } else {
        setError(`Incorrect PIN (${5 - newAttempts} attempt${5 - newAttempts === 1 ? '' : 's'} remaining).`);
      }
    } else {
      setFailedAttempts(0);
    }
  };

  const handleResetWithKey = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!recoveryKey.trim()) {
      setForgotError('Please enter your Recovery Key.');
      return;
    }
    if (!newPin || newPin.length < 4) {
      setForgotError('New PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setForgotError('New PINs do not match.');
      return;
    }

    try {
      await resetPinWithRecoveryKey(recoveryKey, newPin);
      setForgotTab(null);
    } catch (err) {
      setForgotError(err.message || 'Invalid Recovery Key.');
    }
  };

  const handleResetWithQuestions = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!ansColor.trim() || !ansFood.trim() || !ansCar.trim()) {
      setForgotError('Please answer all 3 security questions.');
      return;
    }
    if (!newPin || newPin.length < 4) {
      setForgotError('New PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setForgotError('New PINs do not match.');
      return;
    }

    try {
      await resetPinWithSecurityQuestions(ansColor, ansFood, ansCar, newPin);
      setForgotTab(null);
    } catch (err) {
      setForgotError(err.message || 'Incorrect security question answers.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 text-center animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          <Lock className="w-7 h-7 text-white" />
        </div>

        {!forgotTab ? (
          <>
            <h2 className="text-xl font-extrabold text-slate-900">Enter PIN</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">Enter your 4-digit security PIN to unlock</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-6">
              <input
                type="password"
                maxLength="6"
                disabled={lockoutTimer > 0}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-[1em] text-2xl font-extrabold py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={lockoutTimer > 0}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                {lockoutTimer > 0 ? `Locked (${lockoutTimer}s)` : 'Unlock Application'}
              </button>
            </form>

            {/* Biometrics Unlock Button (if enabled) */}
            {securityData.biometricEnabled && (
              <button
                type="button"
                onClick={handleBiometricUnlock}
                className="w-full mt-3 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 border border-emerald-200"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Unlock with Biometrics</span>
              </button>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-4 text-xs font-semibold text-indigo-600">
              <button
                onClick={() => {
                  setForgotTab('KEY');
                  setForgotError('');
                }}
                className="hover:underline"
              >
                Reset via Recovery Key
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setForgotTab('QUESTIONS');
                  setForgotError('');
                }}
                className="hover:underline"
              >
                Security Questions
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-extrabold text-slate-900">Reset PIN</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {forgotTab === 'KEY' ? 'Enter 16-character Recovery Key' : 'Answer Security Questions'}
            </p>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {forgotError}
              </div>
            )}

            {forgotTab === 'KEY' ? (
              <form onSubmit={handleResetWithKey} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Recovery Key (XXXX-XXXX-XXXX-XXXX)
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value)}
                    placeholder="K9P2-4R7X-M1B8-9T3Q"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    New 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New PIN
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    required
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-2"
                >
                  Reset PIN & Unlock
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetWithQuestions} className="space-y-3 text-left">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    1. Favorite Color?
                  </label>
                  <input
                    type="text"
                    required
                    value={ansColor}
                    onChange={(e) => setAnsColor(e.target.value)}
                    placeholder="Your answer"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    2. Favorite Food?
                  </label>
                  <input
                    type="text"
                    required
                    value={ansFood}
                    onChange={(e) => setAnsFood(e.target.value)}
                    placeholder="Your answer"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    3. Dream Car?
                  </label>
                  <input
                    type="text"
                    required
                    value={ansCar}
                    onChange={(e) => setAnsCar(e.target.value)}
                    placeholder="Your answer"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    New 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Confirm New PIN
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    required
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-2"
                >
                  Verify Answers & Reset PIN
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setForgotTab(null)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-3 block"
            >
              Back to PIN Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

