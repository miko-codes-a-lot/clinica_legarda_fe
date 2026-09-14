import { inject, Injectable } from '@angular/core';
import { catchError, distinctUntilChanged, fromEvent, interval, map, merge, Observable, of, shareReplay, skip, startWith, Subject, switchMap } from 'rxjs';
import { Appointment } from '../../_shared/model/appointment';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { AuthService } from '../../_shared/service/auth-service';
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
            appointments: appointments.filter(appointment => appointment.dentist?._id === dentistId &&
              (appointment.status === 'cancelled' || appointment.status === 'rejected' ||
                !appointment.referral || appointment.referral.status === 'confirmed')),
          })),
          catchError(() => of<AppointmentLoadState>({ kind: 'error', dentistId, message: 'Appointments could not be refreshed. Please try again.' })),
          startWith<AppointmentLoadState>({ kind: 'loading', dentistId }),
        )),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  refresh(): void {
    this.refreshRequests.next();
  }
}
