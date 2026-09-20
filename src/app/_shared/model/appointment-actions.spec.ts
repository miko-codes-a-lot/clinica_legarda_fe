import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, take } from 'rxjs';
import { AppointmentDetails as DentistDetails } from '../../dentist/appointment/appointment-details/appointment-details';
import { AppointmentDetails as AdminDetails } from '../../admin/appointment/appointment-details/appointment-details';
import { AppointmentDetails as SuperAdminDetails } from '../../super-admin/appointment/appointment-details/appointment-details';
import { dentistAppointment } from '../../dentist/appointment/appointment-test-fixtures';
import { AppointmentStatus } from './appointment';
import { AuthService } from '../service/auth-service';
import { AppointmentService } from '../service/appointment-service';
import { AlertService } from '../service/alert.service';

for (const [role, Details] of [['dentist', DentistDetails], ['admin', AdminDetails], ['super-admin', SuperAdminDetails]] as const) {
  describe(`${role} appointment action contracts`, () => {
    let details: DentistDetails | AdminDetails | SuperAdminDetails;
    let http: HttpTestingController;
    let result: Subject<string | undefined>;
    let open: jasmine.Spy;
    beforeEach(() => {
      result = new Subject();
      open = jasmine.createSpy('open').and.returnValue({ afterClosed: () => result.pipe(take(1)) });
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { currentUserValue: { _id: 'creator' } } },
      ] });
      http = TestBed.inject(HttpTestingController);
      details = TestBed.runInInjectionContext(() => new Details(
        TestBed.inject(AppointmentService), TestBed.inject(ActivatedRoute), TestBed.inject(Router),
        { open } as unknown as MatDialog,
        { success: () => undefined, error: () => undefined } as unknown as AlertService,
      ));
      details.appointment = dentistAppointment({ _id: 'a1', createdBy: 'creator', status: AppointmentStatus.PENDING });
    });
    afterEach(() => http.verify());

    it('hides and blocks cancellation of bookings created by someone else', () => {
      if (!details.appointment) throw new Error('Missing fixture');
      details.appointment.createdBy = 'patient';
      expect(details.canCancel).toBeFalse();
      details.cancelAppointment();
      expect(open).not.toHaveBeenCalled();
      http.expectNone('/appointments/a1/cancel');
    });

    it('asks the creator for a reason and keeps the booking if dismissed', () => {
      expect(details.canCancel).toBeTrue();
      details.cancelAppointment();
      expect(open.calls.mostRecent().args[1].data).toEqual({ action: 'cancel' });
      result.next(undefined);
      http.expectNone('/appointments/a1/cancel');
      expect(details.appointment?.status).toBe(AppointmentStatus.PENDING);
    });

    it('sends the creator cancellation reason and refreshes the saved appointment', () => {
      details.cancelAppointment();
      result.next('  Plans changed  ');
      const request = http.expectOne('/appointments/a1/cancel');
      expect(request.request.body).toEqual({ reason: 'Plans changed' });
      const appointment = details.appointment;
      request.flush({ ...appointment, status: AppointmentStatus.CANCELLED });
      if (role === 'dentist') http.expectOne(`/appointments?patient=${appointment?.patient._id}`).flush([]);
      expect(details.appointment?.status).toBe(AppointmentStatus.CANCELLED);
      expect(details.canCancel).toBeFalse();
    });

    if (role !== 'admin') {
      it('waits for a rejection reason and sends it to the API', () => {
        if (!('declineAppointment' in details)) throw new Error('Expected rejection action');
        details.declineAppointment();
        expect(open.calls.mostRecent().args[1].data).toEqual({ action: 'reject' });
        http.expectNone('/appointments/a1/reject');
        result.next('  Dentist unavailable  ');
        const request = http.expectOne('/appointments/a1/reject');
        expect(request.request.body).toEqual({ reason: 'Dentist unavailable' });
        const appointment = details.appointment;
        request.flush({ ...appointment, status: AppointmentStatus.REJECTED });
        if (role === 'dentist') http.expectOne(`/appointments?patient=${appointment?.patient._id}`).flush([]);
        expect(details.appointment?.status).toBe(AppointmentStatus.REJECTED);
        expect(details.isLoading).toBeFalse();
      });
      it('does not reject when the reason dialog is dismissed', () => {
        if (!('declineAppointment' in details)) throw new Error('Expected rejection action');
        details.declineAppointment();
        result.next(undefined);
        http.expectNone('/appointments/a1/reject');
        expect(details.appointment?.status).toBe(AppointmentStatus.PENDING);
      });
    }
  });
}
