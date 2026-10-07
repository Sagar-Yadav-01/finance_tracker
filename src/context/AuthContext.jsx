import React, { createContext, useContext, useState, useEffect } from 'react';
import { financeService } from '../services/financeService';
import { hashPin, hashRecoveryKey, generateRecoveryKey } from '../utils/cryptoUtils';

const AuthContext = createContext();

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://remarkable-tenderness-production-139f.up.railway.app/api';

// Local User Registry helper functions for offline password verification
const getLocalRegistry = () => {
  try {
    return JSON.parse(localStorage.getItem('finance_local_user_registry') || '{}');
  } catch (e) {
    return {};
  } 
};

const saveLocalUserInRegistry = (userObj, password, securityQuestions = null) => {
  const reg = getLocalRegistry();
  const key = userObj.email.toLowerCase();
  reg[key] = {
    user: userObj,
    password: password,
    securityQuestions: securityQuestions || reg[key]?.securityQuestions || null
  };
  localStorage.setItem('finance_local_user_registry', JSON.stringify(reg));
};

const verifyLocalUserCredentials = (identifier, password) => {
  const reg = getLocalRegistry();
  const idLower = (identifier || '').toLowerCase().trim();

  for (const key of Object.keys(reg)) {
    const entry = reg[key];
    const user = entry.user;
    if (
      user.email.toLowerCase() === idLower ||
      user.name.toLowerCase() === idLower ||
      user.id.toLowerCase() === idLower
    ) {
      if (entry.password === password) {
        return user;
      }
      return false; // Password mismatch
    }
  }
  return null; // Account not registered locally
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('finance_auth_token') || null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('finance_theme') || 'light');
  const [securityData, setSecurityData] = useState({
    isPinSet: false,
    pinVerifierHash: null,
    recoveryKeyHash: null,
    biometricEnabled: false,
    securityQuestions: null, // { q1_color, q2_food, q3_car }
    isFirstLaunchDone: false
  });
  const [isPinLocked, setIsPinLocked] = useState(false);

  // Apply theme class on <html> element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finance_theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  // Check auth state on startup
  useEffect(() => {
    async function checkAuth() {
      if (token) {
        if (token.startsWith('local_token_')) {
          const cachedUser = JSON.parse(localStorage.getItem('finance_cached_user') || 'null');
          if (cachedUser) {
            setUser(cachedUser);
            financeService.initialize(cachedUser.id);
            const sec = await financeService.getSecurityData();
            setSecurityData(sec);
            if (sec.isPinSet) {
              setIsPinLocked(true);
            }
          } else {
            logout();
          }
          setLoading(false);
          return;
        }

        try {
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            financeService.initialize(data.user.id);
            const sec = await financeService.getSecurityData();
            setSecurityData(sec);
            if (sec.isPinSet) {
              setIsPinLocked(true);
            }
          } else {
            const cachedUser = JSON.parse(localStorage.getItem('finance_cached_user') || 'null');
            if (cachedUser) {
              setUser(cachedUser);
              financeService.initialize(cachedUser.id);
              const sec = await financeService.getSecurityData();
              setSecurityData(sec);
              if (sec.isPinSet) {
                setIsPinLocked(true);
              }
            } else {
              logout();
            }
          }
        } catch (err) {
          console.warn('[AUTH CHECK WARNING] Backend offline or network error. Using cached local session if available.');
          const cachedUser = JSON.parse(localStorage.getItem('finance_cached_user') || 'null');
          if (cachedUser) {
            setUser(cachedUser);
            financeService.initialize(cachedUser.id);
            const sec = await financeService.getSecurityData();
            setSecurityData(sec);
            if (sec.isPinSet) {
              setIsPinLocked(true);
            }
          }
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (identifier, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = (data.message || '').toLowerCase();
        const isOfflineOrDbError = res.status === 503 || res.status === 502 || msg.includes('database') || msg.includes('offline');

        if (isOfflineOrDbError) {
          const verifiedUser = verifyLocalUserCredentials(identifier, password);
          if (verifiedUser === false) {
            throw new Error('Invalid email, name, or password.');
          }
          const userObj = verifiedUser || { id: `user_local_${identifier.replace(/[^a-zA-Z0-9]/g, '_')}`, name: identifier.split('@')[0], email: identifier };
          if (!verifiedUser) {
            saveLocalUserInRegistry(userObj, password);
          }
          const localToken = `local_token_${Date.now()}`;
          localStorage.setItem('finance_auth_token', localToken);
          localStorage.setItem('finance_cached_user', JSON.stringify(userObj));
          setToken(localToken);
          setUser(userObj);
          financeService.initialize(userObj.id);
          const sec = await financeService.getSecurityData();
          setSecurityData(sec);
          return userObj;
        }
        throw new Error(data.message || 'Invalid email, name, or password.');
      }

      localStorage.setItem('finance_auth_token', data.token);
      localStorage.setItem('finance_cached_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      financeService.initialize(data.user.id);
      saveLocalUserInRegistry(data.user, password);

      const sec = await financeService.getSecurityData();
      setSecurityData(sec);
      if (sec.isPinSet) {
        setIsPinLocked(true);
      }
      return data.user;
    } catch (err) {
      if (err.message.includes('Invalid')) {
        throw err;
      }
      if (err.message.includes('fetch') || err.message.includes('Unexpected token') || err.name === 'SyntaxError' || err.message.toLowerCase().includes('database') || err.message.toLowerCase().includes('offline')) {
        const verifiedUser = verifyLocalUserCredentials(identifier, password);
        if (verifiedUser === false) {
          throw new Error('Invalid email, name, or password.');
        }
        const userObj = verifiedUser || { id: `user_local_${identifier.replace(/[^a-zA-Z0-9]/g, '_')}`, name: identifier.split('@')[0], email: identifier };
        if (!verifiedUser) {
          saveLocalUserInRegistry(userObj, password);
        }
        const localToken = `local_token_${Date.now()}`;
        localStorage.setItem('finance_auth_token', localToken);
        localStorage.setItem('finance_cached_user', JSON.stringify(userObj));
        setToken(localToken);
        setUser(userObj);
        financeService.initialize(userObj.id);
        const sec = await financeService.getSecurityData();
        setSecurityData(sec);
        return userObj;
      }
      throw err;
    }
  };

  const signup = async (name, email, password, confirmPassword, securityQuestions = null) => {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = (data.message || '').toLowerCase();
        const isOfflineOrDbError = res.status === 503 || res.status === 502 || msg.includes('database') || msg.includes('offline');

        if (isOfflineOrDbError) {
          console.warn('[AUTH WARNING] Backend offline. Creating account in local-first mode.');
          const userObj = { id: `user_local_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, name, email };
          saveLocalUserInRegistry(userObj, password, securityQuestions);
          const localToken = `local_token_${Date.now()}`;
          localStorage.setItem('finance_auth_token', localToken);
          localStorage.setItem('finance_cached_user', JSON.stringify(userObj));
          setToken(localToken);
          setUser(userObj);
          financeService.initialize(userObj.id);
          if (securityQuestions) {
            const sec = await financeService.getSecurityData();
            const updatedSec = { ...sec, securityQuestions };
            await financeService.saveSecurityData(updatedSec);
            setSecurityData(updatedSec);
          }
          return userObj;
        }
        throw new Error(data.message || 'Signup failed.');
      }

      localStorage.setItem('finance_auth_token', data.token);
      localStorage.setItem('finance_cached_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      financeService.initialize(data.user.id);
      saveLocalUserInRegistry(data.user, password, securityQuestions);

      if (securityQuestions) {
        const sec = await financeService.getSecurityData();
        const updatedSec = { ...sec, securityQuestions };
        await financeService.saveSecurityData(updatedSec);
        setSecurityData(updatedSec);
      }

      return data.user;
    } catch (err) {
      if (err.message === 'Passwords do not match.' || err.message.includes('already registered')) {
        throw err;
      }
      if (err.message.includes('fetch') || err.message.includes('Unexpected token') || err.name === 'SyntaxError' || err.message.toLowerCase().includes('database') || err.message.toLowerCase().includes('offline')) {
        console.warn('[AUTH WARNING] Backend server or MySQL unreachable. Creating account in local-first mode.');
        const userObj = { id: `user_local_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, name, email };
        saveLocalUserInRegistry(userObj, password, securityQuestions);
        const localToken = `local_token_${Date.now()}`;
        localStorage.setItem('finance_auth_token', localToken);
        localStorage.setItem('finance_cached_user', JSON.stringify(userObj));
        setToken(localToken);
        setUser(userObj);
        financeService.initialize(userObj.id);
        if (securityQuestions) {
          const sec = await financeService.getSecurityData();
          const updatedSec = { ...sec, securityQuestions };
          await financeService.saveSecurityData(updatedSec);
          setSecurityData(updatedSec);
        }
        return userObj;
      }
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('finance_auth_token');
    localStorage.removeItem('finance_cached_user');
    setToken(null);
    setUser(null);
    setIsPinLocked(false);
  };

  // PIN & Security Questions & Recovery Key Management
  const setupPinAndRecoveryKey = async (pin) => {
    if (!user) throw new Error('User must be logged in to setup PIN');
    const pinHash = await hashPin(pin);
    const rawRecoveryKey = generateRecoveryKey();
    const recHash = await hashRecoveryKey(rawRecoveryKey);

    const updatedSec = {
      ...securityData,
      isPinSet: true,
      pinVerifierHash: pinHash,
      recoveryKeyHash: recHash,
      isFirstLaunchDone: true
    };

    await financeService.saveSecurityData(updatedSec);
    setSecurityData(updatedSec);
    setIsPinLocked(false);
    return rawRecoveryKey;
  };

  const updatePin = async (newPin) => {
    const pinHash = await hashPin(newPin);
    const updatedSec = {
      ...securityData,
      isPinSet: true,
      pinVerifierHash: pinHash
    };
    await financeService.saveSecurityData(updatedSec);
    setSecurityData(updatedSec);
  };

  const saveSecurityQuestions = async (questions) => {
    const updatedSec = {
      ...securityData,
      securityQuestions: questions
    };
    await financeService.saveSecurityData(updatedSec);
    setSecurityData(updatedSec);
  };

  const resetPinWithRecoveryKey = async (enteredKey, newPin) => {
    const recHash = await hashRecoveryKey(enteredKey);
    if (recHash !== securityData.recoveryKeyHash) {
      throw new Error('Invalid Recovery Key.');
    }

    const newPinHash = await hashPin(newPin);
    const updatedSec = {
      ...securityData,
      isPinSet: true,
      pinVerifierHash: newPinHash
    };

    await financeService.saveSecurityData(updatedSec);
    setSecurityData(updatedSec);
    setIsPinLocked(false);
    return true;
  };

  const resetPinWithSecurityQuestions = async (ansColor, ansFood, ansCar, newPin) => {
    const questions = securityData.securityQuestions;
    if (!questions) {
      throw new Error('No security questions configured for this account.');
    }

    const cMatch = (ansColor || '').toLowerCase().trim() === (questions.q1_color || '').toLowerCase().trim();
    const fMatch = (ansFood || '').toLowerCase().trim() === (questions.q2_food || '').toLowerCase().trim();
    const carMatch = (ansCar || '').toLowerCase().trim() === (questions.q3_car || '').toLowerCase().trim();

    if (!cMatch || !fMatch || !carMatch) {
      throw new Error('One or more security question answers are incorrect.');
    }

    const newPinHash = await hashPin(newPin);
    const updatedSec = {
      ...securityData,
      isPinSet: true,
      pinVerifierHash: newPinHash
    };

    await financeService.saveSecurityData(updatedSec);
    setSecurityData(updatedSec);
    setIsPinLocked(false);
    return true;
  };

  const unlockAppWithPin = (enteredPinHash) => {
    if (enteredPinHash === securityData.pinVerifierHash) {
      setIsPinLocked(false);
      return true;
    }
    return false;
  };

  const deletePin = async () => {
    const updatedSec = {
      isPinSet: false,
      pinVerifierHash: null,
      recoveryKeyHash: null,
      biometricEnabled: false,
      securityQuestions: securityData.securityQuestions,
      isFirstLaunchDone: securityData.isFirstLaunchDone
    };
    await financeService.saveSecurityData(updatedSec);
    setSecurityData(updatedSec);
    setIsPinLocked(false);
  };

  const toggleBiometric = async (enabled) => {
    const updatedSec = {
      ...securityData,
      biometricEnabled: enabled
    };
    await financeService.saveSecurityData(updatedSec);
    setSecurityData(updatedSec);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      theme,
      toggleTheme,
      login,
      signup,
      logout,
      securityData,
      isPinLocked,
      setIsPinLocked,
      setupPinAndRecoveryKey,
      updatePin,
      deletePin,
      saveSecurityQuestions,
      resetPinWithRecoveryKey,
      resetPinWithSecurityQuestions,
      unlockAppWithPin,
      toggleBiometric
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

