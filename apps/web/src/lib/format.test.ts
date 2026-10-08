import { describe, expect, it } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('formats Nigerian naira consistently for the shop catalogue and order totals', () => {
    expect(formatPrice(68000)).toContain('68,000');
    expect(formatPrice(68000)).toContain('₦');
  });
});
