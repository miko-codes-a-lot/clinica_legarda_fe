import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentForm } from './appointment-form';
import { dentistAppointment } from '../../../dentist/appointment/appointment-test-fixtures';
import { UserStatus } from '../../../_shared/model/user';
import { AppointmentStatus } from '../../../_shared/model/appointment';
import { AuthService } from '../../../_shared/service/auth-service';
import { UserService } from '../../../_shared/service/user-service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { BookingAvailabilityService } from '../../../_shared/service/booking-availability-service';
import { ReferralService } from '../../../_shared/service/referral-service';
import { AlertService } from '../../../_shared/service/alert.service';

describe('Dentist referral schedule selection', () => {
  const base = dentistAppointment({ _id: '', date: new Date('2030-10-20'), startTime: '', endTime: '' });
  const hours = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => ({ day, startTime: '09:00', endTime: '17:00' }));
  const clinic = { ...base.clinic, operatingHours: hours };
  const otherClinic = { ...clinic, _id: 'clinic-2', name: 'Receiving clinic' };
  const source = { ...base.dentist, status: UserStatus.CONFIRMED, clinics: [clinic._id!], operatingHours: hours };
  const receiver = { ...source, _id: 'dentist-2', clinics: [clinic._id!, 'clinic-2'], firstName: 'Receiving' };
  const history = { ...base, _id: 'history', dentist: source, clinic, status: AppointmentStatus.COMPLETED, date: new Date('2030-09-20'), startTime: '09:00', endTime: '09:30' };
  let fixture: ComponentFixture<AppointmentForm>, form: AppointmentForm;
  let load: jasmine.Spy, createReferral: jasmine.Spy, updateReferral: jasmine.Spy;
  beforeEach(async () => {
    load = jasmine.createSpy('load').and.returnValue(of({ operatingHours: hours, appointments: [] }));
    createReferral = jasmine.createSpy('create').and.returnValue(of({ _id: 'referral-1' }));
    updateReferral = jasmine.createSpy('update').and.returnValue(of({ _id: 'referral-1' }));
    await TestBed.configureTestingModule({ imports: [AppointmentForm], providers: [
      { provide: AuthService, useValue: { currentUserValue: source } },
      { provide: UserService, useValue: { getDentists: () => of([source, receiver]) } },
      { provide: AppointmentService, useValue: { getAll: () => of([history]) } },
      { provide: BookingAvailabilityService, useValue: { load } },
      { provide: ReferralService, useValue: { create: createReferral, update: updateReferral } },
      { provide: AlertService, useValue: { error: () => {} } },
    ] }).compileComponents();
    spyOn(TestBed.inject(MatDialog), 'open').and.returnValue({ afterClosed: () => of(true) } as never);
    jasmine.clock().install(); jasmine.clock().mockDate(new Date(2030, 9, 22));
  });
  afterEach(() => { fixture?.destroy(); jasmine.clock().uninstall(); });
  function open(edit = false, careCase?: string) {
    fixture = TestBed.createComponent(AppointmentForm); form = fixture.componentInstance;
    fixture.componentRef.setInput('appointment', { ...base, _id: edit ? 'existing' : '', clinic, dentist: source, careCase });
    fixture.componentRef.setInput('patients', [{ ...base.patient, status: UserStatus.CONFIRMED }]);
    fixture.componentRef.setInput('clinics', [clinic, otherClinic]); fixture.componentRef.setInput('dentalServices', base.services);
    fixture.detectChanges();
  }
  it('offers the receiving dentist and loads their schedule at another clinic', () => {
    open(); form.clinic.setValue('clinic-2'); fixture.detectChanges();
    expect(form.dentists.map(d => d._id)).toEqual(['dentist-2']);
    expect(form.dentist.enabled).toBeTrue();
    form.dentist.setValue('dentist-2'); fixture.detectChanges();
    expect(load).toHaveBeenCalledWith(receiver, otherClinic, '');
    expect(fixture.nativeElement.textContent).toContain('Appointment schedule');
    expect(form.bookingSchedule).toBeTruthy();
  });
  it('requires a referral reason when choosing another dentist in the same clinic', () => {
    open(); form.dentist.setValue('dentist-2'); fixture.detectChanges();
    expect(form.bookingUnavailable).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Reason for referral');
    form.reason.setValue('Specialist consultation');
    expect(form.bookingUnavailable).toBeFalse();
  });
  it('links a same-clinic referral to the selected receiving appointment', () => {
    open(); form.dentist.setValue('dentist-2'); form.reason.setValue('Specialist consultation');
    form.services.setValue([base.services[0]._id!]); form.date.setValue(new Date(2030, 9, 24)); fixture.detectChanges(); form.time.setValue('10:00');
    expect(form.rxform.valid).withContext(JSON.stringify(Object.fromEntries(Object.entries(form.rxform.controls).map(([name, control]) => [name, control.errors])))).toBeTrue();
    const submit = spyOn(form.onSubmitEvent, 'emit'); form.onSubmit();
    expect(createReferral).toHaveBeenCalledWith(jasmine.objectContaining({ fromDoctorId: source._id, fromClinicId: clinic._id, patient: base.patient._id, reason: 'Specialist consultation' }));
    expect(submit).toHaveBeenCalledWith(jasmine.objectContaining({ dentist: 'dentist-2', referral: 'referral-1', clinic: clinic._id }));
  });
  it('returns to ordinary self booking without creating a referral', () => {
    open(); form.dentist.setValue('dentist-2'); form.dentist.setValue(source._id!); fixture.detectChanges();
    expect(form.bookingUnavailable).toBeFalse(); expect(fixture.nativeElement.textContent).not.toContain('Reason for referral');
  });
  it('does not unlock edit or linked treatment-case dentist ownership', () => {
    open(true); expect(form.dentist.disabled).toBeTrue(); expect(form.dentists.map(d => d._id)).toEqual([source._id]);
    fixture.destroy(); open(false, 'case-1'); expect(form.dentist.disabled).toBeTrue(); expect(form.dentists.map(d => d._id)).toEqual([source._id]);
  });
  it('reuses a saved referral after a failed booking instead of reserving with a fresh referral', () => {
    open(); form.dentist.setValue('dentist-2'); form.reason.setValue('Specialist consultation');
    form.services.setValue([base.services[0]._id!]); form.date.setValue(new Date(2030, 9, 24)); fixture.detectChanges(); form.time.setValue('10:00');
    const ids: (string | undefined)[] = []; form.onSubmitEvent.subscribe(value => ids.push(value.referral));
    form.onSubmit();
    // Parent booking save failed or its response was lost; patient chooses another slot.
    form.isLoading = false; form.time.setValue('12:00'); form.onSubmit();
    expect(createReferral).toHaveBeenCalledTimes(1); expect(ids).toEqual(['referral-1', 'referral-1']);
  });
  it('keeps the same saved referral when the reason is revised before retrying', () => {
    open(); form.dentist.setValue('dentist-2'); form.reason.setValue('Specialist consultation');
    form.services.setValue([base.services[0]._id!]); form.date.setValue(new Date(2030, 9, 24)); fixture.detectChanges(); form.time.setValue('10:00');
    const ids: (string | undefined)[] = []; form.onSubmitEvent.subscribe(value => ids.push(value.referral));
    form.onSubmit(); form.reason.setValue('Updated referral reason'); form.onSubmit();
    expect(createReferral).toHaveBeenCalledTimes(1);
    expect(updateReferral).toHaveBeenCalledWith('referral-1', jasmine.objectContaining({ reason: 'Updated referral reason' }));
    expect(ids).toEqual(['referral-1', 'referral-1']);
  });
});
