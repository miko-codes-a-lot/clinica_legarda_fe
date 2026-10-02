import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, finalize, of, startWith, Subject, switchMap } from 'rxjs';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { StatusBadge } from '../../_shared/ui/status-badge/status-badge';
import { AuthService } from '../../_shared/service/auth-service';
import { assignedClinicIds } from '../../_shared/model/user';
import { CareApiService, careError } from '../care-api.service';
import { CareVisit, VisitTreatment } from '../care.models';

function treatmentGroup(value?: VisitTreatment) {
  return new FormGroup({
    description: new FormControl(value?.description ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
    tooth: new FormControl(value?.tooth ?? '', { nonNullable: true, validators: Validators.maxLength(100) }),
    notes: new FormControl(value?.notes ?? '', { nonNullable: true, validators: Validators.maxLength(4000) }),
  });
}
@Component({ selector: 'app-visit-detail', imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeader, StatusBadge], templateUrl: './visit-detail.html' })
export class VisitDetail implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(CareApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly refreshes = new Subject<void>();
  readonly base = `/${this.router.url.split('/')[1]}/care`;
  readonly treatments = new FormArray<ReturnType<typeof treatmentGroup>>([]);
  readonly form = new FormGroup({
    assessment: new FormControl('', { nonNullable: true, validators: Validators.maxLength(10000) }),
    summary: new FormControl('', { nonNullable: true, validators: Validators.maxLength(4000) }),
    aftercare: new FormControl('', { nonNullable: true, validators: Validators.maxLength(4000) }),
    nextSteps: new FormControl('', { nonNullable: true, validators: Validators.maxLength(4000) }), treatments: this.treatments,
  });
  readonly caseForm = new FormGroup({ title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }), plan: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(4000)] }), internalNotes: new FormControl('', { nonNullable: true, validators: Validators.maxLength(10000) }) });
  visit: CareVisit | null = null;
  loading = false;
  saving = false;
  error = '';
  saved = '';
  get responsible(): boolean {
    const user = this.auth.currentUserValue;
    return !!this.visit && (user?.role === 'super-admin' || (user?.role === 'dentist' && user._id === this.visit.dentist._id && assignedClinicIds(user).includes(this.visit.clinic._id)));
  }
  get canEdit(): boolean { return this.responsible && this.visit?.state === 'in_progress'; }
  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.refreshes.pipe(startWith(undefined))]).pipe(switchMap(([params]) => {
      this.loading = true; this.error = '';
      return this.api.visit(params.get('id') ?? '').pipe(catchError(error => { this.error = careError(error); return of(null); }), finalize(() => this.loading = false));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(visit => { this.visit = visit; if (visit) this.fill(visit); });
  }
  private fill(visit: CareVisit): void {
    this.treatments.clear();
    for (const item of visit.treatments ?? []) this.treatments.push(treatmentGroup(item));
    this.form.patchValue({ assessment: visit.assessment ?? '', summary: visit.summary ?? '', aftercare: visit.aftercare ?? '', nextSteps: visit.nextSteps ?? '' });
    if (this.canEdit) this.form.enable(); else this.form.disable();
    this.form.markAsPristine();
  }
  addTreatment(): void { if (this.canEdit && this.treatments.length < 50) this.treatments.push(treatmentGroup()); }
  removeTreatment(index: number): void { if (this.canEdit) this.treatments.removeAt(index); }
  save(complete = false): void {
    if (!this.visit || !this.canEdit || this.saving) return;
    if (complete && !this.form.controls.summary.value.trim()) this.form.controls.summary.setErrors({ required: true });
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error = 'Check the record fields. Completing care requires a patient summary.'; return; }
    this.saving = true; this.error = ''; this.saved = '';
    this.api.saveVisitRecord(this.visit._id, { ...this.form.getRawValue(), revision: this.visit.revision, complete })
      .pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef)).subscribe({ next: visit => { this.visit = visit; this.fill(visit); this.saved = complete ? 'Visit completed. The summary is now available to the patient.' : 'Clinical draft saved.'; }, error: error => this.error = careError(error) });
  }
  start(): void {
    if (!this.visit || !this.responsible || this.saving) return;
    this.saving = true; this.error = '';
    this.api.transitionVisit(this.visit._id, 'in_progress').pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef)).subscribe({ next: visit => { this.visit = visit; this.fill(visit); }, error: error => this.error = careError(error) });
  }
  createCase(): void {
    if (!this.visit || !this.responsible || this.caseForm.invalid || this.saving) { this.caseForm.markAllAsTouched(); return; }
    if (this.form.dirty) { this.error = 'Save the clinical draft before creating a treatment case.'; return; }
    this.saving = true; this.error = '';
    this.api.createCase({ consultationVisit: this.visit._id, ...this.caseForm.getRawValue() }).pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => this.router.navigate([this.base, 'cases', result.careCase._id]), error: error => this.error = careError(error) });
  }
}
