import { ValidatorFn, Validators } from '@angular/forms';

export const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Use at least 8 characters with an uppercase letter, a lowercase letter, a number, and a special character.';

export function strongPasswordValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.pattern(STRONG_PASSWORD_PATTERN),
  ];
}
