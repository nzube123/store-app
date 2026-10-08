import { CURRENCY } from '@shop/shared';

const formatter = new Intl.NumberFormat('en-NG', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
export const formatPrice = (amount: number): string => formatter.format(amount);
