// Supported currencies
export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// Supported countries
export const COUNTRIES = {
  LK: { code: 'LK', name: 'Sri Lanka', dialCode: '+94', currency: 'LKR' },
  IN: { code: 'IN', name: 'India', dialCode: '+91', currency: 'INR' },
} as const;

// Order number prefix
export const ORDER_NUMBER_PREFIX = 'LM';

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES_PER_PRODUCT: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

// India GST rates by category type
export const INDIA_GST_RATES = {
  EXEMPT: 0,
  LOW: 5,
  STANDARD: 12,
  HIGHER: 18,
  LUXURY: 28,
} as const;

// Sri Lanka VAT rate
export const SRI_LANKA_VAT_RATE = 18;

// Vendor commission defaults
export const COMMISSION = {
  DEFAULT_RATE: 5, // 5%
  FREE_TIER_RATE: 8,
  PREMIUM_TIER_RATE: 5,
  ENTERPRISE_TIER_RATE: 3,
} as const;

// Payout settings
export const PAYOUT = {
  MINIMUM_AMOUNT_USD: 50,
  HOLD_PERIOD_DAYS: 14, // Hold funds for return window
  SCHEDULE_OPTIONS: ['weekly', 'biweekly', 'monthly'] as const,
} as const;
