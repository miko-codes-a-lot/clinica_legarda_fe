import { FormControl } from "@angular/forms";

export interface RxDentalServiceForm {
  name: FormControl<string>
  duration: FormControl<number>
}
