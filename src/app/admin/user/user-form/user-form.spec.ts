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

describe('admin clinic assignment form', () => {
  function adminForm(assignments: string[], canAssignAdminClinics: boolean): UserForm {
    const component = Object.assign(new UserForm(new FormBuilder(), {} as ClinicService), {
      user: { ...dentist(assignments), role: 'admin' },
      clinics: [clinic('clinic-a', 'monday'), clinic('clinic-b', 'tuesday')],
      canAssignAdminClinics,
    });
    component.ngOnInit();
    return component;
  }

  it('offers a clinic multiselect for a super admin editing an admin', () => {
    const component = adminForm(['clinic-a'], true);
    expect(component.userFields.find(field => field.name === 'clinics')).toEqual(
      jasmine.objectContaining({ multiple: true, options: [
        { value: 'clinic-a', label: 'clinic-a' },
        { value: 'clinic-b', label: 'clinic-b' },
      ] }),
    );
    expect(component.operatingHours.disabled).toBeTrue();
  });

  it('requires one or more clinics when a super admin assigns an admin', () => {
    const component = adminForm([], true);
    expect(component.rxform.invalid).toBeTrue();
    component.assignedClinics.setValue(['clinic-a', 'clinic-b']);
    expect(component.rxform.valid).toBeTrue();
  });

  it('submits all selected clinics and then the exact remaining assignment', () => {
    const component = adminForm(['clinic-a'], true);
    const submitted: string[][] = [];
    component.onSubmitEvent.subscribe(user => submitted.push(user.clinics ?? []));
    component.assignedClinics.setValue(['clinic-a', 'clinic-b']);
    component.onSubmit();
    component.assignedClinics.setValue(['clinic-b']);
    component.onSubmit();
    expect(submitted).toEqual([['clinic-a', 'clinic-b'], ['clinic-b']]);
  });

  it('hides admin assignment controls from an ordinary admin and preserves saved memberships', () => {
    const component = adminForm(['clinic-a', 'clinic-b'], false);
    expect(component.userFields.find(field => field.name === 'clinics')).toBeUndefined();
    const submitted: string[][] = [];
    component.onSubmitEvent.subscribe(user => submitted.push(user.clinics ?? []));
    component.firstName.setValue('Updated');
    component.onSubmit();
    expect(submitted).toEqual([['clinic-a', 'clinic-b']]);
  });
});
