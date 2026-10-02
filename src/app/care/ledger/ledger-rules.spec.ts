import { formatPesos, parsePesos, monthlyInstallments } from './ledger-rules';
describe('Manual ledger money and installment input', () => {
  it('converts decimal peso input exactly without rounding', () => {
    expect(parsePesos('1200.05')).toBe(120005); expect(parsePesos('0.01')).toBe(1);
    for (const value of ['0', '-1', '1.001', '1e3', '', '90071992547409.92']) expect(parsePesos(value)).toBeNull();
    expect(parsePesos('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('formats all supported centavos exactly', () => {
    expect(formatPesos(120005)).toBe('₱1,200.05'); expect(formatPesos(Number.MAX_SAFE_INTEGER)).toBe('₱90,071,992,547,409.91');
  });
  it('allocates every centavo in a monthly schedule', () => {
    expect(monthlyInstallments(10000, 3, '2026-10-03').map(item => item.amount)).toEqual([3334, 3333, 3333]);
    expect(() => monthlyInstallments(2, 3, '2026-10-03')).toThrow();
    expect(() => monthlyInstallments(10000, 121, '2026-10-03')).toThrow();
  });
  it('keeps the original day when clamping month ends, including leap years', () => {
    expect(monthlyInstallments(300, 3, '2028-01-31').map(item => item.dueDate)).toEqual(['2028-01-31','2028-02-29','2028-03-31']);
    expect(() => monthlyInstallments(100, 1, '2026-02-30')).toThrow();
  });
});
