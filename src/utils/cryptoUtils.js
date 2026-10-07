/**
 * Utility functions for PIN hashing, Recovery Key generation, and verification.
 */

// Simple SHA-256 implementation using SubtleCrypto (available in browser & Capacitor environment)
async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
/**
 * Generates a cryptographically random 16-character alphanumeric Recovery Key formatted as XXXX-XXXX-XXXX-XXXX
 */
export function generateRecoveryKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid easily confused chars (I, O, 1, 0)
  let raw = '';
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  
  for (let i = 0; i < 16; i++) {
    raw += chars[randomBytes[i] % chars.length];
  }
  
  // Format as XXXX-XXXX-XXXX-XXXX
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

/**
 * Hashes a 4-digit or 6-digit numeric PIN for secure verifier storage
 */
export async function hashPin(pin) {
  if (!pin) return '';
  return await sha256(`pin_salt_2026_${pin}`);
}

/**
 * Verifies an entered PIN against a stored verifier hash
 */
export async function verifyPin(enteredPin, storedHash) {
  if (!enteredPin || !storedHash) return false;
  const hash = await hashPin(enteredPin);
  return hash === storedHash;
}

/**
 * Normalizes a Recovery Key string (removes dashes/spaces, converts to uppercase)
 */
export function normalizeRecoveryKey(key) {
  if (!key) return '';
  return key.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Hashes a Recovery Key for safe verifier storage
 */
export async function hashRecoveryKey(recoveryKey) {
  const normalized = normalizeRecoveryKey(recoveryKey);
  if (!normalized) return '';
  return await sha256(`recovery_salt_2026_${normalized}`);
}

/**
 * Verifies an entered Recovery Key against the stored verifier hash
 */
export async function verifyRecoveryKey(enteredKey, storedHash) {
  if (!enteredKey || !storedHash) return false;
  const hash = await hashRecoveryKey(enteredKey);
  return hash === storedHash;
}
