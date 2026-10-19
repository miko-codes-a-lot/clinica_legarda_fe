import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { FormField } from '../component/form/form-field.interface';

export interface PatientDemographics { birthDate?: string; sex?: string; occupation?: string; religion?: string; maritalStatus?: string; }
export const demographicKeys = ['birthDate', 'sex', 'occupation', 'religion', 'maritalStatus'] as const;
export function manilaDay(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
function validDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}
export function birthDateValidator(today?: string): ValidatorFn {
  return control => !control.value || (typeof control.value === 'string' && validDate(control.value) && control.value <= (today ?? manilaDay())) ? null : { birthDate: true };
}
export function patientAge(birthDate: string | undefined, on = manilaDay()): number | null {
  if (!birthDate || !validDate(birthDate) || !validDate(on) || birthDate > on) return null;
  return Number(on.slice(0,4)) - Number(birthDate.slice(0,4)) - (on.slice(5) < birthDate.slice(5) ? 1 : 0);
}
export const demographicFields: FormField[] = [
  { name: 'birthDate', label: 'Birth date (optional)', type: 'date', customError: 'Use a valid birth date on or before today.' },
  ...(['sex','occupation','religion','maritalStatus'] as const).map(name => ({ name, label: `${({sex:'Sex',occupation:'Occupation',religion:'Religion',maritalStatus:'Marital status'})[name]} (optional)`, type: 'text' as const, maxlength: 100, customError: 'Use at most 100 characters.' })),
];
export function demographicControls(value: PatientDemographics = {}) {
  const text = (key: keyof PatientDemographics) => new FormControl(value[key] ?? '', { nonNullable: true, validators: Validators.maxLength(100) });
  return { birthDate: new FormControl(value.birthDate ?? '', { nonNullable: true, validators: birthDateValidator() }),
    sex: text('sex'), occupation: text('occupation'), religion: text('religion'), maritalStatus: text('maritalStatus') };
}
export type DemographicControls = ReturnType<typeof demographicControls>;
export function demographicValues(value: PatientDemographics): PatientDemographics {
  return { birthDate: value.birthDate?.trim() ?? '', sex: value.sex?.trim() ?? '', occupation: value.occupation?.trim() ?? '', religion: value.religion?.trim() ?? '', maritalStatus: value.maritalStatus?.trim() ?? '' };
}
