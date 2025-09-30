import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DentalService } from '../../../_shared/model/dental-service';
import { RxDentalServiceForm } from './rx-dental-service-form';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// for table component
import { FormComponent } from '../../../_shared/component/form/form.component';

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
  dentalServiceFields: any[] = [];

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.rxform = this.fb.nonNullable.group({
      name: [this.dentalService.name, Validators.required],
      duration: [this.dentalService.duration, Validators.required]
    })

    this.buildDentalServiceFields();
  }

  private buildDentalServiceFields() {
    this.dentalServiceFields = [
      { name: 'name', label: 'Name', type: 'text'},
      { name: 'duration', label: 'duration', type: 'number'},
    ];
      // remove password validation and input on Update
  }

  onSubmit() {
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
