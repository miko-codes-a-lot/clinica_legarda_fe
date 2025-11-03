import { Component } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { NotesDialogComponent } from '../../../_shared/component/dialog/notes-dialog/notes-dialog.component';

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
    private readonly dialog: MatDialog
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

  openNotesDialog() {
    if (!this.appointment) return;

    const dialogRef = this.dialog.open(NotesDialogComponent, {
      data: { clinicNotes: this.appointment.notes.clinicNotes }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.isLoading = true;
        if(this.appointment?._id) {
          this.appointmentService.updateDentistNotes(this.appointment._id, result)
            .subscribe({
              next: (updatedAppointment) => {
                this.appointment = updatedAppointment;
                alert('Clinic notes updated successfully!');
                this.isLoading = false;
              },
              error: (err) => {
                console.error(err);
                alert('Failed to update clinic notes');
                this.isLoading = false;
              }
          });
        }
      }
    });
  }
}
