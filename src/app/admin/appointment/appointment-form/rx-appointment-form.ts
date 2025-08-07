import { FormControl } from "@angular/forms";

export interface RxAppointmentForm {
  clinic: FormControl<string>
  patient: FormControl<string>
  dentist: FormControl<string>
  services: FormControl<string[]>
  date: FormControl<Date>
}