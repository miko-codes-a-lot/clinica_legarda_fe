import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserStatus } from '../../../_shared/model/user';
import { AppointmentForm } from './appointment-form';
import { AppointmentPage } from '../../../client/appointment/appointment';
import { dentistAppointment } from '../../../dentist/appointment/appointment-test-fixtures';
import { AlertService } from '../../../_shared/service/alert.service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { AuthService } from '../../../_shared/service/auth-service';
import { BookingAvailabilityService } from '../../../_shared/service/booking-availability-service';
import { ReasonService } from '../../../_shared/service/reason-service';
import { ReferralService } from '../../../_shared/service/referral-service';
import { UserService } from '../../../_shared/service/user-service';

// Omitting clinic filtering or resetting selected IDs exposes invalid options.
for (const kind of ['staff', 'patient'] as const) {
  describe(`${kind} clinic service selection`, () => {
    let fixture: ComponentFixture<AppointmentForm | AppointmentPage>;
    const base = dentistAppointment({ _id: '', startTime: '', endTime: '' });
    const hours = [{ day: 'monday', startTime: '09:00', endTime: '17:00' }];
    const dentist = { ...base.dentist, status: UserStatus.CONFIRMED, clinics: ['clinic-1', 'clinic-2'], operatingHours: hours };
    const catalog = [
      { _id: 'service-1', name: 'A cleaning', duration: 30, clinics: ['clinic-1'] },
      { _id: 'service-2', name: 'B filling', duration: 60, clinics: ['clinic-2'] },
      { _id: 'service-3', name: 'Legacy', duration: 30 },
      { _id: 'service-4', name: 'Unavailable', duration: 30, clinics: [] },
    ];
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [AppointmentForm, AppointmentPage], providers: [
        { provide: UserService, useValue: { getDentists: () => of([dentist]) } },
        { provide: AppointmentService, useValue: { getAll: () => of([]) } },
        { provide: AuthService, useValue: { currentUserValue: dentist, currentUser$: of({ ...base.patient, status: UserStatus.CONFIRMED }) } },
        { provide: BookingAvailabilityService, useValue: { load: () => of({ operatingHours: hours, appointments: [] }) } },
        { provide: ReasonService, useValue: { getAll: () => of([]) } },
        { provide: ReferralService, useValue: {} },
        { provide: AlertService, useValue: { error: jasmine.createSpy('error') } },
      ] }).compileComponents();
      fixture = kind === 'staff' ? TestBed.createComponent(AppointmentForm) : TestBed.createComponent(AppointmentPage);
      fixture.componentRef.setInput('appointment', base);
      fixture.componentRef.setInput('clinics', [base.clinic, { ...base.clinic, _id: 'clinic-2', name: 'B' }]);
      if (kind === 'staff') fixture.componentRef.setInput('patients', [{ ...base.patient, status: UserStatus.CONFIRMED }]);
      fixture.componentRef.setInput('dentalServices', catalog);
      fixture.detectChanges();
    });
    afterEach(() => fixture?.destroy());
    function optionIds(): string[] {
      return fixture.componentInstance.appointmentFields.find(field => field.name === 'services')?.options?.map((option: { value: string }) => option.value) ?? [];
    }
    it('offers only selected-clinic and legacy services', () => {
      expect(optionIds()).toEqual(['service-1', 'service-3']);
    });
    it('clears selected services when clinic changes and rebuilds clinic options', () => {
      fixture.componentInstance.services.setValue(['service-1']);
      fixture.componentInstance.clinic.setValue('clinic-2');
      fixture.detectChanges();
      expect(fixture.componentInstance.services.value).toEqual([]);
      expect(optionIds()).toEqual(['service-2', 'service-3']);
    });
    it('rejects manually injected services unavailable at the selected clinic', () => {
      fixture.componentInstance.services.setValue(['service-2']);
      expect(fixture.componentInstance.services.valid).toBeFalse();
    });
    it('offers no service without a clinic selection', () => {
      fixture.componentInstance.clinic.setValue('');
      fixture.detectChanges();
      expect(optionIds()).toEqual([]);
    });
  });
}
