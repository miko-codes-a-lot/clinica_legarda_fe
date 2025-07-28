import { FormControl } from "@angular/forms";

export interface RxBranchForm {
  name: FormControl<string>
  address: FormControl<string>
  mobileNumber: FormControl<string>
  emailAddress: FormControl<string>
  clinic: FormControl<string>
}