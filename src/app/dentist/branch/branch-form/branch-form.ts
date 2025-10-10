import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Branch } from '../../../_shared/model/branch';
import { RxBranchForm } from './rx-branch-form';
import { BranchPayload } from './branch-payload';
import { Clinic } from '../../../_shared/model/clinic';
import { FormControlErrorsComponent } from '../../../_shared/component/form-control-errors/form-control-errors.component';
import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';

@Component({
  selector: 'app-branch-form',
  imports: [ReactiveFormsModule, FormControlErrorsComponent],
  templateUrl: './branch-form.html',
  styleUrl: './branch-form.css'
})
export class BranchForm implements OnInit {
  @Output() onSubmitEvent = new EventEmitter<BranchPayload>()
  @Input() isLoading = false
  @Input() branch!: Branch
  @Input() clinics: Clinic[] = []

  rxform!: FormGroup<RxBranchForm>

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.rxform = this.fb.nonNullable.group({
      name: [this.branch.name, Validators.required],
      address: [this.branch.address, Validators.required],
      mobileNumber: [this.branch.mobileNumber, [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      emailAddress: [this.branch.emailAddress, [Validators.required, Validators.email]],
      clinic: [this.branch.clinic._id || '', Validators.required],
    })

    // change the format to E.164    
    const mobileNumber = this.rxform.get('mobileNumber');
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }
  }

  onSubmit() {
    const branch: BranchPayload = {
      name: this.name.value,
      address: this.address.value,
      emailAddress: this.emailAddress.value,
      mobileNumber: this.mobileNumber.value,
      clinic: this.clinic.value,
    }

    this.onSubmitEvent.emit(branch)
  }

  get name() {
    return this.rxform.controls.name
  }

  get address() {
    return this.rxform.controls.address
  }

  get emailAddress() {
    return this.rxform.controls.emailAddress
  }

  get mobileNumber() {
    return this.rxform.controls.mobileNumber
  }

  get clinic() {
    return this.rxform.controls.clinic
  }
}
