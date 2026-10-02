import { Component, DestroyRef, inject, Input, OnChanges, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, Subject, switchMap } from 'rxjs';
import { Appointment, AppointmentStatus } from '../../_shared/model/appointment';
import { CareApiService, careError } from '../care-api.service';
import { CareVisit, clinicToday } from '../care.models';
import { StatusBadge } from '../../_shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-appointment-care-links',
  imports: [RouterLink, StatusBadge],
  template: `
    @if (appointment; as data) {
      <section class="ui-card my-5">
        <h2 class="ui-section-title mb-3">Patient care</h2>
        @if (loading) { <p class="ui-muted" role="status">Loading linked visit…</p> }
        @if (error) { <p class="ui-alert-error mb-3" role="alert">{{ error }}</p><button type="button" class="ui-button-secondary mb-3" (click)="refresh()">Retry care links</button> }
        @if (visit && (visit.state === 'waiting' || visit.state === 'in_progress')) { <p class="ui-muted mb-3">This patient is checked in. Use the visit record to complete care, or resolve the queue visit before changing the appointment.</p> }
        <div class="flex flex-wrap items-center gap-3">
          @if (visit) { <app-status-badge [status]="visit.state" /><a class="ui-button" [routerLink]="[base, 'visits', visit._id]">Open visit record</a> }
          @else if (!loading && !error && canCheckIn) { <a class="ui-button" [routerLink]="[base, 'check-in']" [queryParams]="{ patient: data.patient._id, clinic: data.clinic._id, dentist: data.dentist._id, appointment: data._id }">Check in appointment</a> }
          @if (data.careCase) { <a class="ui-button-secondary" [routerLink]="[base, 'cases', data.careCase]">Linked treatment case</a> }
          <a class="ui-button-secondary" [routerLink]="[base, 'patients', data.patient._id]" [queryParams]="{ clinic: data.clinic._id }">Patient record</a>
        </div>
      </section>
    }
  `,
})
export class AppointmentCareLinks implements OnInit, OnChanges {
  @Input() appointment?: Appointment;
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(CareApiService);
  private readonly router = inject(Router);
  private readonly requests = new Subject<string>();
  readonly base = `/${this.router.url.split('/')[1]}/care`;
  visit: CareVisit | null = null;
  loading = false;
  error = '';
  get canCheckIn(): boolean { return this.appointment?.status === AppointmentStatus.CONFIRMED && new Date(this.appointment.date).toISOString().slice(0, 10) === clinicToday(); }
  ngOnInit(): void {
    this.requests.pipe(switchMap(appointment => {
      this.loading = true; this.error = '';
      return this.api.visits({ appointment }).pipe(catchError(error => { this.error = careError(error); return of([]); }), finalize(() => this.loading = false));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(visits => this.visit = visits[0] ?? null);
    this.refresh();
  }
  ngOnChanges(): void { this.refresh(); }
  refresh(): void { if (this.appointment?._id) this.requests.next(this.appointment._id); }
}
