import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';

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
  displayedColumns: string[] = ['_id', 'name', 'duration', 'actions'];
  columnDefs = [
    { key: '_id', label: 'ID', cell: (dentalService: DentalService) => dentalService._id ?? '' },
    { key: 'name', label: 'Name', cell: (dentalService: DentalService) => dentalService.name},
    { key: 'duration', label: 'Duration', cell: (dentalService: DentalService) =>  dentalService.duration},
  ];

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.dentalServicesService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (e) => alert(`Something went wrong ${e}`)
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
