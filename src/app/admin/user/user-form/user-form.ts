import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RxUserForm } from './rx-user-form.interface';
import { User } from '../../../_shared/model/user';
import { FormControlErrorsComponent } from '../../../_shared/component/form-control-errors/form-control-errors.component';
import { applyPHMobilePrefix } from '../../../utils/forms/form-custom-format';
import { passwordMatchValidator } from '../../../utils/forms/form-custom-validator';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, FormControlErrorsComponent],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm implements OnInit {
  @Output() onSubmitEvent = new EventEmitter<User>()
  @Input() isLoading = false
  @Input() user: User = this.getDefaultUser()

  rxform!: FormGroup<RxUserForm>

  constructor(private readonly fb: FormBuilder) {}

  getDefaultUser(): User {
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      emailAddress: '',
      mobileNumber: '',
      address: '',
      password: '',
      roles: 'patient',
    }
  }

  ngOnInit(): void {
    this.rxform = this.fb.nonNullable.group({
      firstName: [this.user.firstName, Validators.required],
      middleName: [this.user.middleName],
      lastName: [this.user.lastName, Validators.required],
      emailAddress: [this.user.emailAddress, [Validators.required, Validators.email]],
      mobileNumber: [this.user.mobileNumber, [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      address: [this.user.address, Validators.required],
      password: [''],
      passwordConfirm: [''],
      roles: [this.user.roles, Validators.required],
    }, {
      validators: passwordMatchValidator('password', 'passwordConfirm')
    })

    // change the format to E.164    
    const mobileNumber = this.rxform.get('mobileNumber');
    console.log('mobileNumber', mobileNumber);
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }
  }

  onSubmit() {
    const user: User = {
      firstName: this.firstName.value,
      middleName: this.middleName.value,
      lastName: this.lastName.value,
      emailAddress: this.emailAddress.value,
      mobileNumber: this.mobileNumber.value,
      address: this.address.value,
      password: this.password.value,
      roles: this.roles.value,
    }
    this.onSubmitEvent.emit(user)
  }

  get firstName() {
    return this.rxform.controls.firstName
  }

  get middleName() {
    return this.rxform.controls.middleName
  }

  get lastName() {
    return this.rxform.controls.lastName
  }

  get emailAddress() {
    return this.rxform.controls.emailAddress
  }

  get mobileNumber() {
    return this.rxform.controls.mobileNumber
  }

  get address() {
    return this.rxform.controls.address
  }

  get password() {
    return this.rxform.controls.password
  }

  get roles() {
    return this.rxform.controls.roles
  }
}
