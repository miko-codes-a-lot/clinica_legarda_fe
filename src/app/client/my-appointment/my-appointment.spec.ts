import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MyAppointment } from './my-appointment';
import { AuthService } from '../../_shared/service/auth-service';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { ReasonService } from '../../_shared/service/reason-service';
import { AlertService } from '../../_shared/service/alert.service';
import { Appointment } from '../../_shared/model/appointment';

describe('Patient appointment changes', () => {
  let component: MyAppointment;
  let http: HttpTestingController;
  let appointment: Appointment;
  let dialogResult: unknown;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    const appointments = TestBed.inject(AppointmentService);
    appointment = appointments.getEmptyNonNullDoc();
    appointment._id = 'a1';
    appointment.patient._id = 'p1';
    appointment.dentist._id = 'd1';
    component = TestBed.runInInjectionContext(() => new MyAppointment(
      { currentUser$: of({ _id: 'p1' }) } as unknown as AuthService,
      appointments,
      { open: () => ({ afterClosed: () => of(dialogResult) }) } as unknown as MatDialog,
      TestBed.inject(ReasonService),
      { success: () => undefined, error: () => undefined } as unknown as AlertService,
    ));
  });
  afterEach(() => http.verify());
  it('does not cancel when the reason dialog is dismissed', () => {
    dialogResult = undefined;
    component.onCancel(appointment);
    http.expectNone('/appointments/a1/cancel');
    expect(component.isLoading).toBeFalse();
  });
  it('saves the cancellation reason and refreshes the patient list', () => {
    dialogResult = 'Work conflict';
    component.onCancel(appointment);
    const request = http.expectOne('/appointments/a1/cancel');
    expect(request.request.body).toEqual({ reason: 'Work conflict' });
    request.flush({});
    http.expectOne('/appointments?patient=p1').flush([]);
    expect(component.isLoading).toBeFalse();
  });
  it('sends the reschedule reason without shifting the selected day', () => {
    dialogResult = { date: '2026-09-16', startTime: '11:00', endTime: '12:00', reason: 'Travel plans' };
    component.onReschedule(appointment);
    const request = http.expectOne('/appointments/a1/reschedule');
    expect(request.request.body).toEqual({ date: '2026-09-16', startTime: '11:00', endTime: '12:00',
      reason: 'Travel plans', patient: 'p1', dentist: 'd1' });
    request.flush({});
    http.expectOne('/appointments?patient=p1').flush([]);
  });
});
