import { categorizationEngine } from './categorizationEngine.js';

export const INDIAN_BANKS = [
  { code: 'SBI', name: 'State Bank of India', keywords: ['sbi', 'state bank'] },
  { code: 'BOB', name: 'Bank of Baroda', keywords: ['bob', 'baroda'] },
  { code: 'HDFC', name: 'HDFC Bank', keywords: ['hdfc'] },
  { code: 'ICICI', name: 'ICICI Bank', keywords: ['icici'] },
  { code: 'AXIS', name: 'Axis Bank', keywords: ['axis'] },
  { code: 'PNB', name: 'Punjab National Bank', keywords: ['pnb', 'punjab national'] },
  { code: 'KOTAK', name: 'Kotak Mahindra Bank', keywords: ['kotak'] },
  { code: 'CANARA', name: 'Canara Bank', keywords: ['canara'] },
  { code: 'UNION', name: 'Union Bank of India', keywords: ['union bank', 'uboi'] },
  { code: 'INDUSIND', name: 'IndusInd Bank', keywords: ['indusind'] },
  { code: 'PAYTM', name: 'Paytm Payments Bank', keywords: ['paytm'] },
  { code: 'IDFC', name: 'IDFC First Bank', keywords: ['idfc'] },
  { code: 'YES', name: 'Yes Bank', keywords: ['yes bank'] },
  { code: 'FEDERAL', name: 'Federal Bank', keywords: ['federal'] },
  { code: 'RBL', name: 'RBL Bank', keywords: ['rbl'] },
  { code: 'BOI', name: 'Bank of India', keywords: ['bank of india', 'boi'] },
  { code: 'CENTRAL', name: 'Central Bank of India', keywords: ['central bank'] },
  { code: 'IOB', name: 'Indian Overseas Bank', keywords: ['iob', 'indian overseas'] },
  { code: 'UCO', name: 'UCO Bank', keywords: ['uco bank', 'uco'] }
];

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

export function parseSmsTime(text) {
  if (!text) return null;
  // Match 11:48:00 PM, 11:48 PM, 23:48:00, 18:24, 02:15:30 am
  const timeMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2];
    const ampm = timeMatch[4] ? timeMatch[4].toUpperCase() : null;

    if (ampm) {
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
    }
    const formattedHour = String(hour).padStart(2, '0');
    return `${formattedHour}:${minute}`;
  }
  return null;
}

export function parseSmsDate(text) {
  if (!text) return null;

  // 1. ISO format: 2026-09-06 or 2026/09/06 or 2026.09.06
  const isoMatch = text.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day);
  }

  // 2. Day-MonthName-Year format: 14Aug26, 14-Aug-2026, 14th-Aug-2026, 14 Aug 26, 14th August 2026
  const dayMonthYearMatch = text.match(/\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?[-/\s]?([A-Za-z]{3,9})[-/\s]?(20\d{2}|\d{2})\b/i);
  if (dayMonthYearMatch) {
    const day = parseInt(dayMonthYearMatch[1], 10);
    const monthStr = dayMonthYearMatch[2].toLowerCase().slice(0, 3);
    let yearStr = dayMonthYearMatch[3];
    if (yearStr.length === 2) yearStr = '20' + yearStr;
    const year = parseInt(yearStr, 10);

    if (MONTH_MAP[monthStr] !== undefined) {
      return new Date(year, MONTH_MAP[monthStr], day);
    }
  }

  // 3. Day-Month-Year numeric format: 14/08/2026, 14-08-26, 14.08.2026, 06-09-2026
  const numericMatch = text.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2}|\d{2})\b/);
  if (numericMatch) {
    const day = parseInt(numericMatch[1], 10);
    const month = parseInt(numericMatch[2], 10) - 1;
    let yearStr = numericMatch[3];
    if (yearStr.length === 2) yearStr = '20' + yearStr;
    const year = parseInt(yearStr, 10);
    return new Date(year, month, day);
  }

  // 4. MonthName Day, Year: Aug 14, 2026 or August 14, 2026
  const monthDayYearMatch = text.match(/\b([A-Za-z]{3,9})\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s+(20\d{2}|\d{2})\b/i);
  if (monthDayYearMatch) {
    const monthStr = monthDayYearMatch[1].toLowerCase().slice(0, 3);
    const day = parseInt(monthDayYearMatch[2], 10);
    let yearStr = monthDayYearMatch[3];
    if (yearStr.length === 2) yearStr = '20' + yearStr;
    const year = parseInt(yearStr, 10);

    if (MONTH_MAP[monthStr] !== undefined) {
      return new Date(year, MONTH_MAP[monthStr], day);
    }
  }

  // 5. Day-MonthName without year (e.g. "on 14Aug" or "on 14-Aug" or "on 14th Aug"): assume current year
  const dayMonthNoYearMatch = text.match(/\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?[-/\s]?([A-Za-z]{3,9})\b/i);
  if (dayMonthNoYearMatch) {
    const day = parseInt(dayMonthNoYearMatch[1], 10);
    const monthStr = dayMonthNoYearMatch[2].toLowerCase().slice(0, 3);
    if (MONTH_MAP[monthStr] !== undefined) {
      const year = new Date().getFullYear();
      return new Date(year, MONTH_MAP[monthStr], day);
    }
  }

  return null;
}

