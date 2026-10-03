import { CARE_APPOINTMENT_COLUMNS, CARE_APPOINTMENT_FILTERS, careAppointmentDate } from '../care-table-config';
import { GenericTableComponent } from '../../_shared/component/table/generic-table.component';
import { TableCellDirective } from '../../_shared/component/table/table-cell.directive';
import { ClinicDate } from '../clinic-date';
import { PatientLedgerView } from '../ledger/ledger';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, finalize, forkJoin, of, switchMap } from 'rxjs';
import { CareApiService, careError } from '../care-api.service';
import { CareVisit, PatientRecord, TreatmentCase, clinicToday } from '../care.models';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { EmptyState } from '../../_shared/ui/empty-state/empty-state';
import { StatusBadge } from '../../_shared/ui/status-badge/status-badge';

@Component({ selector: 'app-patient-record', imports: [GenericTableComponent, TableCellDirective, ClinicDate, CommonModule, RouterLink, PageHeader, EmptyState, StatusBadge, PatientLedgerView], templateUrl: './patient-record.html' })
export class PatientRecordPage implements OnInit {
  readonly appointmentColumns = CARE_APPOINTMENT_COLUMNS;
  readonly appointmentFilters = CARE_APPOINTMENT_FILTERS;
  readonly dateValue = careAppointmentDate;

  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(CareApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly roleBase = `/${this.router.url.split('/')[1]}`;
  record: PatientRecord | null = null;
  visits: CareVisit[] = [];
  cases: TreatmentCase[] = [];
  clinicContext = '';
  readonly today = clinicToday();
  loading = false;
  error = '';

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(switchMap(([params, query]) => {
      this.loading = true;
      this.error = '';
      const patient = params.get('id') ?? '';
      this.clinicContext = query.get('clinic') ?? '';
      const clinic = this.clinicContext || undefined;
      return forkJoin({ record: this.api.patientRecord(patient, clinic), visits: this.api.visits({ patient, clinic }), cases: this.api.cases(patient, clinic) })
        .pipe(catchError(error => { this.error = careError(error); return of(null); }), finalize(() => this.loading = false));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.record = result?.record ?? null; this.visits = result?.visits ?? []; this.cases = result?.cases ?? [];
    });
  }
}
