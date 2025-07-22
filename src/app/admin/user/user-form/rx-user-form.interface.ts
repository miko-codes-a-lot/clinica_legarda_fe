import { FormControl } from "@angular/forms";

export interface RxUserForm {
  firstName: FormControl<string>
  middleName: FormControl<string>
  lastName: FormControl<string>
  emailAddress: FormControl<string>
  mobileNumber: FormControl<string>
  address: FormControl<string>
  password: FormControl<string>
  passwordConfirm: FormControl<string>
  roles: FormControl<string>
}