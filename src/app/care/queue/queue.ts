import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, Subject, switchMap } from 'rxjs';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { EmptyState } from '../../_shared/ui/empty-state/empty-state';
import { StatusBadge } from '../../_shared/ui/status-badge/status-badge';
import { ClinicService } from '../../_shared/service/clinic-service';
import { AuthService } from '../../_shared/service/auth-service';
import { assignedClinicIds } from '../../_shared/model/user';
import { CareApiService, careError } from '../care-api.service';
import { CareClinic, CareVisit, clinicToday } from '../care.models';

@Component({ selector: 'app-treatment-queue', imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeader, EmptyState, StatusBadge], templateUrl: './queue.html' })
export class TreatmentQueue implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(CareApiService);
  private readonly clinicsApi = inject(ClinicService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly refreshes = new Subject<void>();
  readonly base = `/${this.router.url.split('/')[1]}/care`;
  readonly filters = new FormGroup({ clinic: new FormControl('', { nonNullable: true }), date: new FormControl(clinicToday(), { nonNullable: true, validators: Validators.required }) });
  readonly cancellation = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] });
  clinics: CareClinic[] = [];
  visits: CareVisit[] = [];
  selected: CareVisit | null = null;
  loading = false;
  busy = false;
  error = '';
  saved = '';
  get waiting(): CareVisit[] { return this.visits.filter(visit => visit.state === 'waiting'); }
  get inProgress(): CareVisit[] { return this.visits.filter(visit => visit.state === 'in_progress'); }
  get ended(): CareVisit[] { return this.visits.filter(visit => visit.state === 'completed' || visit.state === 'cancelled'); }
  canStart(visit: CareVisit): boolean { return this.auth.currentUserValue?.role === 'super-admin' || (this.auth.currentUserValue?.role === 'dentist' && this.auth.currentUserValue._id === visit.dentist._id); }

  ngOnInit(): void {
    this.clinicsApi.getAccessible().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: clinics => {
      const user = this.auth.currentUserValue;
      const assigned = user ? assignedClinicIds(user) : [];
      this.clinics = clinics.filter(clinic => clinic._id && (user?.role !== 'dentist' || assigned.includes(clinic._id))).map(clinic => ({ _id: clinic._id ?? '', name: clinic.name }));
    }, error: error => this.error = careError(error) });
    this.refreshes.pipe(switchMap(() => {
      this.loading = true; this.error = '';
      return this.api.visits(this.filters.getRawValue(), true).pipe(catchError(error => { this.error = careError(error); return of([]); }), finalize(() => this.loading = false));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(visits => this.visits = visits);
    this.refresh();
  }
  refresh(): void { if (this.filters.valid) this.refreshes.next(); }
  start(visit: CareVisit): void { this.change(visit, 'in_progress'); }
  chooseCancellation(visit: CareVisit): void { this.selected = visit; this.cancellation.reset(); }
  cancel(): void { if (this.selected && this.cancellation.valid && this.cancellation.value.trim()) this.change(this.selected, 'cancelled', this.cancellation.value.trim()); }
  private change(visit: CareVisit, state: 'in_progress' | 'cancelled', reason?: string): void {
    if (this.busy) return;
    this.busy = true; this.error = ''; this.saved = '';
    this.api.transitionVisit(visit._id, state, reason).pipe(finalize(() => this.busy = false), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.selected = null; this.saved = state === 'in_progress' ? 'Care started.' : 'Visit cancelled. History retained.'; this.refresh(); },
      error: error => this.error = careError(error),
    });
  }
}
