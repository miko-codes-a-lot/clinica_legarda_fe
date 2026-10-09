import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { DatePicker } from '../../../_shared/component/date-picker/date-picker';
import { AppointmentPayload } from '../appointment-payload';
import { UserStatus } from '../../../_shared/model/user';
import { AlertService } from '../../../_shared/service/alert.service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { AuthService } from '../../../_shared/service/auth-service';
import { BookingAvailabilityService } from '../../../_shared/service/booking-availability-service';
import { ReasonService } from '../../../_shared/service/reason-service';
import { ReferralService } from '../../../_shared/service/referral-service';
import { UserService } from '../../../_shared/service/user-service';
import { dentistAppointment } from '../../../dentist/appointment/appointment-test-fixtures';
import { AppointmentForm } from './appointment-form';

describe('Staff appointment booking horizon', () => {
  let fixture: ComponentFixture<AppointmentForm>;
  let form: AppointmentForm;
  let submitted: AppointmentPayload[];
  const base = dentistAppointment({ _id: '', startTime: '', endTime: '' });
  const hours = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .map(day => ({ day, startTime: '09:00', endTime: '17:00' }));
  const dentist = { ...base.dentist, status: UserStatus.CONFIRMED, clinics: ['clinic-1'], operatingHours: hours };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentForm],
      providers: [
        { provide: UserService, useValue: { getDentists: () => of([dentist]) } },
        { provide: AppointmentService, useValue: { getAll: () => of([]) } },
        { provide: AuthService, useValue: { currentUserValue: dentist } },
        { provide: BookingAvailabilityService, useValue: { load: () => of({ operatingHours: hours, appointments: [] }) } },
        { provide: ReasonService, useValue: { getAll: () => of([]) } },
        { provide: ReferralService, useValue: {} },
        { provide: AlertService, useValue: { error: jasmine.createSpy('error') } },
      ],
    }).compileComponents();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2030, 9, 9, 10));
    submitted = [];
  });

  afterEach(() => { fixture?.destroy(); jasmine.clock().uninstall(); });

  function openForm(careCase?: string) {
    fixture = TestBed.createComponent(AppointmentForm);
    form = fixture.componentInstance;
    fixture.componentRef.setInput('appointment', { ...base, careCase });
    fixture.componentRef.setInput('clinics', [base.clinic]);
    fixture.componentRef.setInput('patients', [{ ...base.patient, status: UserStatus.CONFIRMED }]);
    fixture.componentRef.setInput('dentalServices', base.services);
    form.onSubmitEvent.subscribe(value => submitted.push(value));
    fixture.detectChanges();
  }

  function selectAndSubmit(date: Date) {
    const picker: DatePicker = fixture.debugElement.query(By.directive(DatePicker)).componentInstance;
    picker.onDateChange({ value: date });
    form.time.setValue('09:00');
    fixture.detectChanges();
    form.onSubmit();
  }

  it('books a linked case at the six-month boundary and retains its case context', () => {
    openForm('case-1');
    selectAndSubmit(new Date(2031, 3, 9));
    expect(form.date.valid).toBeTrue();
    expect(submitted.length).toBe(1);
    expect(submitted[0]).toEqual(jasmine.objectContaining({
      careCase: 'case-1', patient: 'patient-1', dentist: 'dentist-1', clinic: 'clinic-1', date: new Date(2031, 3, 9),
    }));
  });

  it('rejects a linked appointment after six months', () => {
    openForm('case-1');
    selectAndSubmit(new Date(2031, 3, 10));
    expect(form.date.hasError('matDatepickerMax')).toBeTrue();
    expect(submitted).toEqual([]);
  });

  it('preserves the three-month boundary for an ordinary booking', () => {
    openForm();
    selectAndSubmit(new Date(2031, 0, 9));
    expect(submitted.length).toBe(1);
    submitted = [];
    selectAndSubmit(new Date(2031, 0, 10));
    expect(form.date.hasError('matDatepickerMax')).toBeTrue();
    expect(submitted).toEqual([]);
  });

  it('clamps a linked six-month limit to the last day of a shorter target month', () => {
    jasmine.clock().mockDate(new Date(2030, 7, 31, 10));
    openForm('case-1');
    selectAndSubmit(new Date(2031, 1, 28));
    expect(submitted.length).toBe(1);
    submitted = [];
    selectAndSubmit(new Date(2031, 2, 1));
    expect(form.date.hasError('matDatepickerMax')).toBeTrue();
    expect(submitted).toEqual([]);
  });
});
