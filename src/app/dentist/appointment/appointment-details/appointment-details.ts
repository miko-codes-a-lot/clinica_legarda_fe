import { Component } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
selector: 'app-appointment-details',
  imports: [ListComponent, MatListModule, MatButtonModule, MatIconModule],
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
        this.displayAppointment = {
          status,
          date,
          time: startTime + ' - ' + endTime,
          clinic: clinicData.name,
          clinicAddress: clinicData.address,
          dentist: dentistData.firstName + ' ' + dentistData.lastName,
          patient: patientData.firstName + ' ' + patientData.lastName,
        }
        this.appointment = a
      },
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate(['/admin/appointment/update', this.id])
  }

  approveAppointment() {
    if (!this.appointment?._id) return;

    this.isLoading = true;

    this.appointmentService.approveAppointment(this.appointment._id).subscribe({
      next: (updatedAppointment: Appointment) => {
        // Update local object
        this.appointment = updatedAppointment;
        this.displayAppointment['status'] = updatedAppointment.status;

        this.isLoading = false;
        alert('Appointment approved successfully!');
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        alert('Failed to approve appointment.');
      }
    });
  }

  declineAppointment() {
    if (!this.appointment?._id) return;

    this.isLoading = true;

    this.appointmentService.rejectAppointment(this.appointment._id).subscribe({
      next: (updatedAppointment: Appointment) => {
        // Update local object
        this.appointment = updatedAppointment;
        this.displayAppointment['status'] = updatedAppointment.status;

        this.isLoading = false;
        alert('Appointment rejected successfully!');
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        alert('Failed to reject appointment.');
      }
    });
  }

}
