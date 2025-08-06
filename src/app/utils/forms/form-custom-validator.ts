import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const timeRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startTime')?.value;
  const end = group.get('endTime')?.value;

  if (start && end && start >= end) {
    return { timeRangeInvalid: true };
  }

  return null;
};

export function withinClinicHoursValidator(clinicHours: { day: string; startTime: string; endTime: string }[]): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const day = group.get('day')?.value;
    const startTime = group.get('startTime')?.value;
    const endTime = group.get('endTime')?.value;

    const clinicDay = clinicHours.find(h => h.day === day);
    if (!clinicDay || !startTime || !endTime) return null;

    const toMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const clinicStart = toMinutes(clinicDay.startTime);
    const clinicEnd = toMinutes(clinicDay.endTime);
    const dentistStart = toMinutes(startTime);
    const dentistEnd = toMinutes(endTime);

    if (dentistStart < clinicStart || dentistEnd > clinicEnd) {
      return { outsideClinicHours: true };
    }

    return null;
  };
}


export class MyValidators {
  static timeRange(validate: () => ValidationErrors | null) {
    return (group: AbstractControl): ValidationErrors | null => {
      return validate()
    }
  }

  static passwordMatchValidator(passwordKey: string, confirmPasswordKey: string) : ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get(passwordKey)?.value;
      const confirmPassword = group.get(confirmPasswordKey)?.value;

      if (password !== confirmPassword) {
        group.get(confirmPasswordKey)?.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        // Clear error if matches
        const errors = group.get(confirmPasswordKey)?.errors;
        if (errors) {
          delete errors['passwordMismatch'];
          if (Object.keys(errors).length === 0) {
            group.get(confirmPasswordKey)?.setErrors(null);
          }
        }
      }

      return null;
    };
  }
}