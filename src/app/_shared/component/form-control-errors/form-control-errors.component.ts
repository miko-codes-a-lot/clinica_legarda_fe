import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-control-errors',
  standalone: true,
  template: `
    @if (control?.touched && control?.invalid) {
      <div class="error">
        @if (control?.errors?.['required']) {
          <div>This field is required.</div>
        }
        @if (control?.errors?.['pattern']) {
          <div>Invalid format.</div>
        }
        @if (control?.errors?.['email']) {
          <div>Enter a valid email address.</div>
        }
        @if (customMessage) {
          <div>{{ customMessage }}</div>
        }
      </div>
    }
  `,
  styleUrls: ['./form-control-errors.component.css']
})
export class FormControlErrorsComponent {
  @Input() control!: AbstractControl | null;
  @Input() customMessage: string = '';
}
