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
import { Referral } from '../../../_shared/model/referral';
import { ReferralService } from '../../../_shared/service/referral-service';

@Component({
selector: 'app-referral-request-details',
  imports: [ListComponent, MatListModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './referral-request-details.html',
  styleUrl: './referral-request-details.css'
})
export class ReferralRequestDetails {
  isLoading = false
  id!: string
  appointment?: Appointment
  referral?: Referral
  displayReferral: Record<string, any> = {};

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly referralService: ReferralService,
  ) {}

  ngOnInit(): void {
    this.loadAppointment()
  }

  loadAppointment() {
   this.isLoading = true

    this.id = this.route.snapshot.params['id']
    // do the same here
    this.referralService.getOne(this.id).subscribe({
      next: (a) => {
        const { appointment, reason, status } = a;
       
        this.displayReferral = {
          'Referred To': appointment?.dentist
            ? `${appointment.dentist.firstName} ${appointment.dentist.lastName}`
            : 'N/A',
          'Transfer Branch': appointment?.clinic?.name || 'N/A',
          'Status': status,
          'Reason': reason || 'N/A',
          'Appointment Date': appointment?.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
          'Start Time': appointment?.startTime || 'N/A',
          'End Time': appointment?.endTime || 'N/A',
          'Services': appointment?.services?.map(s => s.name).join(', ') || 'N/A'
        };
        
        this.referral = a;
        this.appointment = appointment;

        // const { status, date, startTime, endTime, clinic: clinicData, dentist: dentistData, patient: patientData } = a
        // this.displayAppointment = {
        //   status,
        //   date,
        //   time: startTime + ' - ' + endTime,
        //   clinic: clinicData.name,
        //   clinicAddress: clinicData.address,
        //   dentist: dentistData.firstName + ' ' + dentistData.lastName,
        //   patient: patientData.firstName + ' ' + patientData.lastName,
        // }
        // this.appointment = a
      }
    }).add(() => this.isLoading = false)
    // to use later
  }

  onUpdate() {
    this.router.navigate(['/admin/appointment/update', this.id])
  }

  approveReferral() {
    if (!this.referral?._id) return;

    this.isLoading = true;

    this.referralService.approveReferral(this.referral._id).subscribe({
      next: (updatedReferral: Referral) => {
        // Update local object
        this.referral = updatedReferral;
        // this.displayAppointment['status'] = updatedAppointment.status;

        this.isLoading = false;
        alert('Request approved successfully!');
        this.loadAppointment();
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        alert(err.error.message);
      }
    });
  }

  declineReferral() {
    if (!this.referral?._id) return;

    this.isLoading = true;

    this.referralService.rejectReferral(this.referral._id).subscribe({
      next: (updatedReferral: Referral) => {
        // Update local object
        this.referral = updatedReferral;
        // this.displayAppointment['status'] = updatedAppointment.status;

        this.isLoading = false;
        alert('Request rejected successfully!');
        this.loadAppointment();
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        alert('Failed to reject request.');
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

  isActionDisabled() {
    return this.referral && ['confirmed', 'rejected', 'cancelled'].includes(this.referral.status);
  }

  isClinicNotesDisabled() {
    return this.referral && ['rejected', 'cancelled'].includes(this.referral.status);
  }

  cancelReferral() {
    // logic to cancel the appointment
    if(this.referral?._id) {
        this.referralService.cancelReferral(this.referral._id).subscribe({
        next: () => {
          this.isLoading = false;
          alert('Request cancelled successfully!');
          this.loadAppointment();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          alert('Request to cancel appointment.');
        }
      });
    }

  }

}
