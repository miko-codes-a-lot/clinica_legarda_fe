import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // ✅ import RouterLink


@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.css']
})
export class GenericTableComponent<T> implements AfterViewInit {
  @Input() title = '';
  @Input() createButtonLabel = '';
  @Input() createButtonLink = '';
  @Input() displayedColumns: string[] = [];
  @Input() columnDefs: { key: string; label: string; cell?: (element: T) => string }[] = [];
  @Input() dataSource = new MatTableDataSource<T>();
  @Input() isLoading = false;

  @Output() details = new EventEmitter<any>();
  @Output() update = new EventEmitter<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  onDetails(id: any) {
    this.details.emit(id);
  }

  onUpdate(id: any) {
    this.update.emit(id);
  }

  onDetailsClick(element: any) {
    this.details.emit((element as any)._id);
  }

  onUpdateClick(element: any) {
    this.update.emit((element as any)._id);
  }

  getCellValue(col: any, element: any) {
    return col.cell ? col.cell(element) : (element as any)[col.key];
  }
}
