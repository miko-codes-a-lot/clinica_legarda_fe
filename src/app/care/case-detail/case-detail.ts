import { LINKED_APPOINTMENT_COLUMNS, LINKED_APPOINTMENT_FILTERS, careAppointmentDate } from '../care-table-config';
import { GenericTableComponent } from '../../_shared/component/table/generic-table.component';
import { TableCellDirective } from '../../_shared/component/table/table-cell.directive';
import { ClinicDate } from '../clinic-date';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, finalize, of, startWith, Subject, switchMap } from 'rxjs';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { StatusBadge } from '../../_shared/ui/status-badge/status-badge';
import { AuthService } from '../../_shared/service/auth-service';
import { assignedClinicIds } from '../../_shared/model/user';
import { CareApiService, careError } from '../care-api.service';
import { TreatmentCaseDetail } from '../care.models';

@Component({ selector: 'app-case-detail', imports: [GenericTableComponent, TableCellDirective, ClinicDate, CommonModule, RouterLink, PageHeader, StatusBadge], templateUrl: './case-detail.html' })
export class CaseDetail implements OnInit {
  readonly appointmentColumns = LINKED_APPOINTMENT_COLUMNS;
  readonly appointmentFilters = LINKED_APPOINTMENT_FILTERS;
  readonly dateValue = careAppointmentDate;

  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(CareApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly refreshes = new Subject<void>();
  readonly roleBase = `/${this.router.url.split('/')[1]}`;
  readonly base = `${this.roleBase}/care`;
  detail: TreatmentCaseDetail | null = null;
  loading = false;
  saving = false;
  error = '';
  get canClose(): boolean {
    const record = this.detail?.careCase;
    const user = this.auth.currentUserValue;
    return !!record && record.status === 'active' && (user?.role === 'super-admin' || (user?.role === 'dentist' && user._id === record.dentist._id && assignedClinicIds(user).includes(record.clinic._id)));
  }
  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.refreshes.pipe(startWith(undefined))]).pipe(switchMap(([params]) => {
      this.loading = true; this.error = '';
      return this.api.treatmentCase(params.get('id') ?? '').pipe(catchError(error => { this.error = careError(error); return of(null); }), finalize(() => this.loading = false));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(detail => this.detail = detail);
  }
  close(status: 'completed' | 'discontinued'): void {
    if (!this.detail || !this.canClose || this.saving) return;
    this.saving = true; this.error = '';
    this.api.closeCase(this.detail.careCase._id, status, this.detail.careCase.revision).pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef)).subscribe({ next: detail => this.detail = detail, error: error => this.error = careError(error) });
  }
}
