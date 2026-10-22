import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AppointmentCreate } from './appointment-create';
import { AppointmentCreate as ReferralCreate } from '../../../dentist/referral-request/appointment-create/appointment-create';
import { AuthService } from '../../../_shared/service/auth-service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { UserService } from '../../../_shared/service/user-service';
import { AlertService } from '../../../_shared/service/alert.service';
import { CareApiService } from '../../../care/care-api.service';
import { dentistAppointment } from '../../../dentist/appointment/appointment-test-fixtures';

for (const kind of ['appointment', 'referral'] as const) {
  describe(`${kind} creation referral navigation`, () => {
    let create: jasmine.Spy, navigate: jasmine.Spy;
    const own = dentistAppointment(), referred = { ...own, dentist: { ...own.dentist, _id: 'receiving-dentist' }, referral: { _id: 'referral-1' } };
    beforeEach(() => {
      create = jasmine.createSpy().and.returnValue(of(referred)); navigate = jasmine.createSpy();
      TestBed.configureTestingModule({ providers: [AppointmentCreate, ReferralCreate,
        { provide: AuthService, useValue: { currentUserValue: own.dentist } },
        { provide: AppointmentService, useValue: { create } },
        { provide: Router, useValue: { navigate, url: '/dentist/appointment/create' } },
        { provide: ActivatedRoute, useValue: {} }, { provide: CareApiService, useValue: {} },
        { provide: ClinicService, useValue: {} }, { provide: DentalServicesService, useValue: {} }, { provide: UserService, useValue: {} },
        { provide: AlertService, useValue: { error: () => {} } },
      ] });
    });
    const page = () => kind === 'appointment' ? TestBed.inject(AppointmentCreate) : TestBed.inject(ReferralCreate);
    it('opens authorized referral context after creating a receiving appointment', () => {
      page().onSubmit({} as never);
      expect(navigate).toHaveBeenCalledWith(['/dentist/referral-request/details', 'referral-1'], { replaceUrl: true });
    });
    it('keeps ordinary self bookings on appointment details', () => {
      create.and.returnValue(of(own)); page().onSubmit({} as never);
      expect(navigate).toHaveBeenCalledWith(['/dentist/appointment/details', own._id], { replaceUrl: true });
    });
    it('keeps failed referrals on the form', () => {
      create.and.returnValue(throwError(() => ({ error: { message: 'Unavailable' } }))); page().onSubmit({} as never);
      expect(navigate).not.toHaveBeenCalled(); expect(page().isLoading).toBeFalse();
    });
  });
}
