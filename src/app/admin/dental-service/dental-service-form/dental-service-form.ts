import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DentalService } from '../../../_shared/model/dental-service';
import { RxDentalServiceForm } from './rx-dental-service-form';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// for table component
import { FormComponent } from '../../../_shared/component/form/form.component';
import { FormField } from '../../../_shared/component/form/form-field.interface';

@Component({
  selector: 'app-dental-service-form',
  imports: [ReactiveFormsModule, FormComponent],
  templateUrl: './dental-service-form.html',
  styleUrl: './dental-service-form.css'
})
export class DentalServiceForm {
  @Output() onSubmitEvent = new EventEmitter<DentalService>()
  @Input() isLoading = false
  @Input() dentalService!: DentalService

  rxform!: FormGroup<RxDentalServiceForm>
  dentalServiceFields: FormField[] = [];

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.rxform = this.fb.nonNullable.group({
      name: [this.dentalService.name, [Validators.required, Validators.minLength(3)]],
      duration: [this.dentalService.duration, [Validators.required, Validators.min(0)]]
    })

    this.buildDentalServiceFields();
  }

  private buildDentalServiceFields() {
    this.dentalServiceFields = [
      { name: 'name', label: 'Name', type: 'text', customError: 'Enter at least 3 characters.' },
      { name: 'duration', label: 'Duration (minutes)', type: 'number', customError: 'Duration must be 0 or more minutes.' },
    ];
  }

  onSubmit() {
    if (this.isLoading || this.rxform.invalid) {
      this.rxform.markAllAsTouched();
      return;
    }

    const service: DentalService = {
      name: this.name.value,
      duration: this.duration.value,
    }

    this.onSubmitEvent.emit(service)
  }

  get name() {
    return this.rxform.controls.name
  }

  get duration() {
    return this.rxform.controls.duration
  }
}
