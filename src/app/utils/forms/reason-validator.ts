import { AbstractControl, ValidationErrors } from '@angular/forms';
export function reasonTextValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' && value.trim().length >= 3 && value.trim().length <= 500 ? null : { reasonText: true };
}
