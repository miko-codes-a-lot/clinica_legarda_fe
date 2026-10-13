import { Component, DestroyRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { Clinic } from '../../../_shared/model/clinic';
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

  private readonly destroyRef = inject(DestroyRef);
  clinics: Clinic[] = [];
  clinicsLoading = true;
  clinicsError = '';

  constructor(private readonly fb: FormBuilder, private readonly clinicService: ClinicService) {}

  ngOnInit(): void {
    this.rxform = this.fb.nonNullable.group({
      name: [this.dentalService.name, [Validators.required, Validators.minLength(3)]],
      duration: [this.dentalService.duration, [Validators.required, Validators.min(0)]],
      clinics: [this.dentalService.clinics ?? [], this.dentalService._id ? [] : [Validators.required]],
    })

    this.buildDentalServiceFields();
    this.clinicService.getAccessible().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: clinics => {
        this.clinics = clinics;
        if (this.dentalService.clinics === undefined) this.rxform.controls.clinics.setValue(clinics.map(clinic => clinic._id).filter((id): id is string => !!id));
        this.clinicsLoading = false;
        this.buildDentalServiceFields();
      },
      error: () => { this.clinicsLoading = false; this.clinicsError = 'Unable to load clinics. Reload this page to try again.'; },
    });
  }

  private buildDentalServiceFields() {
    this.dentalServiceFields = [
      { name: 'name', label: 'Name', type: 'text', readonly: this.dentalService.canEditDetails === false, customError: 'Enter at least 3 characters.' },
      { name: 'duration', label: 'Duration (minutes)', type: 'number', readonly: this.dentalService.canEditDetails === false, customError: 'Duration must be 0 or more minutes.' },
      { name: 'clinics', label: 'Available at clinics', type: 'select', multiple: true, options: this.clinics.map(clinic => ({ value: clinic._id ?? '', label: clinic.name })), customError: 'Select at least one clinic for a new service.' },
    ];
  }

  onSubmit() {
    if (this.isLoading || this.clinicsLoading || this.clinicsError || this.rxform.invalid) {
      this.rxform.markAllAsTouched();
      return;
    }

    const service: DentalService = {
      name: this.name.value,
      duration: this.duration.value,
      clinics: this.rxform.controls.clinics.value,
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
