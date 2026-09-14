import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { ReferralStatus } from '../../../_shared/model/referral';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { AuthService } from '../../../_shared/service/auth-service';
import { NotificationService } from '../../../_shared/service/notification-service';
import { dentistAppointment, dentistUser } from '../appointment-test-fixtures';
import { AppointmentList } from './appointment-list';

describe('Dentist appointment list', () => {
  let fixture: ComponentFixture<AppointmentList>;
  let appointments: Appointment[];
  let changes: Subject<void>;

  beforeEach(async () => {
    appointments = Object.values(AppointmentStatus).map(status => dentistAppointment({ _id: status, status }));
    changes = new Subject<void>();
    await TestBed.configureTestingModule({
      imports: [AppointmentList],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser$: of(dentistUser) } },
        { provide: AppointmentService, useValue: { getAllByDentist: () => of(appointments), changes$: changes } },
        { provide: NotificationService, useValue: { notifications$: of([]) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppointmentList);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('filters pending, confirmed, cancelled, and rejected appointments independently', () => {
    const host: HTMLElement = fixture.nativeElement;
    for (const status of Object.values(AppointmentStatus)) {
      const button = host.querySelector<HTMLButtonElement>(`button[data-status="${status}"]`);
      expect(button).withContext(status + ' filter').not.toBeNull();
      button?.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.dataSource.data.map(a => a.status)).toEqual([status]);
    }
  });

  it('includes rejected referral appointments in the rejected status filter', () => {
    const referred = dentistAppointment({ _id: 'rejected-referral', status: AppointmentStatus.REJECTED });
    referred.referral = { _id: 'referral-1', status: ReferralStatus.REJECTED, reasonOfDecline: 'Unavailable',
      appointment: dentistAppointment(), fromDoctorId: referred.dentist, fromClinicId: referred.clinic };
    appointments = [referred];
    changes.next();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[data-status="rejected"]')?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.dataSource.data.map(appointment => appointment._id)).toEqual(['rejected-referral']);
  });

  it('renders a readable clinic date instead of an ISO timestamp', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('td.mat-column-date')?.textContent?.trim()).toBe('Sep 10, 2026');
    expect(host.textContent).not.toContain('T00:00:00');
  });
});
