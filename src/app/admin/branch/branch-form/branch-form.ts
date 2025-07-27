import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Branch } from '../../../_shared/model/branch';
import { RxBranchForm } from './rx-branch-form';
import { BranchPayload } from './branch-payload';
import { Clinic } from '../../../_shared/model/clinic';

@Component({
  selector: 'app-branch-form',
  imports: [ReactiveFormsModule],
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
      mobileNumber: [this.branch.mobileNumber, Validators.required],
      emailAddress: [this.branch.emailAddress, Validators.required],
      clinic: [this.branch.clinic._id || '', Validators.required],
    })
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
