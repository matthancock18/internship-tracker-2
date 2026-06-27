export const SKU = {
  MONTHLY: 'com.matthewhancock.trax.monthly',
  YEARLY: 'com.matthewhancock.trax.pro_yearly',
  LIFETIME: 'com.matthewhancock.trax.pro_lifetime',
} as const;

export const SUBSCRIPTION_SKUS = [SKU.MONTHLY, SKU.YEARLY];
export const ONETIME_SKUS = [SKU.LIFETIME];

export type SkuKey = keyof typeof SKU;
