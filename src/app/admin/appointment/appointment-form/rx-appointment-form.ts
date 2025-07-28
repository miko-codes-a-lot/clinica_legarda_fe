import { FormControl } from "@angular/forms";

export interface RxAppointmentForm {
  patient: FormControl<string>
  dentist: FormControl<string>
  services: FormControl<string[]>
  date: FormControl<string>
}