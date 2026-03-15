// Feature flags — toggle in Vercel env vars without deploy
// All default to FALSE for safety
export const FEATURES = {
  // Payment providers
  stripe: process.env.NEXT_PUBLIC_FEATURE_STRIPE === 'true',
  paypal: process.env.NEXT_PUBLIC_FEATURE_PAYPAL === 'true',

  // Pool features
  multiBracket: process.env.NEXT_PUBLIC_FEATURE_MULTI_BRACKET === 'true',
  paidPools: process.env.NEXT_PUBLIC_FEATURE_PAID_POOLS === 'true',

  // Commissioner features
  commissionerDashboard: process.env.NEXT_PUBLIC_FEATURE_COMMISSIONER_DASHBOARD === 'true',

  // Notifications
  notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS === 'true',
  pushNotifications: process.env.NEXT_PUBLIC_FEATURE_PUSH_NOTIFICATIONS === 'true',

  // Debug/dev
  simulator: process.env.NEXT_PUBLIC_FEATURE_SIMULATOR === 'true',
} as const

export type FeatureFlag = keyof typeof FEATURES
