import { AfterViewInit, Component, ContentChildren, EventEmitter, Input, OnChanges, Output, QueryList, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Icon } from '../../ui/icon/icon';
import { PageHeader } from '../../ui/page-header/page-header';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { StatusBadge } from '../../ui/status-badge/status-badge';
import { TableCellDirective } from './table-cell.directive';
import { matchesTableQuery, sortTableRows, TableColumn, TableFilter, tableProperty, TableQuery, tableText } from './table-model';

@Component({
  selector: 'app-generic-table', standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatSortModule, Icon, RouterLink, PageHeader, EmptyState, StatusBadge],
  templateUrl: './generic-table.component.html', styleUrls: ['./generic-table.component.css'],
})
export class GenericTableComponent<T> implements AfterViewInit, OnChanges {
  @Input() title = '';
  @Input() description = '';
  @Input() createButtonLabel = '';
  @Input() displayedColumns: readonly string[] = [];
  @Input() columnDefs: readonly TableColumn<T>[] = [];
  @Input() filters: readonly TableFilter<T>[] = [];
  @Input() dateValue?: (row: T) => string;
  @Input() dateLabel = 'Date';
  @Input() rows?: readonly T[];
  @Input() dataSource = new MatTableDataSource<T>();
  @Input() disableEditFn?: (row: T) => boolean;
  @Input() rowClassFn?: (row: T) => string;
  @Input() isLoading = false;
  @Input() enableDelete = false;
  @Input() embedded = false;
  @Input() searchEnabled = true;
  @Input() searchPlaceholder = 'Search records';
  @Input() paginate = true;
  @Input() serverMode = false;
  @Input() totalRows?: number;
  @Input() sortBy = '';
  @Input() sortDirection: 'asc' | 'desc' | '' = 'asc';
  @Input() pageSize = 10;
  @Input() emptyTitle = 'No records yet';
  @Input() emptyDescription = 'Records will appear here when they are available.';
  @Output() details = new EventEmitter<string>();
  @Output() update = new EventEmitter<string>();
  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();
  @Output() markAsRead = new EventEmitter<string>();
  @Output() sortChanged = new EventEmitter<Sort>();
  @Output() queryReset = new EventEmitter<void>();
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  @ContentChildren(TableCellDirective) cells?: QueryList<TableCellDirective>;
  private readonly announcer = inject(LiveAnnouncer);
  searchTerm = '';
  selectedFilters: Record<string, string> = {};
  from = '';
  to = '';
  private viewReady = false;

  get visibleColumns(): readonly string[] { return (this.displayedColumns.length ? this.displayedColumns : this.columnDefs.map(column => column.key)).filter(key => key !== '_id'); }
  get visibleDefs(): readonly TableColumn<T>[] { return this.columnDefs.filter(column => column.key !== 'actions' && this.visibleColumns.includes(column.key)); }
  get hasQuery(): boolean { return !!(this.searchTerm || this.from || this.to || Object.values(this.selectedFilters).some(Boolean)); }
  get invalidDateRange(): boolean { return !!this.from && !!this.to && this.from > this.to; }
  get count(): number { return this.serverMode ? this.totalRows ?? this.dataSource.data.length : this.dataSource.filteredData.length; }

  ngOnChanges(): void {
    if (this.rows) this.dataSource.data = [...this.rows];
    this.configureSource();
  }
  ngAfterViewInit(): void { this.viewReady = true; this.configureSource(); }
  private configureSource(): void {
    if (this.viewReady) {
      this.dataSource.paginator = !this.serverMode && this.paginate ? this.paginator ?? null : null;
      this.dataSource.sort = !this.serverMode ? this.sort ?? null : null;
    }
    if (this.serverMode) return;
    this.dataSource.sortData = (rows, sort) => sortTableRows(rows, this.visibleDefs, sort);
    this.dataSource.filterPredicate = row => matchesTableQuery(row, this.visibleDefs, this.filters, this.query, this.dateValue);
    this.updateQuery(false);
  }
  templateFor(key: string): TemplateRef<{ $implicit: T }> | null {
    return this.cells?.find(cell => cell.tableCell === key)?.template as TemplateRef<{ $implicit: T }> | undefined ?? null;
  }
  cellText(column: TableColumn<T>, row: T): string { return tableText(column.cell ? column.cell(row) : tableProperty(row, column.key)) || '—'; }
  cellLink(column: TableColumn<T>, row: T): string | null {
    if (column.key !== 'message') return null;
    const value = column.cell?.(row);
    const link = tableProperty(value, 'dataLink') ?? tableProperty(row, 'link');
    return typeof link === 'string' && link.startsWith('/') && !link.startsWith('//') ? link : null;
  }
  rowId(row: T): string { const id = tableProperty(row, '_id'); return typeof id === 'string' ? id : ''; }
  getEditDisabled(row: T): boolean { return this.isLoading || !!this.disableEditFn?.(row); }
  setSearch(value: string): void { this.searchTerm = value; this.updateQuery(); }
  setFilter(key: string, value: string): void { this.selectedFilters = { ...this.selectedFilters, [key]: value }; this.updateQuery(); }
  setDate(key: 'from' | 'to', value: string): void { this[key] = value; this.updateQuery(); }
  resetQuery(): void { this.searchTerm = ''; this.selectedFilters = {}; this.from = ''; this.to = ''; this.updateQuery(); this.queryReset.emit(); }
  private updateQuery(resetPage = true): void {
    if (this.serverMode) return;
    this.dataSource.filter = JSON.stringify(this.query);
    if (resetPage) this.paginator?.firstPage();
  }
  private get query(): TableQuery { return { search: this.searchTerm, filters: this.selectedFilters, from: this.from, to: this.to }; }
  announceSortChange(sort: Sort): void {
    this.sortChanged.emit(sort);
    const label = this.columnDefs.find(column => column.key === sort.active)?.label ?? sort.active;
    void this.announcer.announce(sort.direction ? `${label} sorted ${sort.direction === 'asc' ? 'ascending' : 'descending'}` : 'Sorting cleared');
  }
}
