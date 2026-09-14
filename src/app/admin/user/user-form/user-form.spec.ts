import { SimpleChange } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Clinic } from '../../../_shared/model/clinic';
import { User } from '../../../_shared/model/user';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { UserForm } from './user-form';

const days = [
  { code: 'monday', label: 'Monday' },
  { code: 'tuesday', label: 'Tuesday' },
];

function clinic(id: string, day: string): Clinic {
  return {
    _id: id,
    name: id,
    address: '',
    mobileNumber: '',
    emailAddress: '',
    dentists: [],
    operatingHours: [{ day, startTime: '09:00', endTime: '17:00' }],
  };
}

function dentist(assignments: string[], operatingHours: User['operatingHours'] = []): User {
  return {
    _id: 'dentist',
    firstName: 'Jamie',
    middleName: '',
    lastName: 'Reyes',
    emailAddress: 'jamie@example.test',
    mobileNumber: '+639171234567',
    address: 'Manila',
    username: 'jamie.reyes',
    clinics: assignments,
    operatingHours,
    appointments: [],
    role: 'dentist',
  };
}

function createForm(user: User, clinics: Clinic[] = []): UserForm {
  const component = new UserForm(new FormBuilder(), {} as ClinicService);
  component.user = user;
  component.days = days;
  component.clinics = clinics;
  component.ngOnInit();
  return component;
}

describe('staff user schedule form', () => {
  it('adds every weekday independently of the selected clinics opening days', () => {
    const component = createForm(
      dentist(['clinic-a', 'clinic-b']),
      [clinic('clinic-a', 'monday'), clinic('clinic-b', 'tuesday')],
    );

    component.onAddSchedule();
    component.onAddSchedule();

    expect(component.operatingHours.getRawValue()).toEqual([
      { day: 'monday', startTime: '', endTime: '' },
      { day: 'tuesday', startTime: '', endTime: '' },
    ]);
  });

  it('keeps existing hours editable when an assigned clinic no longer resolves', () => {
    const existingHours = [{ day: 'monday', startTime: '08:00', endTime: '16:00' }];
    const component = createForm(dentist(['removed-clinic'], existingHours));

    component.ngOnChanges({ clinics: new SimpleChange([], [], false) });
    component.onAddSchedule();

    expect(component.operatingHours.getRawValue()).toEqual([
      ...existingHours,
      { day: 'tuesday', startTime: '', endTime: '' },
    ]);
  });

  it('does not emit a payload while the form is invalid', () => {
    const component = createForm(dentist([]));
    let submissions = 0;
    component.onSubmitEvent.subscribe(() => submissions += 1);

    component.onSubmit();

    expect(submissions).toBe(0);
  });

  it('ignores dentist schedule validation for other roles and restores it when switched back', () => {
    const component = createForm(
      dentist(['clinic-a']),
      [clinic('clinic-a', 'monday')],
    );
    component.onAddSchedule();
    expect(component.rxform.invalid).toBeTrue();

    component.role.setValue('admin');

    expect(component.operatingHours.disabled).toBeTrue();
    expect(component.rxform.valid).toBeTrue();

    component.role.setValue('dentist');

    expect(component.operatingHours.enabled).toBeTrue();
    expect(component.operatingHours.getRawValue()).toEqual([
      { day: 'monday', startTime: '', endTime: '' },
    ]);
    expect(component.rxform.invalid).toBeTrue();
  });
});
