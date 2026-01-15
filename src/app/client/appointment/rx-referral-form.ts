import { FormControl } from "@angular/forms";

export interface RxReferralForm {
  fromDoctorId: FormControl<string>
  fromClinicId: FormControl<string>
  reason: FormControl<string>
  appointment: FormControl<string>
}