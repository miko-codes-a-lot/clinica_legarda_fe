import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Appointment } from '../../../_shared/model/appointment';
import { AuthService } from '../../../_shared/service/auth-service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { AlertService } from '../../../_shared/service/alert.service';
import { dentistAppointment } from '../appointment-test-fixtures';
import { CareApiService } from '../../../care/care-api.service';
import { ClosuresApiService } from '../../../care/closures/closures-api.service';
import { AppointmentDetails } from './appointment-details';

describe('Dentist outcome time eligibility', () => {
  let fixture: ComponentFixture<AppointmentDetails>, appointment: Appointment;
  beforeEach(async () => {
    appointment = dentistAppointment({
      date: new Date('2030-10-21'),
      startTime: '14:00',
      endTime: '14:30',
    });
    await TestBed.configureTestingModule({
      imports: [AppointmentDetails],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: appointment._id } } },
        },
        {
          provide: AuthService,
          useValue: { currentUserValue: appointment.dentist },
        },
        {
          provide: AppointmentService,
          useValue: { getOne: () => of(appointment), getAll: () => of([]) },
        },
        { provide: AlertService, useValue: {} },
        { provide: CareApiService, useValue: { visits: () => of([]) } },
        { provide: ClosuresApiService, useValue: {} },
      ],
    }).compileComponents();
  });
  const init = () => {
    fixture = TestBed.createComponent(AppointmentDetails);
    fixture.detectChanges();
  };
  const button = (text: string) =>
    (
      Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ) as HTMLButtonElement[]
    ).find((button) => button.textContent?.trim().endsWith(text));
  afterEach(() => fixture?.destroy());
  it('disables future completion and No-show in both the UI and direct handlers', () => {
    spyOn(Date, 'now').and.returnValue(Date.parse('2030-10-21T05:59:59.999Z'));
    init();
    // The component clock is explicitly set to the same instant used by the server.
    fixture.componentInstance.reminderNow = new Date(Date.now());
    fixture.detectChanges();
    expect(button('Completed')?.disabled).toBeTrue();
    expect(button('No show')?.disabled).toBeTrue();
    const open = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue({
      afterClosed: () => of(false),
    } as MatDialogRef<unknown>);
    fixture.componentInstance.completeAppointment();
    fixture.componentInstance.noShowAppointment();
    expect(open).not.toHaveBeenCalled();
  });
  it('enables completion at start and No-show at the exact original deadline as its timer advances', fakeAsync(() => {
    let now = Date.parse('2030-10-21T06:00:00Z');
    spyOn(Date, 'now').and.callFake(() => now);
    init();
    fixture.componentInstance.reminderNow = new Date(now);
    fixture.detectChanges();
    expect(button('Completed')?.disabled).toBeFalse();
    expect(button('No show')?.disabled).toBeTrue();
    now = Date.parse('2030-10-21T06:19:59.999Z');
    fixture.componentInstance.reminderNow = new Date(now);
    fixture.detectChanges();
    expect(button('No show')?.disabled).toBeTrue();
    now = Date.parse('2030-10-21T06:20:00Z');
    tick(30_000);
    fixture.detectChanges();
    expect(button('No show')?.disabled).toBeFalse();
    fixture.destroy();
  }));
});
