import { FormControl } from "@angular/forms";

export interface RxLogin {
  username: FormControl<string>
  password: FormControl<string>
}