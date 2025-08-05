import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class MyValidators {
  static timeRange(validate: () => ValidationErrors | null) {
    return (group: AbstractControl): ValidationErrors | null => {
      return validate()
    }
  }

  static timeRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const start = group.get('startTime')?.value;
      const end = group.get('endTime')?.value;

      if (start && end && start >= end) {
        return { timeRangeInvalid: true };
      }

      return null;
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