export function extractBank(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const b of INDIAN_BANKS) {
    // Special handling for Paytm to avoid classifying generic Paytm app promos as Paytm Payments Bank
    if (b.code === 'PAYTM') {
      const paytmBankRegex = /(?:paytm\s+(?:payments\s+)?bank|paytm\s+a\/c|paytm\s+account|paytm\s+wallet|paytm\s+fastag)/i;
      if (!paytmBankRegex.test(lower)) {
        continue;
      }
    }

    for (const kw of b.keywords) {
      const regex = new RegExp(`(?:^|[^a-z0-9])${kw}(?:$|[^a-z0-9])`, 'i');
      if (regex.test(lower)) {
        return b;
      }
    }
  }
  return null;
}

/**
 * Robust Modular SMS Parser for extracting amount, merchant, type, account, payment method,
 * and unique deduplication fingerprints from raw SMS text.
 */
export const transactionParser = {
  shouldIgnore(text) {
    if (!text || typeof text !== 'string') return true;
    const lower = text.toLowerCase();

    // 1. Promotional & Telecom Recharge / Plan Expiry Keywords
    const ignoreKeywords = [
      'otp', 'verification code', 'security code', 'one time password',
      'pre-approved', 'apply now', 'personal loan', 'credit card offer',
      'cashback offer', 'congratulations', 'claim now', 'click here to',
      'discount', 'flat 50%', 'limited time offer', 'reward points',
      // Telecom & Recharge
      'recharge karein', 'abhi recharge', 'recharge now', 'recharged with',
      'plan expired', 'has expired', 'will expire', 'pack expired',
      'uninterrupted jio', 'uninterrupted airtel', 'uninterrupted vi',
      'jio services', 'airtel services', 'vi services',
      'dial 1991', 'dial 121', 'kripya andekha', 'andekha karein',
      'unlimited call', '100 sms/din', '4g + 5g', 'gb/d',
      'upcoming plan', 'current and upcoming plan', 'exciting recharge plans',
      'validity', 'recharge plan', 'recharge',
      // Promotional Rewards & App Offers
      'get ₹', 'get rs', 'off on first', 'first payment', 'first visa permit',
      'visa permit', 'win up to', 'earn up to', 'cashback of up to',
      'scratch card', 'promo code', 'use code', 'coupon', 'exclusive offer',
      'limited period', 'offer valid till', 'claim your', 'flat ₹', 'flat rs',
      'discount on', 'offer 70', 'offer 80', 'offer 90', 'ke liye',
      // Gateway Confirmation / External Receipt Notices
      'vide icici bank eazypay', 'vide eazypay', 'eazypay reference',
      'fee collection vide', 'confirmation vide', 'payment receipt vide'
    ];

    if (ignoreKeywords.some(kw => lower.includes(kw))) {
      return true;
    }

    // 2. Ignore messages with URLs unless there's an explicit financial debit/credit verb
    if (/(?:https?:\/\/|tiny\.jio|i\.airtel|bit\.ly|t\.co)/i.test(lower)) {
      const explicitTxnVerbs = ['debited', 'credited', 'spent', 'transferred', 'withdrawn', 'dr. from', 'dr from'];
      if (!explicitTxnVerbs.some(v => lower.includes(v))) {
        return true;
      }
    }

    // 3. Strict Financial Action Requirement: must contain at least one valid payment verb or signal
    const paymentActionSignals = [
      'debited', 'credited', 'spent', 'paid', 'transferred', 'received',
      'withdrawn', 'sent to', 'deposited', 'purchased', 'vpa', 'rrn',
      'txn id', 'ref no', 'reference', 'a/c', 'acct', 'account', 'dr. from', 'dr from', 'cr. to'
    ];

    const hasPaymentSignal = paymentActionSignals.some(sig => lower.includes(sig));
    if (!hasPaymentSignal) {
      return true;
    }

    return false;
  },

  extractMerchant(text) {
    if (!text) return 'General Merchant';

    const patterns = [
      /(?:transfer from|trf from|credited by|from)\s+([A-Za-z0-9\s&'-]+?)(?:\s+ref|\s+on|\s+via|\s+avl|\.|,|$)/i,
      /(?:to|at|info:?|vpa:?)\s+([A-Za-z0-9\s&'-]+?)(?:\s+on|\s+ref|\s+via|\s+val|\s+using|\.|,|$)/i,
      /(?:spent on|paid for)\s+([A-Za-z0-9\s&'-]+?)(?:\s+via|\s+ref|\.|,|$)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 1) {
        const candidate = match[1].trim();
        const lower = candidate.toLowerCase();
        if (!['a/c', 'account', 'upi', 'bank', 'your', 'rs', 'inr', 'user'].includes(lower)) {
          return candidate.toUpperCase();
        }
      }
    }

    const knownMerchants = [
      'SWIGGY', 'ZOMATO', 'DOMINOS', 'PIZZA HUT', 'KFC', 'MCDONALDS', 'STARBUCKS',
      'UBER', 'OLA', 'RAPIDO', 'IRCTC',
      'AMAZON', 'FLIPKART', 'MYNTRA', 'AJIO',
      'NETFLIX', 'SPOTIFY', 'PRIME', 'HOTSTAR', 'PVR', 'INOX',
      'ELECTRICITY', 'WATER', 'GAS', 'BROADBAND', 'RENT',
      'APOLLO', 'PHARMACY', 'MEDPLUS', 'HOSPITAL',
      'SALARY', 'PAYROLL'
    ];

    const upperText = text.toUpperCase();
    for (const m of knownMerchants) {
      if (upperText.includes(m)) return m;
    }

    return 'Merchant Transfer';
  },

  matchAccountId(text, userAccounts = []) {
    if (!userAccounts || userAccounts.length === 0) return null;
    const detectedBank = extractBank(text);

    if (detectedBank) {
      const codeLower = detectedBank.code.toLowerCase();
      const nameLower = detectedBank.name.toLowerCase();

      const match = userAccounts.find(acc => {
        const accName = (acc.name || '').toLowerCase();
        const accBank = (acc.bankName || '').toLowerCase();
        return accName.includes(codeLower) || accName.includes(nameLower) ||
               accBank.includes(codeLower) || accBank.includes(nameLower);
      });

      if (match) return match.id;
    }

    const cashAcc = userAccounts.find(a => a.accountType === 'Cash' || a.id === 'acc_cash');
    return cashAcc ? cashAcc.id : userAccounts[0]?.id || null;
  },

  parseText(text, userAccounts = [], userId = null, smsTimestamp = null) {
    if (this.shouldIgnore(text)) return null;

    const lower = text.toLowerCase();
    
    // 1. Detect Amount
    const amountRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
    const match = text.match(amountRegex);
    const amount = match ? parseFloat(match[1].replace(/,/g, '')) : null;

    if (!amount || isNaN(amount) || amount <= 0) return null;

    // 2. Detect Type (Expense vs Income)
    const isExplicitDebit = /(?:dr\.?\s*from|dr\.?\s+|debited|spent|paid|withdrawn)/i.test(text);
    const isExplicitCredit = /(?:credited\s+with|credited\s+by|credited\s+to\s+your|credited\s+in|received|salary|refund|cashback|deposited)/i.test(text);

    let type = 'Expense';
    if (isExplicitDebit) {
      type = 'Expense';
    } else if (isExplicitCredit) {
      type = 'Income';
    } else if (/\b(?:cr\.?|credited)\b/i.test(text) && !/\b(?:cr\.?\s*to)\b/i.test(text)) {
      type = 'Income';
    }

    // 3. Detect Bank, Date & Time
    const detectedBank = extractBank(text);
    const textDate = parseSmsDate(text);
    const textTime = parseSmsTime(text);

    let fallbackDateObj = null;
    if (smsTimestamp) {
      const tsNum = Number(smsTimestamp);
      fallbackDateObj = isNaN(tsNum) ? new Date(smsTimestamp) : new Date(tsNum);
      if (isNaN(fallbackDateObj.getTime())) fallbackDateObj = null;
    }
    if (!fallbackDateObj) {
      fallbackDateObj = new Date();
    }

    const finalDateObj = textDate || fallbackDateObj;
    const yyyy = finalDateObj.getFullYear();
    const mm = String(finalDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(finalDateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    let timeStr = textTime;
    if (!timeStr) {
      const h = String(fallbackDateObj.getHours()).padStart(2, '0');
      const m = String(fallbackDateObj.getMinutes()).padStart(2, '0');
      timeStr = `${h}:${m}`;
    }

    // 4. Detect Merchant
    const merchant = this.extractMerchant(text);

    // 5. Detect Payment Method
    let paymentMethod = 'Bank';
    if (lower.includes('upi')) {
      paymentMethod = 'UPI';
    } else if (lower.includes('cash')) {
      paymentMethod = 'Cash';
    }

    // 6. Match Account ID
    const accountId = this.matchAccountId(text, userAccounts);

    // 7. Category Suggestion
    const category = categorizationEngine.suggestCategory(merchant !== 'Merchant Transfer' ? merchant : text, userId);

    // 8. Reference Number for Fingerprint
    const refMatch = text.match(/(?:ref\s*no|txn\s*id|reference|rrn)[:\s]*([a-zA-Z0-9]+)/i);
    const refId = refMatch ? refMatch[1] : '';

    // 9. Generate Deduplication Fingerprint
    const fingerprint = `sms_${dateStr}_${amount}_${type}_${merchant.replace(/[^a-zA-Z0-9]/g, '')}_${refId}`;

    const bankTag = detectedBank ? detectedBank.code : 'Cash';
    const description = `${bankTag} · ${merchant} (${type === 'Income' ? 'Received' : 'Sent'})`;

    return {
      amount,
      type,
      merchant,
      category,
      paymentMethod,
      accountId,
      detectedBank,
      extractedDate: finalDateObj,
      date: dateStr,
      time: timeStr,
      fingerprint,
      description,
      rawText: text
    };
  }
};

