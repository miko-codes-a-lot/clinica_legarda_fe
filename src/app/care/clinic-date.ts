import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
/** Calendar dates have no timezone; anchor them explicitly before formatting. */
@Pipe({ name: 'clinicDate' })
export class ClinicDate implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
    try { return formatDate(date, 'mediumDate', 'en-US', 'UTC'); } catch { return '—'; }
  }
}
