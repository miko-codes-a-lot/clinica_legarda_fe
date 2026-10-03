import { TableColumn } from '../../../_shared/component/table/table-model';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Reason } from '../../../_shared/model/reason';
import { ReasonService } from '../../../_shared/service/reason-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-reason-list',
  imports: [GenericTableComponent],
  templateUrl: './reason-list.html',
  styleUrl: './reason-list.css'
})

export class ReasonList implements OnInit {
  isLoading = false
  moduleUrl = '/admin/reason/'
  title = 'Reason'
  createLabel = 'Create Reason'
  dataSource = new MatTableDataSource<Reason>();
  displayedColumns = ['label', 'code', 'description', 'actions'];
  columnDefs: TableColumn<Reason>[] = [
    { key: 'label', label: 'Reason', cell: reason => reason.label },
    { key: 'code', label: 'Code', cell: reason => reason.code },
    { key: 'description', label: 'Description', cell: reason => reason.description },
  ];

  constructor(
    private readonly reasonService: ReasonService,
    private readonly router: Router,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.reasonService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false);
  }

  onDetails(id: string) {
    this.router.navigate([`${this.moduleUrl}/details`, id])
  }

  onUpdate(id: string) {
    this.router.navigate([`${this.moduleUrl}/update`, id])
  }

  onCreate() {
    this.router.navigate([`${this.moduleUrl}/create`])
  }

}
