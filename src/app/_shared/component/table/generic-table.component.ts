import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatButtonModule, MatSort, MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule, RouterLink ],
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.css']
})
export class GenericTableComponent<T> implements AfterViewInit {
  @Input() title = '';
  @Input() createButtonLabel = '';
  @Input() createButtonLink = '';
  @Input() displayedColumns: string[] = [];
  @Input() columnDefs: { key: string; label: string; cell?: (element: T) => any }[] = [];
  @Input() dataSource = new MatTableDataSource<T>();
  @Input() isLoading = false;

  @Output() details = new EventEmitter<any>();
  @Output() update = new EventEmitter<any>();
  @Output() create = new EventEmitter<any>();
  @Output() markAsRead = new EventEmitter<any>();


  private _liveAnnouncer = inject(LiveAnnouncer);


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  onDetails(id: any) {
    this.details.emit(id);
  }

  onUpdate(id: any) {
    this.update.emit(id);
  }

  onCreate(id: any) {
    this.update.emit(id);
  }

  onMarkAsRead(id: any) {
    this.update.emit(id);
  }

  onDetailsClick(element: any) {
    this.details.emit((element as any)._id);
  }

  onUpdateClick(element: any) {
    this.update.emit((element as any)._id);
  }

  onCreateClick() {
    this.create.emit();
  }

  onMarkAsReadClick(element: any) {
    this.markAsRead.emit((element as any)._id);
  }

  getCellValue(col: any, element: any) {
    // specialize for notifications
    return col.cell ? col.cell(element) : (element as any)[col.key];
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
