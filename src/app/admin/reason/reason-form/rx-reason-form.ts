import { FormControl } from "@angular/forms";
import { ReasonUsage } from '../../../_shared/model/reason';

export interface RxReasonForm {
  code: FormControl<string>
  label: FormControl<string>
  description: FormControl<string>
  usage: FormControl<ReasonUsage>
  isActive: FormControl<boolean>
}