import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../_shared/model/appointment';
import { User } from '../../../_shared/model/user';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { UserService } from '../../../_shared/service/user-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { NotesDialogComponent } from '../../../_shared/component/dialog/notes-dialog/notes-dialog.component';
import { Referral } from '../../../_shared/model/referral';
import { ReferralService } from '../../../_shared/service/referral-service';
import { ConfirmDialogComponent } from '../../../_shared/component/dialog/confirm-dialog/confirm-dialog.component';
import { FormDialogComponent } from '../../../_shared/component/dialog/form-dialog/form-dialog.component';
import { Reason } from '../../../_shared/model/reason';
import { ReasonService } from '../../../_shared/service/reason-service';
import { AlertService } from '../../../_shared/service/alert.service';

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
  reasons: Reason[] = [];
  patient!: User

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly referralService: ReferralService,
    private readonly reasonService: ReasonService,
    private readonly userService: UserService,
    private readonly alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.reasonService.getAll().subscribe(r => this.reasons = r);
    this.loadAppointment()
  }

  loadAppointment() {
   this.isLoading = true

    this.id = this.route.snapshot.params['id']
    this.referralService.getOne(this.id).subscribe({
      next: (a) => {
        const { appointment, reason, reasonOfDecline, status } = a;
        const _id =
          typeof appointment.patient === 'string'
            ? appointment.patient
            : appointment.patient._id;
        this.userService.getOne(_id as string).subscribe((patient) => {
          this.displayReferral = {
          'Referred To': appointment?.dentist
            ? `${appointment.dentist.firstName} ${appointment.dentist.lastName}`
            : 'N/A',
          'Patient': `${patient.firstName} ${patient.lastName}`,
          'Transfer Branch': appointment?.clinic?.name || 'N/A',
          'Status': status,
          ...(reasonOfDecline && {
            'Reason for Rejection': this.getReasonLabel(reasonOfDecline)
          }),
          'Reason for Referral': this.getReasonLabel(reason) || 'N/A',
          'Notes for Dentist': appointment.notes.patientNotes,
          'Appointment Date': appointment?.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
          'Start Time': appointment?.startTime || 'N/A',
          'End Time': appointment?.endTime || 'N/A',
          'Services': appointment?.services?.map(s => s.name).join(', ') || 'N/A',
        };
        });

  
        this.referral = a;
        this.appointment = appointment;

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

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          disableClose: true,
          width: '600px',
          data: {
            message: `By submitting this referral I am verifying that the patient has been properly educated on the sharing of their dental and medical records with another authorized dentist or an office, which are both part of the same clinic. Sharing will take place for the purpose of continuing care and coordinating treatment planning.

            The shared records may contain all or part of the following: Patient Identity, Medical and Dental History, Treatment Records/Notes, Diagnostic Imaging, Prescription Information.

            I confirm that any disclosures of these records will only contain the necessary information to provide proper treatment for the patient, and will be handled according to any data protection and patient privacy laws as well as the clinic’s own Data Security Policy.

            By checking this box I am certifying that the patient has granted consent for their records to be shared automatically as part of the referral process.`,
            showConsentCheckbox: true
          }
      });

      dialogRef.afterClosed().subscribe(confirm => {
        if(confirm){
          this.referralService.approveReferral(this.referral?._id || '').subscribe({
            next: (updatedReferral: Referral) => {
              // Update local object
              this.referral = updatedReferral;
              // this.displayAppointment['status'] = updatedAppointment.status;

              this.isLoading = false;
              this.alertService.error('Request approved successfully!');
              this.loadAppointment();
            },
            error: (err: any) => {
              console.error(err);
              this.isLoading = false;
              this.alertService.error(err.error.message);
            }
          });
        }
      })

  }

  declineReferral() {
    if (!this.referral?._id) return;

    this.isLoading = true;

    // const declineReasons = this.reasons
    // .filter(r => r.usage === 'decline')
    // .map(r => ({
    //   value: r.code,
    //   label: r.label
    // }));
    this.reasonService.getAll().subscribe((reasons) => {
      const selectReason = reasons.filter((r) => r.usage === 'both' || r.usage === 'decline') .map(r => ({
        value: r.code,
        label: r.label
      }));
     
      const dialogRef = this.dialog.open(FormDialogComponent, {
        width: '500px',
        data: {
          title: 'Decline Referral',
          fields: [
            {
              name: 'reason',
              label: 'Reason for decline',
              type: 'select',
              required: true,
              options: selectReason
            }
          ]
        }
      });

      dialogRef.afterClosed().subscribe(res => {
        if (res.result) {
          const reason = res.data.reason;
          this.referralService.rejectReferral(this.referral?._id || '', reason).subscribe({
            next: (updatedReferral: Referral) => {
              // Update local object
              this.referral = updatedReferral;
              // this.displayAppointment['status'] = updatedAppointment.status;
              this.isLoading = false;
              this.alertService.error('Request rejected successfully!');
              this.loadAppointment();
            },
            error: (err: any) => {
              console.error(err);
              this.isLoading = false;
              this.alertService.error('Failed to reject request.');
            }
          });
        }
      });
    })

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
          this.alertService.error('Request cancelled successfully!');
          this.loadAppointment();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.alertService.error('Request to cancel appointment.');
        }
      });
    }
  }

  private getReasonLabel(code?: string): string {
    if (!code) return 'N/A';

    const found = this.reasons.find(r => r.code === code);
    return found?.label ?? code;
  }

}
