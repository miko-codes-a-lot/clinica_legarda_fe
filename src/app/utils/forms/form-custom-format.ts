import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

export function applyPHMobilePrefix(control: AbstractControl): Subscription {
  return control.valueChanges.subscribe(value => {
    if (value && !value.startsWith('+63')) {
      const sanitized = value.replace(/^0+/, '').replace(/[^0-9]/g, '');
      control.setValue(`+63${sanitized}`, { emitEvent: false });
    }
  });
}