import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Appointment, AppointmentStatus } from '../../model/appointment';
import { Clinic } from '../../model/clinic';
import { User } from '../../model/user';
import { TimePicker } from './time-picker';

@Component({
  imports: [TimePicker, ReactiveFormsModule],
  template: `<app-time-picker [formControl]="time" [dentist]="dentist" [selectedDate]="date" [required]="true" />`,
})
class TimePickerHost {
  time = new FormControl('', { nonNullable: true, validators: Validators.required });
  date = new Date(2030, 0, 8);
  dentist: User = {
    _id: 'dentist-1', firstName: 'Test', middleName: '', lastName: 'Dentist',
    emailAddress: '', mobileNumber: '', address: '', role: 'dentist', appointments: [],
    operatingHours: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      .map(day => ({ day, startTime: '08:00', endTime: '18:00' })),
  };
}

describe('TimePicker booking selections', () => {
  let fixture: ComponentFixture<TimePickerHost>;
  let picker: TimePicker;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimePickerHost] }).compileComponents();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2030, 0, 7, 12));
    fixture = TestBed.createComponent(TimePickerHost);
  });

  afterEach(() => {
    fixture.destroy();
    jasmine.clock().uninstall();
  });

  function render() {
    fixture.detectChanges();
    picker = fixture.debugElement.query(By.directive(TimePicker)).componentInstance;
  }

  function addBooking() {
    const dentist = fixture.componentInstance.dentist;
    const clinic: Clinic = {
      name: 'Clinic', address: 'Manila', mobileNumber: '', emailAddress: '',
      operatingHours: [], dentists: [],
    };
    const booking: Appointment = {
      _id: 'existing-booking', clinic, dentist, patient: { ...dentist, role: 'user' },
      date: new Date(2030, 0, 8), startTime: '09:00', endTime: '10:00',
      services: [], status: AppointmentStatus.CONFIRMED,
      notes: { patientNotes: '', clinicNotes: '' }, history: [],
    };
    dentist.appointments = [booking];
  }

  it('keeps existing bookings unavailable when the picker initializes', () => {
    addBooking();
    render();
    expect(picker.timeSlots.find(slot => slot.value === '09:00')?.available).toBeFalse();
    expect(fixture.componentInstance.dentist.appointments.map(appointment => appointment._id))
      .toEqual(['existing-booking']);
  });

  it('allows a future morning slot even when it is already afternoon today', () => {
    addBooking();
    render();
    expect(picker.timeSlots.find(slot => slot.value === '08:00')?.available).toBeTrue();
  });

  it('disables elapsed slots today even when there are no appointments', () => {
    fixture.componentInstance.date = new Date(2030, 0, 7);
    render();
    expect(picker.timeSlots.find(slot => slot.value === '09:00')?.available).toBeFalse();
    expect(picker.timeSlots.find(slot => slot.value === '13:00')?.available).toBeTrue();
  });

  it('clears required validation after a valid time is selected', () => {
    render();
    const control = fixture.componentInstance.time;
    control.markAsTouched();
    expect(control.hasError('required')).toBeTrue();
    picker.onTimeChange({ value: '13:00' });
    fixture.detectChanges();
    expect(control.valid).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('1:00 PM');
    expect(fixture.nativeElement.querySelector('.mat-form-field-invalid')).toBeNull();
  });
});
