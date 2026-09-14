import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { Notification, NotificationType } from '../../../_shared/model/notification';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { AuthService } from '../../../_shared/service/auth-service';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { NotificationService } from '../../../_shared/service/notification-service';
import { ReferralService } from '../../../_shared/service/referral-service';
import { dentistAppointment, dentistUser } from '../../appointment/appointment-test-fixtures';
import { HomepageIndex } from './homepage-index';

describe('Dentist dashboard', () => {
  let fixture: ComponentFixture<HomepageIndex>;
  let appointments: Appointment[];
  let changes: Subject<void>;
  let notifications: BehaviorSubject<Notification[]>;
  let failAppointments: boolean;

  const notification: Notification = {
    _id: 'notification-1', recipient: dentistUser._id, message: 'Appointment rescheduled.',
    read: false, type: NotificationType.APPOINTMENT_STATUS_UPDATED,
    link: '/admin/appointment/details/appointment-1',
    createdAt: '2026-09-07T01:00:00.000Z', updatedAt: '2026-09-07T01:00:00.000Z',
  };

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-09-07T01:00:00.000Z'));
    appointments = [];
    changes = new Subject<void>();
    notifications = new BehaviorSubject<Notification[]>([]);
    failAppointments = false;
    const getAppointments = () => failAppointments ? throwError(() => new Error('Offline')) : of(appointments);
    await TestBed.configureTestingModule({
      imports: [HomepageIndex],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser$: of(dentistUser) } },
        { provide: ClinicService, useValue: { getAll: () => of([]) } },
        { provide: AppointmentService, useValue: { getAll: getAppointments, getAllByDentist: getAppointments, changes$: changes } },
        { provide: ReferralService, useValue: { getAll: () => of([]) } },
        { provide: NotificationService, useValue: {
          notifications$: notifications,
          getAllNotifications: () => of(notifications.value),
          markAsRead: () => of({ ...notification, read: true }),
        } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomepageIndex);
  });

  afterEach(() => {
    fixture.destroy();
    jasmine.clock().uninstall();
  });

  it('keeps later appointments today and excludes cancelled, rejected, and elapsed appointments from upcoming', () => {
    appointments = [
      dentistAppointment({ _id: 'later-today', date: new Date('2026-09-07T00:00:00Z') }),
      dentistAppointment({ _id: 'past-today', date: new Date('2026-09-07T00:00:00Z'), startTime: '08:00', endTime: '08:30' }),
      dentistAppointment({ _id: 'cancelled', status: AppointmentStatus.CANCELLED }),
      dentistAppointment({ _id: 'rejected', status: AppointmentStatus.REJECTED }),
      dentistAppointment({ _id: 'pending', status: AppointmentStatus.PENDING }),
    ];
    fixture.detectChanges();
    expect(fixture.componentInstance.upcomingAppointments.map(a => a._id)).toEqual(['later-today', 'pending']);
  });

  it('shows scheduled dates in a navigable calendar and the selected date’s time, patient, and service', () => {
    appointments = [dentistAppointment()];
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const day = host.querySelector<HTMLButtonElement>('button[data-date="2026-09-10"]');
    expect(day).withContext('calendar day with appointment').not.toBeNull();
    day?.click();
    fixture.detectChanges();
    const schedule = host.querySelector('[data-testid="selected-schedule"]')?.textContent ?? '';
    expect(schedule).toContain('Thu, Sep 10, 2026');
    expect(host.querySelector('.confirmed-days')?.textContent).toContain('Thu, Sep 10');
    expect(schedule).toContain('13:00');
    expect(schedule).toContain('Maria Santos');
    expect(schedule).toContain('Cleaning');
    host.querySelector<HTMLButtonElement>('button[aria-label="Next month"]')?.click();
    fixture.detectChanges();
    expect(host.querySelector('button[data-date="2026-10-10"]')).not.toBeNull();
  });

  it('removes cancellation and moves rescheduling after local changes and notification delivery', () => {
    appointments = [dentistAppointment()];
    fixture.detectChanges();
    appointments = [dentistAppointment({ status: AppointmentStatus.CANCELLED })];
    changes.next();
    expect(fixture.componentInstance.upcomingAppointments).toEqual([]);
    appointments = [dentistAppointment({ date: new Date('2026-09-12T00:00:00Z'), startTime: '15:00', endTime: '16:00' })];
    notifications.next([notification]);
    fixture.detectChanges();
    expect(fixture.componentInstance.upcomingAppointments[0]?.startTime).toBe('15:00');
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('button[data-date="2026-09-10"]')?.getAttribute('aria-label')).toContain('0 appointments');
    expect(host.querySelector('button[data-date="2026-09-12"]')?.getAttribute('aria-label')).toContain('1 appointment');
  });

  it('shows only the signed-in dentist’s notifications with a dentist appointment link', () => {
    notifications.next([notification, { ...notification, _id: 'other', recipient: 'another-dentist', message: 'Private other message' }]);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain(notification.message);
    expect(host.textContent).not.toContain('Private other message');
    expect(host.querySelector('a[href="/dentist/appointment/details/appointment-1"]')).not.toBeNull();
  });

  it('reports a load failure and recovers on refresh without keeping the loading state', () => {
    failAppointments = true;
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).not.toBeNull();
    failAppointments = false;
    appointments = [dentistAppointment()];
    changes.next();
    fixture.detectChanges();
    expect(fixture.componentInstance.upcomingAppointments.length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).toBeNull();
  });
});
