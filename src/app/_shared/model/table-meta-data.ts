import { MatTableDataSource } from '@angular/material/table';

export interface ColumnDef<T> {
  key: string;
  label: string;
  cell: (item: T) => any;
}

export interface TableMetaData<T> {
  title: string;
  label: string;
  link: string;
  displayedColumns: string[];
  columnDefs: ColumnDef<T>[];
  dataSource: MatTableDataSource<T>;
}