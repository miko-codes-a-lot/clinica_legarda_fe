import { Component } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
selector: 'app-appointment-details',
  imports: [ListComponent, MatListModule, MatButtonModule],
  templateUrl: './appointment-details.html',
  styleUrl: './appointment-details.css'
})
export class AppointmentDetails {
  isLoading = false
  id!: string
  appointment?: Appointment
  displayAppointment: Record<string, any> = {};

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.appointmentService.getOne(this.id).subscribe({
      next: (a) => {
        const { status, date, startTime, endTime, clinic: clinicData, dentist: dentistData, patient: patientData } = a
        const time = startTime + ' - ' + endTime
        const clinic = clinicData.name
        const clinicAddress = clinicData.address
        const dentist = dentistData.firstName + ' ' + dentistData.lastName
        const patient = patientData.firstName + ' ' + patientData.lastName
        // service is custom
        // Notes is custom
        this.displayAppointment = {
          status,
          date,
          time,
          clinic,
          clinicAddress,
          dentist,
          patient,
        }
        this.appointment = a
      },
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate(['/admin/appointment/update', this.id])
  }
}
