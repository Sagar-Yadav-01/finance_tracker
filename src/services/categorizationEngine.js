/**
 * Rule-based Automatic Merchant Categorization Engine
 * with User-Customized Learning Support.
 */
const DEFAULT_MERCHANT_RULES = [
  { keywords: ['SWIGGY', 'ZOMATO', 'DOMINOS', 'PIZZA HUT', 'KFC', 'MCDONALDS', 'STARBUCKS', 'RESTAURANT', 'DINING', 'CAFE', 'FOOD', 'EATS'], category: 'Food' },
  { keywords: ['UBER', 'OLA', 'RAPIDO', 'IRCTC', 'METRO', 'PETROL', 'SHELL', 'IOCL', 'HPCL', 'BPCL', 'FLIGHT', 'TRAIN', 'AUTO', 'CAB', 'TAXI'], category: 'Travel' },
  { keywords: ['AMAZON', 'FLIPKART', 'MYNTRA', 'AJIO', 'ZARA', 'UNIQLO', 'RETAIL', 'MALL', 'SHOPPING', 'MEESHO', 'TATA CLIQ'], category: 'Shopping' },
  { keywords: ['NETFLIX', 'SPOTIFY', 'PRIME VIDEO', 'PRIME', 'HOTSTAR', 'PVR', 'INOX', 'CINEMA', 'MOVIE', 'GAME', 'BOOKMYSHOW'], category: 'Entertainment' },
  { keywords: ['ELECTRICITY', 'WATER', 'GAS', 'BROADBAND', 'JIO', 'AIRTEL', 'VI', 'BILL', 'RECHARGE', 'RENT', 'MAINTENANCE'], category: 'Bills' },
  { keywords: ['APOLLO', 'PHARMACY', 'MEDPLUS', 'HOSPITAL', 'CLINIC', 'DOCTOR', 'LAB', 'HEALTH', '1MG', 'PHARMEASY'], category: 'Health' },
  { keywords: ['UDEMY', 'COURSERA', 'BOOK', 'SCHOOL', 'COLLEGE', 'FEE', 'TUTOR', 'EDUCATION'], category: 'Education' },
  { keywords: ['SALARY', 'PAYROLL', 'CREDITED BY EMPLOYER', 'STIPEND', 'INTEREST', 'DIVIDEND', 'BONUS', 'CASHBACK', 'REFUND'], category: 'Salary' }
];

const getUserRulesKey = (userId) => `finance_user_cat_rules_${userId || 'default'}`;

export const categorizationEngine = {
  /**
   * Get user learned merchant rules from localStorage
   */
  getUserRules(userId) {
    try {
      const key = getUserRulesKey(userId);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  /**
   * Learn / save a custom category rule for a merchant string
   */
  learnUserRule(userId, merchant, category) {
    if (!merchant || !category) return;
    const cleanMerchant = merchant.trim().toUpperCase();
    if (!cleanMerchant) return;

    try {
      const rules = this.getUserRules(userId);
      rules[cleanMerchant] = category;
      localStorage.setItem(getUserRulesKey(userId), JSON.stringify(rules));
      console.log(`[CATEGORIZATION ENGINE] Learned rule: ${cleanMerchant} -> ${category} for user ${userId}`);
    } catch (e) {
      console.error('[CATEGORIZATION ENGINE] Failed to save user rule:', e);
    }
  },

  /**
   * Suggests a category name based on description/merchant string,
   * checking user-learned rules first before built-in default rules.
   */
  suggestCategory(description, userId = null) {
    if (!description || typeof description !== 'string') return 'Other';

    const upper = description.trim().toUpperCase();

    // 1. Check user-learned rules first
    if (userId) {
      const userRules = this.getUserRules(userId);
      for (const [merchantKey, category] of Object.entries(userRules)) {
        if (upper.includes(merchantKey) || merchantKey.includes(upper)) {
          return category;
        }
      }
    }

    // 2. Fallback to default keyword rules
    for (const rule of DEFAULT_MERCHANT_RULES) {
      if (rule.keywords.some(keyword => upper.includes(keyword))) {
        return rule.category;
      }
    }

    return 'Other';
  }
};

