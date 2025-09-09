import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormField } from './form-field.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormControlErrorsComponent } from '../form-control-errors/form-control-errors.component';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormControlErrorsComponent
  ],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent {
  /** Parent must pass an already-built FormGroup */
  @Input({ required: true }) form!: FormGroup;
  @Input() fields: FormField[] = [];
  @Input() isLoading = false;

  @Output() onSubmitEvent = new EventEmitter<any>();

  onSubmit() {
    if (this.form.valid) {
      this.onSubmitEvent.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
