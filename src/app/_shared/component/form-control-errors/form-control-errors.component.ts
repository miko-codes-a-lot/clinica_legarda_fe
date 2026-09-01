import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-control-errors',
  standalone: true,
  template: `
    @if (control?.touched && control?.invalid) {
      @if (control?.errors?.['required']) {
        <span>This field is required.</span>
      }
      @if (control?.errors?.['pattern']) {
        <span>{{ customMessage || 'Invalid format.' }}</span>
      }
      @if (control?.errors?.['email']) {
        <span>Enter a valid email address.</span>
      }
      @if (customMessage && !control?.errors?.['required'] && !control?.errors?.['pattern'] && !control?.errors?.['email']) {
        <span>{{ customMessage }}</span>
      }
    }
  `,
  styleUrls: ['./form-control-errors.component.css']
})
export class FormControlErrorsComponent {
  @Input() control!: AbstractControl | null;
  @Input() customMessage?: string;

}
