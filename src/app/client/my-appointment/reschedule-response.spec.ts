import { By } from '@angular/platform-browser';
import { RescheduleResponse } from '../../_shared/component/reschedule-response/reschedule-response';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MyAppointment } from './my-appointment';
import {
  Appointment,
  AppointmentStatus,
} from '../../_shared/model/appointment';
import { dentistAppointment } from '../../dentist/appointment/appointment-test-fixtures';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { AuthService } from '../../_shared/service/auth-service';
import { ReasonService } from '../../_shared/service/reason-service';
import { AlertService } from '../../_shared/service/alert.service';
import { DependentsApiService } from '../dependents/dependents-api.service';

const token = '10000000-0000-4000-8000-000000000001';
describe('Patient response to a clinic proposed time', () => {
  let fixture: ComponentFixture<MyAppointment>, appointment: Appointment;
  let api: {
    getAll: jasmine.Spy;
    getOne: jasmine.Spy;
    respondToReschedule: jasmine.Spy;
    cancelAppointment: jasmine.Spy;
    rescheduleAppointment: jasmine.Spy;
  };
  const buttons = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
  beforeEach(async () => {
    appointment = Object.assign(
      dentistAppointment({
        status: AppointmentStatus.PENDING,
        date: new Date('2030-10-21'),
        createdBy: 'clinic-staff',
      }),
      {
        scheduleVersion: 1,
        rescheduleProposal: {
          id: token,
          reason: 'Dentist availability changed',
          proposedAt: '2030-10-01',
          previousSchedule: {
            date: '2030-10-20',
            startTime: '09:00',
            endTime: '09:30',
          },
        },
      },
    );
    api = {
      getAll: jasmine.createSpy().and.callFake(() => of([appointment])),
      getOne: jasmine.createSpy().and.callFake(() => of(appointment)),
      respondToReschedule: jasmine
        .createSpy()
        .and.returnValue(new Subject<Appointment>()),
      cancelAppointment: jasmine.createSpy(),
      rescheduleAppointment: jasmine.createSpy(),
    };
    await TestBed.configureTestingModule({
      imports: [MyAppointment],
      providers: [
        provideRouter([]),
        { provide: AppointmentService, useValue: api },
        {
          provide: AuthService,
          useValue: {
            currentUserValue: appointment.patient,
            currentUser$: of(appointment.patient),
          },
        },
        { provide: ReasonService, useValue: { getAll: () => of([]) } },
        { provide: DependentsApiService, useValue: { list: () => of([]) } },
        {
          provide: AlertService,
          useValue: {
            success: jasmine.createSpy(),
            error: jasmine.createSpy(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MyAppointment);
    fixture.detectChanges();
    const dialog = fixture.debugElement
      .query(By.directive(RescheduleResponse))
      .injector.get(MatDialog);
    spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<unknown>);
  });
  it('offers accept, another time and cancellation for a pending clinic-created proposal', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Accept new time');
    expect(text).toContain('Request another time');
    expect(text).toContain('Cancel appointment');
    expect(text).toContain('Dentist availability changed');
    expect(
      fixture.nativeElement.querySelector('app-reschedule-response dd')
        .textContent,
    ).toContain('Oct 20, 2030');
  });
  it('submits the current proposal identity once when the patient accepts', () => {
    const button = buttons().find((button) =>
      button.textContent?.includes('Accept new time'),
    );
    expect(button).toBeDefined();
    button?.click();
    fixture.detectChanges();
    button?.click();
    expect(api.respondToReschedule).toHaveBeenCalledOnceWith(appointment._id, {
      proposalId: token,
      method: 'patient_portal',
    });
    expect(button?.disabled).toBeTrue();
  });
  it('does not offer acceptance after the proposed time has passed', () => {
    appointment.date = new Date('2020-10-21');
    fixture.detectChanges();
    const button = buttons().find((button) =>
      button.textContent?.includes('Accept new time'),
    );
    expect(button?.disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('passed');
  });
});
