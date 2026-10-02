export function parsePesos(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const amount = BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  return amount > 0n && amount <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(amount) : null;
}
export function formatPesos(amount: number): string {
  if (!Number.isSafeInteger(amount) || amount < 0) return 'Unavailable';
  const value = BigInt(amount);
  return `₱${(value / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${(value % 100n).toString().padStart(2, '0')}`;
}
export function monthlyInstallments(amount: number, count: number, firstDate: string): { dueDate: string; amount: number }[] {
  const date = new Date(`${firstDate}T00:00:00Z`);
  if (!Number.isSafeInteger(amount) || !Number.isInteger(count) || count < 1 || count > 120 || amount < count
    || !/^\d{4}-\d{2}-\d{2}$/.test(firstDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== firstDate)
    throw new Error('Enter a valid first date and 1–120 installments, with at least one centavo each.');
  const total = BigInt(amount), size = BigInt(count), base = total / size, remainder = Number(total % size);
  return Array.from({ length: count }, (_, index) => {
    const month = date.getUTCMonth() + index;
    const last = new Date(Date.UTC(date.getUTCFullYear(), month + 1, 0)).getUTCDate();
    const dueDate = new Date(Date.UTC(date.getUTCFullYear(), month, Math.min(date.getUTCDate(), last))).toISOString().slice(0,10);
    if (dueDate.length !== 10) throw new Error('The installment schedule exceeds supported calendar dates.');
    return { dueDate, amount: Number(base) + (index < remainder ? 1 : 0) };
  });
}
