import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { User } from '../../model/user';
import { DatePicker } from './date-picker';

@Component({
  imports: [DatePicker, ReactiveFormsModule],
  template: `<app-date-picker [formControl]="date" [dentist]="dentist" [minDate]="minDate" [maxDate]="maxDate" />`,
})
class DatePickerHost {
  minDate = new Date();
  maxDate = new Date(new Date().setDate(new Date().getDate() + 7));
  date = new FormControl<Date | null>(null, Validators.required);
  dentist: User = {
    firstName: 'Test', middleName: '', lastName: 'Dentist', emailAddress: '',
    mobileNumber: '', address: '', role: 'dentist', appointments: [],
    operatingHours: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      .map(day => ({ day, startTime: '00:00', endTime: '23:59' })),
  };
}

describe('DatePicker appointment day validation', () => {
  let fixture: ComponentFixture<DatePickerHost>;
  let picker: DatePicker;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatePickerHost] }).compileComponents();
    fixture = TestBed.createComponent(DatePickerHost);
    fixture.detectChanges();
    picker = fixture.debugElement.query(By.directive(DatePicker)).componentInstance;
  });

  it('accepts today when the picker minimum contains the current time', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    picker.onDateChange({ value: today });
    fixture.detectChanges();
    expect(fixture.componentInstance.date.errors).toBeNull();
  });

  it('clears required validation after a valid day is selected', () => {
    const date = fixture.componentInstance.date;
    date.markAsTouched();
    expect(date.hasError('required')).toBeTrue();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    picker.onDateChange({ value: tomorrow });
    fixture.detectChanges();
    expect(date.valid).toBeTrue();
    expect(fixture.nativeElement.querySelector('input').value).not.toBe('');
    expect(fixture.nativeElement.querySelector('.mat-form-field-invalid')).toBeNull();
  });

  it('continues rejecting days beyond the booking limit', () => {
    const unavailable = new Date();
    unavailable.setDate(unavailable.getDate() + 8);
    picker.onDateChange({ value: unavailable });
    expect(fixture.componentInstance.date.hasError('matDatepickerMax')).toBeTrue();
  });

  it('rejects a non-date form value without throwing during bounds validation', () => {
    expect(picker.validate(new FormControl('invalid date'))).toEqual({ matDatepickerParse: true });
  });
});
