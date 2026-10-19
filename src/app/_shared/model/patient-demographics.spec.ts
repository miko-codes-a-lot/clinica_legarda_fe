import { FormControl } from '@angular/forms';
import { patientAge, birthDateValidator } from './patient-demographics';

describe('patient demographics', () => {
  it('derives age on a calendar date including a leap-day birthday', () => {
    expect(patientAge('2000-02-29', '2026-02-28')).toBe(25);
    expect(patientAge('2000-02-29', '2026-03-01')).toBe(26);
    expect(patientAge('2000-02-29', '2028-02-29')).toBe(28);
    expect(patientAge(undefined, '2026-10-20')).toBeNull();
  });
  it('accepts absent dates and rejects invalid or future calendar dates', () => {
    const validate = birthDateValidator('2026-10-20');
    expect(validate(new FormControl(''))).toBeNull();
    expect(validate(new FormControl('2000-02-29'))).toBeNull();
    expect(validate(new FormControl('2025-02-29'))).toEqual({ birthDate: true });
    expect(validate(new FormControl('2026-10-21'))).toEqual({ birthDate: true });
  });
});
