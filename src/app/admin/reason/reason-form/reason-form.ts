import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Reason, ReasonUsage } from '../../../_shared/model/reason';
import { RxReasonForm } from './rx-reason-form';
import { Day } from '../../../_shared/model/day';
// for table component
import { FormComponent } from '../../../_shared/component/form/form.component';
import { MatFormFieldModule } from '@angular/material/form-field'; 
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';


@Component({
  selector: 'app-reason-form',
  imports: [ReactiveFormsModule, FormComponent, MatFormFieldModule, MatSelectModule, MatInputModule],
  templateUrl: './reason-form.html',
  styleUrls: ['./reason-form.css']
})
export class ReasonForm implements OnInit {
  @Output() onSubmitEvent = new EventEmitter<Reason>()
  @Input() isLoading = false
  @Input() days: Day[] = []
  @Input() reason: Reason = this.getDefaultReason()

  rxform!: FormGroup<RxReasonForm>
  reasonFields: any[] = []; // <-- declare here

  constructor(private readonly fb: FormBuilder) {}

  getDefaultReason(): Reason {
    return {
      code: '',
      label: '',
      description: '',
      usage: ReasonUsage.BOTH,
      isActive: true,
    }
  }

  ngOnInit(): void {

  this.rxform = this.fb.nonNullable.group({
    code: [this.reason.code ?? '', Validators.required],
    label: [this.reason.label ?? '', Validators.required],
    description: [this.reason.description ?? ''], // optional
    usage: [this.reason.usage ?? ReasonUsage.BOTH, Validators.required],
    isActive: [this.reason.isActive ?? true]
  });

    this.buildReasonFields();
  }

  
  private buildReasonFields() {
    this.reasonFields = [
      { name: 'code', label: 'Code', type: 'text'},
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { 
        name: 'usage', 
        label: 'Usage', 
        type: 'select', 
        options: Object.values(ReasonUsage).map(value => ({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
        }))
      },
    ];

    this.isLoading =false;
  }

  onSubmit() {
    const reason: Reason = {
      code: this.code.value,
      label: this.label.value,
      description: this.description.value,
      usage: this.usage.value,
      isActive: this.isActive.value
    }
    this.onSubmitEvent.emit(reason)
  }

  get code() {
    return this.rxform.controls.code
  }

  get label() {
    return this.rxform.controls.label
  }

  get description() {
    return this.rxform.controls.description
  }

  get usage() {
    return this.rxform.controls.usage
  }

  get isActive() {
    return this.rxform.controls.isActive
  }
}
