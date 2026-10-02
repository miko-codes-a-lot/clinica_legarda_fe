import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';
import { ClinicService } from '../../_shared/service/clinic-service';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { EmptyState } from '../../_shared/ui/empty-state/empty-state';
import { StatusBadge } from '../../_shared/ui/status-badge/status-badge';
import { CareClinic, clinicToday } from '../care.models';
import { careError } from '../care-api.service';
import { ClosuresApiService } from './closures-api.service';
import { AffectedAppointment, ClinicClosure, ClosureDetail } from './closure.models';
const required = (value = '') => new FormControl(value, { nonNullable: true, validators: [Validators.required] });
@Component({ selector: 'app-clinic-closures', imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeader, EmptyState, StatusBadge], templateUrl: './closures.html' })
export class ClinicClosures implements OnInit {
  private readonly destroyRef = inject(DestroyRef); private readonly api = inject(ClosuresApiService); private readonly clinicsApi = inject(ClinicService);
  readonly base = `/${inject(Router).url.split('/')[1]}`;
  clinics: CareClinic[] = []; closures: ClinicClosure[] = []; detail: ClosureDetail | null = null;
  previewRows: AffectedAppointment[] = []; previewed = false; loading = false; saving = false; error = ''; success = '';
  private listVersion = 0; private detailVersion = 0;
  readonly form = new FormGroup({ clinic: required(), startDate: required(clinicToday()), endDate: required(clinicToday()), startTime: required('00:00'), endTime: required('24:00'), reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }) });
  readonly reopenReason = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] });
  ngOnInit() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.previewed = false; this.previewRows = []; });
    this.form.controls.clinic.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.detail = null; this.detailVersion++; this.load(); });
    this.clinicsApi.getAccessible().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: clinics => {
      this.clinics = clinics.filter(c => c._id).map(c => ({ _id: c._id ?? '', name: c.name }));
      if (this.clinics.length === 1) this.form.controls.clinic.setValue(this.clinics[0]._id); else this.load();
    }, error: error => this.error = careError(error) });
  }
  load() {
    const version = ++this.listVersion; this.loading = true; this.error = '';
    this.api.list(this.form.controls.clinic.value || undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: rows => { if (version === this.listVersion) { this.closures = rows; this.loading = false; } }, error: error => { if (version === this.listVersion) { this.error = careError(error); this.loading = false; this.closures = []; } } });
  }
  preview() {
    if (this.saving || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = ''; const payload = this.form.getRawValue();
    this.api.preview(payload).pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => {
      if (JSON.stringify(payload) === JSON.stringify(this.form.getRawValue())) { this.previewRows = result.appointments; this.previewed = true; }
    }, error: error => this.error = careError(error) });
  }
  create() {
    if (this.saving || !this.previewed || this.form.invalid) return;
    this.save(this.api.create(this.form.getRawValue()), 'Closure saved. Affected appointments are flagged for review.');
  }
  open(id: string) {
    if (this.saving) return; const version = ++this.detailVersion; this.error = ''; this.detail = null; this.reopenReason.reset('');
    this.api.detail(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => { if (version === this.detailVersion) this.detail = result; }, error: error => { if (version === this.detailVersion) this.error = careError(error); } });
  }
  reopen() {
    if (!this.detail || this.saving || this.reopenReason.invalid) { this.reopenReason.markAsTouched(); return; }
    this.save(this.api.reopen(this.detail.closure._id, this.reopenReason.value), 'Clinic reopened. Review and resolve any remaining appointment flags.');
  }
  private save(request: Observable<ClosureDetail>, message: string) {
    this.saving = true; this.error = ''; this.success = '';
    request.pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => { this.detail = result; this.previewed = false; this.previewRows = []; this.success = message; this.load(); }, error: error => this.error = careError(error) });
  }
}
