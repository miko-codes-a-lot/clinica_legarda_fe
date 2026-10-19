import { patientAge } from '../../_shared/model/patient-demographics';
import { CARE_APPOINTMENT_COLUMNS, CARE_APPOINTMENT_FILTERS, careAppointmentDate } from '../care-table-config';
import { GenericTableComponent } from '../../_shared/component/table/generic-table.component';
import { TableCellDirective } from '../../_shared/component/table/table-cell.directive';
import { ClinicDate } from '../clinic-date';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, finalize, of, switchMap } from 'rxjs';
import { CareApiService, careError } from '../care-api.service';
import { CareVisit, PatientRecord, PatientRecordSnapshot, TreatmentCase, clinicToday } from '../care.models';
import { createPatientRecordReport, createPatientRecordPdf, renderPatientRecordReport } from './patient-record-report';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { EmptyState } from '../../_shared/ui/empty-state/empty-state';
import { StatusBadge } from '../../_shared/ui/status-badge/status-badge';

@Component({ selector: 'app-patient-record', imports: [GenericTableComponent, TableCellDirective, ClinicDate, CommonModule, RouterLink, PageHeader, EmptyState, StatusBadge], templateUrl: './patient-record.html' })
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
  readonly patientAge = patientAge;
  loading = false;
  error = '';
  exporting = false;
  exportError = '';
  private version = 0;
  get canExport() { return !!this.record && !this.loading && !this.error && !this.exporting; }

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(switchMap(([params, query]) => {
      this.loading = true;
      this.error = '';
      this.exportError = '';
      this.version++; this.record = null; this.visits = []; this.cases = [];
      const patient = params.get('id') ?? '';
      this.clinicContext = query.get('clinic') ?? '';
      const clinic = this.clinicContext || undefined;
      return this.api.patientRecordSnapshot(patient, clinic)
        .pipe(catchError(error => { this.error = careError(error); return of(null); }), finalize(() => this.loading = false));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.record = result?.record ?? null; this.visits = result?.visits ?? []; this.cases = result?.cases ?? [];
    });
  }

  printRecord() {
    if (!this.canExport || !this.record) return;
    const popup = window.open('', '_blank', 'popup');
    if (!popup) { this.exportError = 'Allow pop-ups to print, or use Export PDF.'; return; }
    popup.opener = null; popup.document.body.textContent = 'Loading authorized patient record…';
    let rendered = false;
    this.exportSnapshot(snapshot => {
      renderPatientRecordReport(popup.document, createPatientRecordReport(snapshot));
      popup.document.close(); popup.focus(); rendered = true; popup.print();
    }, () => { if (!rendered) popup.close(); });
  }
  exportPdf() {
    if (!this.canExport) return;
    this.exportSnapshot(snapshot => createPatientRecordPdf(createPatientRecordReport(snapshot)).save(`patient-record-${snapshot.generatedAt.slice(0,10)}.pdf`));
  }
  private exportSnapshot(deliver: (snapshot: PatientRecordSnapshot) => void, cleanup = () => {}) {
    if (!this.record) { cleanup(); return; }
    const version = this.version, id = this.record.patient._id, clinic = this.clinicContext;
    this.exporting = true; this.exportError = '';
    this.api.patientRecordSnapshot(id, clinic || undefined).pipe(finalize(() => { this.exporting = false; cleanup(); }), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: snapshot => {
        if (version !== this.version || this.record?.patient._id !== id || this.clinicContext !== clinic) return;
        this.record = snapshot.record; this.visits = snapshot.visits; this.cases = snapshot.cases;
        try { deliver(snapshot); } catch { this.exportError = 'The patient record could not be exported. Please try again.'; }
      },
      error: error => { if (version !== this.version) return; this.error = careError(error); this.record = null; this.visits = []; this.cases = []; },
    });
  }
}
