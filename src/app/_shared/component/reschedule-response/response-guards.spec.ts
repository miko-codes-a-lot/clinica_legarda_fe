import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { Appointment, AppointmentStatus } from '../../model/appointment';
import { AppointmentService } from '../../service/appointment-service';
import { AlertService } from '../../service/alert.service';
import { dentistAppointment } from '../../../dentist/appointment/appointment-test-fixtures';
import { RescheduleResponse } from './reschedule-response';

const proposalId = '10000000-0000-4000-8000-000000000001';
describe('Shared proposal response lifecycle guards', () => {
  let fixture: ComponentFixture<RescheduleResponse>, appointment: Appointment;
  let api: {
      respondToReschedule: jasmine.Spy;
      cancelAppointment: jasmine.Spy;
      rescheduleAppointment: jasmine.Spy;
    },
    open: jasmine.Spy;
  const buttons = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
  beforeEach(async () => {
    appointment = dentistAppointment({
      status: AppointmentStatus.PENDING,
      date: new Date('2030-10-21'),
      rescheduleProposal: {
        id: proposalId,
        proposedAt: '2030-10-01',
        reason: 'Clinic timetable changed',
        previousSchedule: {
          date: '2030-10-20',
          startTime: '09:00',
          endTime: '09:30',
        },
      },
    });
    api = {
      respondToReschedule: jasmine.createSpy().and.returnValue(of(appointment)),
      cancelAppointment: jasmine.createSpy().and.returnValue(of(appointment)),
      rescheduleAppointment: jasmine
        .createSpy()
        .and.returnValue(of(appointment)),
    };
    await TestBed.configureTestingModule({
      imports: [RescheduleResponse],
      providers: [
        { provide: AppointmentService, useValue: api },
        {
          provide: AlertService,
          useValue: { success: () => undefined, error: () => undefined },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RescheduleResponse);
    fixture.componentRef.setInput('appointment', appointment);
    fixture.detectChanges();
    open = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<unknown>);
  });
  for (const mode of ['patient', 'staff'] as const) {
    for (const status of [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.REJECTED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.NO_SHOW,
    ]) {
      it(`hides stale proposal controls for ${mode} ${status} and prevents direct actions`, () => {
        appointment.status = status;
        fixture.componentRef.setInput('mode', mode);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('section')).toBeNull();
        fixture.componentInstance.accept();
        fixture.componentInstance.cancel();
        fixture.componentInstance.anotherTime();
        expect(open).not.toHaveBeenCalled();
        expect(api.respondToReschedule).not.toHaveBeenCalled();
      });
    }
    it(`blocks ${mode} acceptance during disruption while retaining cancel and alternate time`, () => {
      appointment.disruption = {
        message: 'Review required',
        closures: [],
        flaggedAt: '2030-10-01',
      };
      fixture.componentRef.setInput('mode', mode);
      fixture.componentInstance.agreementReason = 'Patient agreed by phone';
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('clinic review');
      const accept = buttons().find((button) =>
        button.textContent?.includes(
          mode === 'patient' ? 'Accept new time' : 'Record patient agreement',
        ),
      );
      expect(accept?.disabled).toBeTrue();
      expect(
        buttons().find((button) =>
          button.textContent?.includes('Cancel appointment'),
        )?.disabled,
      ).toBeFalse();
      expect(
        buttons().find((button) =>
          button.textContent?.includes(
            mode === 'patient'
              ? 'Request another time'
              : 'Revise proposed time',
          ),
        )?.disabled,
      ).toBeFalse();
      fixture.componentInstance.accept();
      expect(open).not.toHaveBeenCalled();
    });
  }
  it('keeps the captured proposal UUID when a confirmation dialog is open', () => {
    const closed = new Subject<boolean>();
    open.and.returnValue({
      afterClosed: () => closed,
    } as unknown as MatDialogRef<unknown>);
    fixture.componentInstance.accept();
    fixture.componentRef.setInput('appointment', {
      ...appointment,
      rescheduleProposal: {
        ...appointment.rescheduleProposal!,
        id: '10000000-0000-4000-8000-000000000002',
      },
    });
    closed.next(true);
    expect(api.respondToReschedule).toHaveBeenCalledOnceWith(appointment._id, {
      proposalId,
      method: 'patient_portal',
    });
  });
  it('retains attributed staff phone agreement with the proposal UUID', () => {
    fixture.componentRef.setInput('mode', 'staff');
    fixture.componentInstance.agreementReason = ' Patient agreed by phone ';
    fixture.componentInstance.accept();
    expect(api.respondToReschedule).toHaveBeenCalledOnceWith(appointment._id, {
      proposalId,
      method: 'phone',
      reason: 'Patient agreed by phone',
    });
  });
});
