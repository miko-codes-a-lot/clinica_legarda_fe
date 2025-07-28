import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DentalService } from '../../../_shared/model/dental-service';
import { RxDentalServiceForm } from './rx-dental-service-form';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-dental-service-form',
  imports: [ReactiveFormsModule],
  templateUrl: './dental-service-form.html',
  styleUrl: './dental-service-form.css'
})
export class DentalServiceForm {
  @Output() onSubmitEvent = new EventEmitter<DentalService>()
  @Input() isLoading = false
  @Input() dentalService!: DentalService

  rxform!: FormGroup<RxDentalServiceForm>

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.rxform = this.fb.nonNullable.group({
      name: [this.dentalService.name, Validators.required],
    })
  }

  onSubmit() {
    const service: DentalService = {
      name: this.name.value,
    }

    this.onSubmitEvent.emit(service)
  }

  get name() {
    return this.rxform.controls.name
  }
}
