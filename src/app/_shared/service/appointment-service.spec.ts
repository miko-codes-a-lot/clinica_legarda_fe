import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppointmentService } from './appointment-service';

describe('Appointment change requests', () => {
  let service: AppointmentService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AppointmentService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('includes the supplied cancellation reason in the request', () => {
    service.cancelAppointment('appointment-1', 'Work conflict').subscribe();
    const request = http.expectOne('/appointments/appointment-1/cancel');
    expect(request.request.body).toEqual({ reason: 'Work conflict' });
    request.flush({});
  });

  it('refreshes subscribers only after a successful appointment change', () => {
    const changes = jasmine.createSpy('changes');
    service.changes$.subscribe(changes);
    service.cancelAppointment('a1', 'Work conflict').subscribe();
    expect(changes).not.toHaveBeenCalled();
    http.expectOne('/appointments/a1/cancel').flush({});
    expect(changes).toHaveBeenCalledTimes(1);
    service.cancelAppointment('a2', 'Work conflict').subscribe({ error: () => undefined });
    http.expectOne('/appointments/a2/cancel').flush({}, { status: 500, statusText: 'Server error' });
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('preserves a selected calendar day and reason when rescheduling', () => {
    const date = new Date(2026, 8, 16);
    const payload = { date, startTime: '11:00', endTime: '12:00', reason: 'Travel plans changed' };
    service.rescheduleAppointment('appointment-1', payload).subscribe();
    const request = http.expectOne('/appointments/appointment-1/reschedule');
    expect(new Date(request.request.body.date).toISOString()).toBe('2026-09-16T00:00:00.000Z');
    expect(request.request.body.reason).toBe('Travel plans changed');
    expect(payload.date).toBe(date);
    request.flush({});
  });
});
