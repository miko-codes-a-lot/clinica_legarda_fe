import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RxUserForm } from './rx-user-form.interface';
import { JsonPipe } from '@angular/common';
import { User } from '../../../_shared/model/user';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm implements OnInit {
  @Output() onSubmitEvent = new EventEmitter<User>()
  @Input() isLoading = false

  rxform!: FormGroup<RxUserForm>

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.rxform = this.fb.nonNullable.group({
      firstName: [''],
      middleName: [''],
      lastName: [''],
      emailAddress: [''],
      mobileNumber: [''],
      address: [''],
      password: [''],
      passwordConfirm: [''],
      roles: ['patient'],
    })
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
