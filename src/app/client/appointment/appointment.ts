import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ import this
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { DatePicker } from '../../_shared/component/date-picker/date-picker';
import { TimePicker } from '../../_shared/component/time-picker/time-picker';
import { AppointmentPayload } from '../../admin/appointment/appointment-payload';
import { User } from '../../_shared/model/user';
import { DentalService } from '../../_shared/model/dental-service';
import { Clinic } from '../../_shared/model/clinic';
import { MockService } from '../../_shared/service/mock-service';
import { applyPHMobilePrefix } from '../../utils/forms/form-custom-format';



@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    DatePicker,
    TimePicker
  ],
  templateUrl: './appointment.html',
  styleUrls: ['./appointment.css']
})
export class Appointment {
  @Output() onSubmitEvent = new EventEmitter<AppointmentPayload>()
  isLoading = false;
  form: FormGroup;
  dentists: User[] = []
  selectedDentist?: User
  @Input() clinics: Clinic[] = []
  @Input() dentalServices: DentalService[] = []
  appointment = {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    service: '',
    dentist: '',
    date: '',
    time: ''
  };

  constructor(private fb: FormBuilder, private mockService: MockService) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\+639\d{9}$/)]],
      service: ['', Validators.required],
      dentist: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
    });
  }

  onDentistChange (dentistId: String) {
    // should be all the data of selected dentist
    this.selectedDentist = this.dentists.find(d => d._id === dentistId);
  }

  ngOnInit() {
    const clinic = this.mockService.mockClinic();
    const dentalServices = this.mockService.mockDentalService();
    // there is no data in here
    this.dentalServices.push(dentalServices)
    this.dentists = clinic.dentists; // now has the mocked dentist

    const mobileNumber = this.form.get('mobileNumber');
    if (mobileNumber) {
      applyPHMobilePrefix(mobileNumber)
    }

  }
  onSubmit() {
    if (this.isLoading) return;
    this.isLoading = true;

    setTimeout(() => {
      alert(
        `✅ Appointment Requested!\n\n` +
        `Thank you Appointment requested`
      );
      this.isLoading = false;

      // Reset form
      this.appointment = {
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        service: '',
        dentist: '',
        date: '',
        time: ''
      };
      this.form.reset();
    }, 1000);
  }
}
