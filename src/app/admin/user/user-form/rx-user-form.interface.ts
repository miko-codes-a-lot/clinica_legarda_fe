import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { RxOperatingHour } from "../../../_shared/model/reactive/rx-operating-hours";

export interface RxUserForm {
  firstName: FormControl<string>
  middleName: FormControl<string>
  lastName: FormControl<string>
  emailAddress: FormControl<string>
  mobileNumber: FormControl<string>
  address: FormControl<string>
  password: FormControl<string>
  passwordConfirm: FormControl<string>
  clinic: FormControl<string | undefined>
  branch: FormControl<string | undefined>
  operatingHours: FormArray<FormGroup<RxOperatingHour>>
  role: FormControl<string>
}