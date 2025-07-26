import { FormArray, FormControl, FormGroup } from "@angular/forms";

export interface RxOperatingHour {
  day: FormControl<string>
  startTime: FormControl<string>
  endTime: FormControl<string>
}

export interface RxClinicForm {
  name: FormControl<string>
  address: FormControl<string>
  mobileNumber: FormControl<string>
  emailAddress: FormControl<string>
  operatingHours: FormArray<FormGroup<RxOperatingHour>>
}