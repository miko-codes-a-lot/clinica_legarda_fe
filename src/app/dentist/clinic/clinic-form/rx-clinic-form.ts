import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { RxOperatingHour } from "../../../_shared/model/reactive/rx-operating-hours";

export interface RxClinicForm {
  name: FormControl<string>
  address: FormControl<string>
  mobileNumber: FormControl<string>
  emailAddress: FormControl<string>
  operatingHours: FormArray<FormGroup<RxOperatingHour>>
}