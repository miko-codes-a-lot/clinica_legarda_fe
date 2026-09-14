import { inject, Injectable } from '@angular/core';
import { catchError, combineLatest, distinctUntilChanged, fromEvent, interval, map, merge, Observable, of, scan, shareReplay, skip, startWith, Subject, switchMap } from 'rxjs';
import { Appointment } from '../../_shared/model/appointment';
import { dentistAppointments, dentistClinicOptions } from '../../_shared/model/appointment-filters';
import { Clinic } from '../../_shared/model/clinic';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { AuthService } from '../../_shared/service/auth-service';
import { ClinicService } from '../../_shared/service/clinic-service';
import { NotificationService } from '../../_shared/service/notification-service';

type AppointmentLoadState =
  | { kind: 'loading'; dentistId: string }
  | { kind: 'loaded'; dentistId: string; appointments: Appointment[] }
  | { kind: 'error'; dentistId: string; message: string };

@Injectable()
export class DentistAppointmentFeed {
  private readonly appointments = inject(AppointmentService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly clinics = inject(ClinicService);
  private readonly refreshRequests = new Subject<void>();

  readonly state$: Observable<AppointmentLoadState> = this.auth.currentUser$.pipe(
    map(user => user?._id ?? ''),
    distinctUntilChanged(),
    switchMap(dentistId => {
      if (!dentistId) return of<AppointmentLoadState>({ kind: 'loaded', dentistId, appointments: [] });
      return merge(
        of(undefined), this.refreshRequests, this.appointments.changes$,
        this.notifications.notifications$.pipe(skip(1)),
        interval(30_000), fromEvent(window, 'focus'),
      ).pipe(
        switchMap(() => this.appointments.getAllByDentist(dentistId).pipe(
          map((appointments): AppointmentLoadState => ({
            kind: 'loaded', dentistId,
            appointments: dentistAppointments(appointments, dentistId),
          })),
          catchError(() => of<AppointmentLoadState>({ kind: 'error', dentistId, message: 'Appointments could not be refreshed. Please try again.' })),
          startWith<AppointmentLoadState>({ kind: 'loading', dentistId }),
        )),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly clinicOptions$ = combineLatest([
    this.auth.currentUser$,
    this.state$.pipe(scan((previous, state) => ({
      dentistId: state.dentistId,
      appointments: state.kind === 'loaded' ? state.appointments
        : state.dentistId === previous.dentistId ? previous.appointments : [],
    }), { dentistId: '', appointments: [] as Appointment[] })),
    this.clinics.getAll().pipe(catchError(() => of<Clinic[]>([])), startWith([] as Clinic[])),
  ]).pipe(
    map(([user, state, clinics]) => dentistClinicOptions(user, state.appointments, clinics)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  refresh(): void {
    this.refreshRequests.next();
  }
}
