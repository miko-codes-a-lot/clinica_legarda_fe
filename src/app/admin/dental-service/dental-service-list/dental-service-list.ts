import { staffManagementPath } from '../../../_shared/model/staff-management-path';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { TableColumn, TableFilter } from '../../../_shared/component/table/table-model';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
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
  get moduleUrl() { return `${staffManagementPath(this.router.url)}/service`; }
  title = 'Service'
  createLabel = 'Create Service'
  dataSource = new MatTableDataSource<DentalService>();
  private readonly destroyRef = inject(DestroyRef);
  private clinicNames = new Map<string, string>();
  displayedColumns = ['name', 'duration', 'clinics', 'actions'];
  columnDefs: TableColumn<DentalService>[] = [
    { key: 'name', label: 'Service', cell: service => service.name },
    { key: 'clinics', label: 'Available at clinics', cell: service => this.serviceClinics(service) },
    { key: 'duration', label: 'Duration', cell: service => `${service.duration} min`, sortValue: service => service.duration, kind: 'number' },
  ];
  filters: TableFilter<DentalService>[] = [{ key: 'duration', label: 'Duration', options: [{ value: 'short', label: '30 min or less' }, { value: 'medium', label: '31–60 min' }, { value: 'long', label: 'Over 60 min' }], value: service => service.duration <= 30 ? 'short' : service.duration <= 60 ? 'medium' : 'long' }];

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly clinicService: ClinicService,
    private readonly router: Router,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true
    forkJoin({ services: this.dentalServicesService.getAll(), clinics: this.clinicService.getAccessible() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ services, clinics }) => {
        this.clinicNames = new Map(clinics.filter(clinic => !!clinic._id).map(clinic => [clinic._id ?? '', clinic.name]));
        this.filters = [...this.filters, { key: 'clinics', label: 'Clinic', options: clinics.map(clinic => ({ value: clinic._id ?? '', label: clinic.name })), value: service => service.clinics ?? [...this.clinicNames.keys()] }];
        this.dataSource.data = services;
      },
      error: () => this.alertService.error('Unable to load services and clinics.')
    }).add(() => this.isLoading = false);
  }

  private serviceClinics(service: DentalService): string {
    const names = (service.clinics ?? [...this.clinicNames.keys()]).map(id => this.clinicNames.get(id)).filter((name): name is string => !!name);
    return names.join(', ') || 'Unavailable';
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
