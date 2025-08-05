import { FormControl } from "@angular/forms"

export interface RxOperatingHour {
  day: FormControl<string>
  startTime: FormControl<string>
  endTime: FormControl<string>
}