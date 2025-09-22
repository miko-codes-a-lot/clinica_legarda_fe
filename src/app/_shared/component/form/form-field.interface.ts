import { ValidatorFn } from '@angular/forms';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'select';

export interface FormField {
  name: string;            // formControlName
  label: string;           // label to display
  type: FieldType;         // input type
  options?: { value: any; label: string }[]; // for select dropdown
  validators?: ValidatorFn[];
  customError?: string;    // optional custom error message
  selectionChange?: (event: any) => void;
  multiple: boolean;       // multiple select
  disabled?: boolean;
  readonly?: boolean;
}
