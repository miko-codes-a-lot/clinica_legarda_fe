import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { Notification } from '../../../_shared/model/notification';
import { Referral } from '../../../_shared/model/referral';
import { UserSimple } from '../../../_shared/model/user-simple';
import { AuthService } from '../../../_shared/service/auth-service';
import { NotificationService } from '../../../_shared/service/notification-service';
import { ReferralService } from '../../../_shared/service/referral-service';
import { appointmentDateKey, clinicClock, compareAppointmentSchedule, formatAppointmentDate, isActiveAppointment } from '../../appointment/appointment-schedule';
import { DentistAppointmentFeed } from '../../appointment/dentist-appointment-feed';

interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  label: string;
  appointments: Appointment[];
}

@Component({
  selector: 'app-dentist-home',
  templateUrl: './homepage-index.html',
  styleUrl: './homepage-index.css',
  imports: [CommonModule, RouterLink],
  providers: [DentistAppointmentFeed],
})
export class HomepageIndex implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly feed = inject(DentistAppointmentFeed);
  private readonly authService = inject(AuthService);
  private readonly referralService = inject(ReferralService);
  private readonly notificationService = inject(NotificationService);
  private activeAppointments: Appointment[] = [];
  private loadedDentistId = '';

  user: UserSimple | null = null;
  todayAppointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];
  upcomingCount = 0;
  referrals: Referral[] = [];
  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = true;
  errorMessage = '';
  notificationError = '';
  referralError = '';
  notificationsLoading = true;
  markingReadId = '';
  todayStr = clinicClock().date;
  selectedDate = this.todayStr;
  calendarMonth = new Date(`${this.todayStr.slice(0, 7)}-01T00:00:00Z`);
  calendarDays: CalendarDay[] = [];
  selectedAppointments: Appointment[] = [];
  confirmedDays: { date: string; count: number }[] = [];
  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly formatDate = formatAppointmentDate;

  ngOnInit(): void {
    this.rebuildCalendar();
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => this.user = user);
    this.feed.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      if (state.dentistId !== this.loadedDentistId) {
        this.loadedDentistId = state.dentistId;
        this.updateAppointments([]);
      }
      this.isLoading = state.kind === 'loading';
      if (state.kind === 'loaded') {
        this.errorMessage = '';
        this.updateAppointments(state.appointments);
      } else if (state.kind === 'error') {
        this.errorMessage = state.message;
      }
    });

    this.authService.currentUser$.pipe(
      map(user => user?._id ?? ''), distinctUntilChanged(),
      switchMap(dentistId => this.notificationService.notifications$.pipe(
        map(notifications => notifications.filter(notification => notification.recipient === dentistId)),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(notifications => {
      this.unreadCount = notifications.filter(notification => !notification.read).length;
      this.notifications = [...notifications]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
        .map(notification => ({ ...notification, link: this.dentistNotificationLink(notification.link) }));
    });

    this.authService.currentUser$.pipe(
      map(user => user?._id ?? ''), distinctUntilChanged(),
      switchMap(dentistId => {
        if (!dentistId) return of([]);
        this.notificationsLoading = true;
        this.notificationError = '';
        return this.notificationService.getAllNotifications().pipe(catchError(() => {
          this.notificationError = 'Notifications could not be loaded.';
          return of([]);
        }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.notificationsLoading = false);

    this.authService.currentUser$.pipe(
      map(user => user?._id ?? ''), distinctUntilChanged(),
      switchMap(dentistId => {
        this.referralError = '';
        return dentistId ? this.referralService.getAll().pipe(
          map(referrals => referrals.filter(referral => {
            const fromId = typeof referral.fromDoctorId === 'string' ? referral.fromDoctorId : referral.fromDoctorId?._id;
            return fromId === dentistId;
          })),
          catchError(() => {
            this.referralError = 'Referral count unavailable.';
            return of([]);
          }),
        ) : of([]);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(referrals => this.referrals = referrals);
  }

  get pendingReferralCount(): number {
    return this.referrals.filter(referral => referral.status === 'pending').length;
  }

  refresh(): void {
    this.feed.refresh();
  }

  selectDate(date: string): void {
    this.selectedDate = date;
    this.calendarMonth = new Date(`${date.slice(0, 7)}-01T00:00:00Z`);
    this.rebuildCalendar();
  }

  moveMonth(offset: number): void {
    this.calendarMonth = new Date(Date.UTC(this.calendarMonth.getUTCFullYear(), this.calendarMonth.getUTCMonth() + offset, 1));
    this.rebuildCalendar();
  }

  markAsRead(notification: Notification): void {
    this.markingReadId = notification._id;
    this.notificationError = '';
    this.notificationService.markAsRead(notification._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.markingReadId = '',
      error: () => {
        this.markingReadId = '';
        this.notificationError = 'The notification could not be marked as read. Please try again.';
      },
    });
  }

  private updateAppointments(appointments: Appointment[]): void {
    const now = clinicClock();
    this.todayStr = now.date;
    this.activeAppointments = appointments.filter(isActiveAppointment).sort(compareAppointmentSchedule);
    this.todayAppointments = this.activeAppointments.filter(appointment => appointmentDateKey(appointment.date) === now.date);
    const upcoming = this.activeAppointments.filter(appointment => {
      const date = appointmentDateKey(appointment.date);
      return date > now.date || (date === now.date && appointment.startTime >= now.time);
    });
    this.upcomingCount = upcoming.length;
    this.upcomingAppointments = upcoming.slice(0, 5);
    const confirmed = new Map<string, number>();
    for (const appointment of this.activeAppointments) {
      const date = appointmentDateKey(appointment.date);
      if (appointment.status === AppointmentStatus.CONFIRMED && date >= now.date) {
        confirmed.set(date, (confirmed.get(date) ?? 0) + 1);
      }
    }
    this.confirmedDays = Array.from(confirmed, ([date, count]) => ({ date, count })).slice(0, 7);
    this.rebuildCalendar();
  }

  private rebuildCalendar(): void {
    const byDate = new Map<string, Appointment[]>();
    for (const appointment of this.activeAppointments) {
      const key = appointmentDateKey(appointment.date);
      byDate.set(key, [...(byDate.get(key) ?? []), appointment]);
    }
    const firstDay = new Date(this.calendarMonth);
    firstDay.setUTCDate(1 - firstDay.getUTCDay());
    this.calendarDays = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstDay);
      date.setUTCDate(firstDay.getUTCDate() + index);
      const key = appointmentDateKey(date);
      const appointments = byDate.get(key) ?? [];
      return {
        date: key, day: date.getUTCDate(), inMonth: date.getUTCMonth() === this.calendarMonth.getUTCMonth(),
        label: `${formatAppointmentDate(date)}, ${appointments.length} appointment${appointments.length === 1 ? '' : 's'}`,
        appointments,
      };
    });
    this.selectedAppointments = byDate.get(this.selectedDate) ?? [];
  }

  private dentistNotificationLink(link: string | undefined): string | undefined {
    if (!link) return undefined;
    const match = link.match(/^\/(?:admin|dentist)\/appointment\/details\/([a-zA-Z0-9-]+)$/);
    if (match) return `/dentist/appointment/details/${match[1]}`;
    return link.startsWith('/dentist/') ? link : undefined;
  }
}
