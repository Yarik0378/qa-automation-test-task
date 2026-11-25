export const products = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
} as const;

export type CheckoutInfo = { firstName: string; lastName: string; postalCode: string };

export const customer: CheckoutInfo = { firstName: 'John', lastName: 'Doe', postalCode: '12345' };

// Observed on checkout overview: $39.98 item total -> $3.20 tax.
export const TAX_RATE = 0.08;
