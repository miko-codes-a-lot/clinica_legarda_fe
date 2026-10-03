import { TableColumn, TableFilter } from '../../../_shared/component/table/table-model';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-dental-service-list',
  imports: [GenericTableComponent],
  templateUrl: './dental-service-list.html',
  styleUrl: './dental-service-list.css'
})

export class DentalServiceList implements OnInit {
  isLoading = false
  moduleUrl = '/admin/service/'
  title = 'Service'
  createLabel = 'Create Service'
  dataSource = new MatTableDataSource<DentalService>();
  displayedColumns = ['name', 'duration', 'actions'];
  columnDefs: TableColumn<DentalService>[] = [
    { key: 'name', label: 'Service', cell: service => service.name },
    { key: 'duration', label: 'Duration', cell: service => `${service.duration} min`, sortValue: service => service.duration, kind: 'number' },
  ];
  filters: TableFilter<DentalService>[] = [{ key: 'duration', label: 'Duration', options: [{ value: 'short', label: '30 min or less' }, { value: 'medium', label: '31–60 min' }, { value: 'long', label: 'Over 60 min' }], value: service => service.duration <= 30 ? 'short' : service.duration <= 60 ? 'medium' : 'long' }];

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly router: Router,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true
    this.dentalServicesService.getAll().subscribe({
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
