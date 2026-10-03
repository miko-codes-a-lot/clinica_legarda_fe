import { TableColumn, TableFilter } from '../../../_shared/component/table/table-model';
import { AuthService } from '../../../_shared/service/auth-service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-clinic-list',
  imports: [GenericTableComponent],
  templateUrl: './clinic-list.html',
  styleUrl: './clinic-list.css'
})

export class ClinicList implements OnInit {
  get moduleUrl(): string {
    return this.router.url.startsWith('/super-admin') ? '/super-admin/clinic' : '/admin/clinic';
  }

  isLoading = false
  loadError = ''
  title = 'Clinic'
  get createLabel(): string { return this.canManage ? 'Create Clinic' : ''; }
  disableEdit = () => !this.canManage;
  dataSource = new MatTableDataSource<Clinic>();
  displayedColumns = ['name', 'contact', 'hours', 'actions'];
  columnDefs: TableColumn<Clinic>[] = [
    { key: 'name', label: 'Clinic', cell: clinic => clinic.name, secondary: clinic => clinic.address || '' },
    { key: 'contact', label: 'Contact', cell: clinic => clinic.mobileNumber || clinic.emailAddress, secondary: clinic => clinic.mobileNumber ? clinic.emailAddress || '' : '' },
    { key: 'hours', label: 'Open days', cell: clinic => (clinic.operatingHours || []).filter(hour => hour.startTime && hour.endTime).map(hour => hour.day.slice(0, 3)).join(' · ') },
  ];
  filters: TableFilter<Clinic>[] = [{ key: 'day', label: 'Open on', options: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => ({ value: day, label: day.charAt(0).toUpperCase() + day.slice(1) })), value: clinic => (clinic.operatingHours || []).filter(hour => hour.startTime && hour.endTime).map(hour => hour.day) }];

  get canManage(): boolean { return this.authService.currentUserValue?.role === 'super-admin'; }

  constructor(
    private readonly authService: AuthService,
    private readonly clinicService: ClinicService,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.clinicService.getAccessible().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (e) => {
        this.loadError = e.error?.message || 'Unable to load or save the clinic.';
        this.alertService.error(this.loadError);
        this.isLoading = false;
      }
    }).add(() => this.isLoading = false);
  }

  onDetails(id: string) {
    this.router.navigate([`${this.moduleUrl}/details`, id])
  }

  onUpdate(id: string) {
    if (!this.canManage) return;
    this.router.navigate([`${this.moduleUrl}/update`, id])
  }

  onCreate() {
    if (!this.canManage) return;
    this.router.navigate([`${this.moduleUrl}/create`])
  }

}
