import { Component, EventEmitter, Input, OnInit, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RxUserForm } from '../../admin/user/user-form/rx-user-form.interface';
import { User } from '../../_shared/model/user';
import { applyPHMobilePrefix } from '../../utils/forms/form-custom-format';
import { RxOperatingHour } from '../../_shared/model/reactive/rx-operating-hours';
import { Day } from '../../_shared/model/day';
import { passwordMatchValidator } from '../../utils/forms/form-custom-validator';
import { Clinic } from '../../_shared/model/clinic';
import { UserPayload } from '../../admin/user/user-form/user-payload';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field'; // to remove
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormComponent } from '../../_shared/component/form/form.component';
import { ClinicService } from '../../_shared/service/clinic-service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatButtonModule, FormComponent],
  templateUrl: './registration.html',
  styleUrls: ['./registration.css']
})
export class RegistrationPage implements OnInit, OnChanges {
  @Output() onSubmitEvent = new EventEmitter<UserPayload>()
  @Input() isLoading = false
  @Input() clinics: Clinic[] = []
  @Input() user: User = this.getDefaultUser()

  rxform!: FormGroup<RxUserForm>
  fields: any[] = []; // <-- declare here
  userFields: any[] = []; // <-- declare here

  @Input() days: Day[] = []

  constructor(
    private readonly fb: FormBuilder,
    private readonly clinicService: ClinicService,
  ) {}

  // Global Variable
  selectedClinic: Clinic | undefined;
  indexToPush = 0;
  hide = signal(true);

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  getDefaultUser(): User {
    return {
      username: '',
      firstName: '',
      middleName: '',
      lastName: '',
      emailAddress: '',
      mobileNumber: '',
      address: '',
      password: '',
      clinic: {
        name: '',
        address: '',
        mobileNumber: '',
        emailAddress: '',
        operatingHours: [],
        dentists: [],
      },
      role: 'user',
      appointments: [],
      operatingHours: [],
    }
  }

  ngOnInit(): void {
    // fetch clinic here

    this.rxform = this.fb.nonNullable.group({
      firstName: [this.user.firstName, Validators.required],
      middleName: [this.user.middleName],
      lastName: [this.user.lastName, Validators.required],
      emailAddress: [this.user.emailAddress, [Validators.required, Validators.email]],
      mobileNumber: [this.user.mobileNumber, [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      username: [this.user.username ?? '', Validators.required],
      address: [this.user.address, Validators.required],
      password: [this.user.password ?? '', Validators.required],
      passwordConfirm: [''],
      clinic: [this.user.clinic?._id],
      role: [this.user.role, Validators.required],
      operatingHours: this.fb.array<FormGroup<RxOperatingHour>>(
        this.user.operatingHours.map(
          (o) => this.fb.nonNullable.group(
            {
              day: [o.day, Validators.required],
              startTime: [o.startTime, Validators.required],
              endTime: [o.endTime, Validators.required]
            }
          )
        )
      ),
    }, {
      validators: passwordMatchValidator('password', 'passwordConfirm')
    })
    // change the format to E.164    
    const mobileNumber = this.rxform.get('mobileNumber');
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }

    // remove here the password and confirm password
    if (this.user?._id && this.rxform.contains('password')) {
      (this.rxform as any).removeControl('password');
      (this.rxform as any).removeControl('passwordConfirm');
    }

    this.buildUserFields();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clinics']) {
      this.buildUserFields();
    }
  }

  private buildUserFields() {
    this.userFields = [
      { name: 'firstName', label: 'First Name', type: 'text'},
      { name: 'middleName', label: 'Middle Name', type: 'text' },
      { name: 'lastName', label: 'Last Name', type: 'text' },
      { name: 'emailAddress', label: 'Email Address', type: 'email' },
      { name: 'mobileNumber', label: 'Mobile Number', type: 'text', customError: 'Use +639 format and must be a valid Number' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'username', label: 'Username', type: 'text' },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'passwordConfirm', label: 'Confirm Password', type: 'password', customError: 'Passwords must match.' },
    ];

        // remove password validation and input on Update
    if (this.user?._id) {
      this.userFields = this.userFields.filter(
        f => f.name !== 'password' && f.name !== 'passwordConfirm'
      );
    }
  }

  onSubmit() {
    const userData = {
      firstName: this.firstName.value,
      middleName: this.middleName.value,
      lastName: this.lastName.value,
      emailAddress: this.emailAddress.value,
      mobileNumber: this.mobileNumber.value,
      address: this.address.value,
      username: this.username?.value,
      password: this.password?.value,
      operatingHours: [],
      role: 'user',
    }


    if(!this.password?.value){
      delete (userData as any).password; // This removes the password field from the object on update
    }

    const user: UserPayload = userData;

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

  get username() {
    return this.rxform.controls.username
  }

  get password() {
    return this.rxform.controls.password
  }

  get role() {
    return this.rxform.controls.role
  }

}
