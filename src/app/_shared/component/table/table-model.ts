export interface TableColumn<T> {
  key: string;
  label: string;
  cell?: (row: T) => unknown;
  secondary?: (row: T) => string;
  sortValue?: (row: T) => string | number | Date | null | undefined;
  searchValue?: (row: T) => string;
  kind?: 'text' | 'status' | 'number';
  sortable?: boolean;
}

export interface TableFilter<T> {
  key: string;
  label: string;
  options: readonly { value: string; label: string }[];
  value: (row: T) => string | readonly string[];
}

export interface TableQuery {
  search: string;
  filters: Readonly<Record<string, string>>;
  from: string;
  to: string;
}

export interface TableSort { active: string; direction: 'asc' | 'desc' | ''; }

export function tableText(value: unknown): string {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toLocaleDateString();
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value && typeof value === 'object' && 'display' in value) return tableText(value.display);
  return '';
}

export function tableProperty(row: unknown, path: string): unknown {
  let value = row;
  for (const key of path.split('.')) {
    if (!value || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, key)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

const normalized = (value: string): string => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const columnValue = <T>(column: TableColumn<T>, row: T): unknown => column.cell ? column.cell(row) : tableProperty(row, column.key);

export function matchesTableQuery<T>(row: T, columns: readonly TableColumn<T>[], filters: readonly TableFilter<T>[], query: TableQuery, dateValue?: (row: T) => string): boolean {
  const text = normalized(columns.filter(column => column.key !== '_id').map(column =>
    column.searchValue ? column.searchValue(row) : `${tableText(columnValue(column, row))} ${column.secondary?.(row) ?? ''}`,
  ).join(' '));
  if (!normalized(query.search).trim().split(/\s+/).filter(Boolean).every(word => text.includes(word))) return false;
  for (const filter of filters) {
    const selected = query.filters[filter.key];
    if (!selected) continue;
    const value = filter.value(row);
    if (Array.isArray(value) ? !value.includes(selected) : value !== selected) return false;
  }
  if (dateValue && (query.from || query.to)) {
    const date = dateValue(row).slice(0, 10);
    if (!date || (query.from && date < query.from) || (query.to && date > query.to)) return false;
  }
  return true;
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
export function sortTableRows<T>(rows: readonly T[], columns: readonly TableColumn<T>[], sort: TableSort): T[] {
  const column = columns.find(item => item.key === sort.active);
  if (!sort.direction || !column || column.sortable === false) return [...rows];
  const value = (row: T): unknown => {
    const raw = column.sortValue ? column.sortValue(row) : columnValue(column, row);
    return raw instanceof Date ? raw.getTime() : raw;
  };
  return [...rows].sort((left, right) => {
    const a = value(left), b = value(right);
    const aMissing = a === null || a === undefined || a === '' || (typeof a === 'number' && !Number.isFinite(a));
    const bMissing = b === null || b === undefined || b === '' || (typeof b === 'number' && !Number.isFinite(b));
    if (aMissing || bMissing) return Number(aMissing) - Number(bMissing);
    const compared = typeof a === 'number' && typeof b === 'number' ? a - b : collator.compare(tableText(a), tableText(b));
    return sort.direction === 'asc' ? compared : -compared;
  });
}

export function tableOptions<T>(rows: readonly T[], value: (row: T) => string, label: (row: T) => string = value): { value: string; label: string }[] {
  const options = new Map<string, string>();
  for (const row of rows) { const key = value(row); if (key) options.set(key, label(row)); }
  return [...options].map(([key, text]) => ({ value: key, label: text })).sort((a, b) => collator.compare(a.label, b.label));
}
