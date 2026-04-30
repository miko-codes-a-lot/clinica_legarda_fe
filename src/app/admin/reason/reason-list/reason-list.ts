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
  displayedColumns: string[] = ['_id', 'code', 'label', 'description', 'actions'];
  columnDefs = [
    { key: '_id', label: 'ID', cell: (reason: Reason) => reason._id ?? '' },
    { key: 'code', label: 'Code', cell: (reason: Reason) => reason.code},
    { key: 'label', label: 'Label', cell: (reason: Reason) =>  reason.label},
    { key: 'description', label: 'Description', cell: (reason: Reason) =>  reason.description},
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
