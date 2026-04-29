import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { NotesDialogComponent } from '../../../_shared/component/dialog/notes-dialog/notes-dialog.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { NgIf } from '@angular/common'; // if using standalone imports
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { MatTableDataSource } from '@angular/material/table';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
selector: 'app-appointment-details',
  imports: [ListComponent, MatListModule, MatButtonModule, MatIconModule, CommonModule, MatExpansionModule, NgIf, GenericTableComponent],
  templateUrl: './appointment-details.html',
  styleUrl: './appointment-details.css'
})
export class AppointmentDetails {
  isLoading = false
  id!: string
  appointment?: Appointment
  appointmentHistory?: Appointment[] = [];
  displayAppointment: Record<string, any> = {};
  dataSource = new MatTableDataSource<Appointment>();

  displayedColumns: string[] = ['clinic', 'services', 'patient', 'dentist', 'date', 'time', 'status', 'notes.clinicNotes', 'notes.patientNotes'];
  columnDefs = [
    { key: 'clinic', label: 'Clinic', cell: (appointmentHistory: Appointment) => appointmentHistory.clinic.name},
    { key: 'services', label: 'Services',   cell: (appointmentHistory: Appointment) => appointmentHistory.services.map(service =>     service.name).join(', ')
    },
    { key: 'patient', label: 'Patient', cell: (appointmentHistory: Appointment) =>  `${appointmentHistory.patient.firstName} ${appointmentHistory.patient.lastName}` },
    { key: 'dentist', label: 'Dentist', cell: (appointmentHistory: Appointment) =>  `${appointmentHistory.dentist.firstName} ${appointmentHistory.dentist.lastName}` },
    { key: 'date', label: 'Date', cell: (appointmentHistory: Appointment) => appointmentHistory.date },
    { key: 'time', label: 'Time', cell: (appointmentHistory: Appointment) =>  `${appointmentHistory.startTime} - ${appointmentHistory.endTime}` },
    { key: 'status', label: 'Status', cell: (appointmentHistory: Appointment) => appointmentHistory.status },
    { key: 'notes.clinicNotes', label: 'Clinic Notes', cell: (appointmentHistory: Appointment) => appointmentHistory.notes.clinicNotes },
    { key: 'notes.patientNotes', label: 'Patient Notes', cell: (appointmentHistory: Appointment) => appointmentHistory.notes.patientNotes },
  ];

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.loadAppointment()
  }

  loadAppointment() {
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
          // referral: a.referral
        }
        this.appointment = a
        this.appointmentService.getAll().subscribe({
          next: (appointments) => {
            const now = new Date();
            this.appointmentHistory = appointments
            .filter(
              (apt) => apt.patient._id === a.patient._id
              // && apt.status === 'confirmed'
              && apt.status === 'confirmed'
              && new Date(apt.date) < now
            ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            console.log('this.appointmentHistory', this.appointmentHistory);
            this.dataSource.data = this.appointmentHistory;
            console.log('this.dataSource.data', this.dataSource.data);
        },
        error: (e) => this.alertService.error(e.error.message),
        complete: () => this.isLoading = false
      });
        // get the appointment history here
    },
      error: (e) => this.alertService.error(e.error.message)
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
        console.log('this.appointment', this.appointment);
        this.alertService.error('Appointment approved successfully!');
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        this.alertService.error(err.error.message);
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
        this.alertService.error('Appointment rejected successfully!');
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        this.alertService.error('Failed to reject appointment.');
      }
    });
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
                this.alertService.error('Clinic notes updated successfully!');
                this.isLoading = false;
              },
              error: (err) => {
                console.error(err);
                this.alertService.error('Failed to update clinic notes');
                this.isLoading = false;
              }
          });
        }
      }
    });
  }

  isActionDisabled() {
    return this.appointment && ['confirmed', 'rejected', 'cancelled'].includes(this.appointment.status);
  }

  isClinicNotesDisabled() {
    return this.appointment && ['rejected', 'cancelled'].includes(this.appointment.status);
  }

  cancelAppointment() {
    // logic to cancel the appointment
    if(this.appointment?._id) {
        this.appointmentService.cancelAppointment(this.appointment._id).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.error('Appointment cancelled successfully!');
          this.loadAppointment();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.alertService.error('Failed to cancel appointment.');
        }
      });
    }

  }

}
