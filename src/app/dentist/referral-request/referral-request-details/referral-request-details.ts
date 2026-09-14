import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { catchError, finalize, forkJoin, Observable, of } from 'rxjs';
import { Referral, ReferralStatus } from '../../../_shared/model/referral';
import { ReferralService } from '../../../_shared/service/referral-service';
import { ConfirmDialogComponent } from '../../../_shared/component/dialog/confirm-dialog/confirm-dialog.component';
import { FormDialogComponent } from '../../../_shared/component/dialog/form-dialog/form-dialog.component';
import { Reason } from '../../../_shared/model/reason';
import { ReasonService } from '../../../_shared/service/reason-service';
import { AlertService } from '../../../_shared/service/alert.service';
import { AuthService } from '../../../_shared/service/auth-service';
import { formatAppointmentDate } from '../../appointment/appointment-schedule';

@Component({
  selector: 'app-referral-request-details',
  imports: [ListComponent, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './referral-request-details.html',
  styleUrl: './referral-request-details.css',
})
export class ReferralRequestDetails {
  isLoading = false;
  loadError = '';
  referral?: Referral;
  displayReferral: Record<string, string> = {};
  reasons: Reason[] = [];
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly referralService: ReferralService,
    private readonly reasonService: ReasonService,
    private readonly alertService: AlertService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit() { this.loadAppointment(); }

  loadAppointment() {
    this.isLoading = true;
    this.loadError = '';
    forkJoin({
      referral: this.referralService.getOne(this.route.snapshot.params['id']),
      reasons: this.reasonService.getAll().pipe(catchError(() => of([] as Reason[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isLoading = false)).subscribe({
      next: ({ referral, reasons }) => {
        this.referral = referral;
        this.reasons = reasons;
        const appointment = referral.appointment;
        this.displayReferral = {
          'Referred To': appointment?.dentist
            ? `${appointment.dentist.firstName} ${appointment.dentist.lastName}` : 'Awaiting appointment',
          'Patient': appointment?.patient
            ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Awaiting appointment',
          'Transfer Branch': appointment?.clinic?.name || 'Awaiting appointment',
          'Status': referral.status,
          ...(referral.reasonOfDecline && { 'Reason for Rejection': this.getReasonLabel(referral.reasonOfDecline) }),
          'Reason for Referral': this.getReasonLabel(referral.reason),
          'Notes for Dentist': appointment?.notes?.patientNotes || 'None',
          'Appointment Date': appointment?.date ? formatAppointmentDate(appointment.date) : 'Awaiting appointment',
          'Start Time': appointment?.startTime || 'N/A',
          'End Time': appointment?.endTime || 'N/A',
          'Services': appointment?.services?.map(service => service.name).join(', ') || 'N/A',
        };
      },
      error: () => { this.referral = undefined; this.loadError = 'Unable to load this referral.'; },
    });
  }

  approveReferral() {
    if (this.isActionDisabled()) return;
    this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      width: '600px',
      data: {
        message: `By submitting this referral I am verifying that the patient has been properly educated on the sharing of their dental and medical records with another authorized dentist or an office, which are both part of the same clinic. Sharing will take place for the purpose of continuing care and coordinating treatment planning.

            The shared records may contain all or part of the following: Patient Identity, Medical and Dental History, Treatment Records/Notes, Diagnostic Imaging, Prescription Information.

            I confirm that any disclosures of these records will only contain the necessary information to provide proper treatment for the patient, and will be handled according to any data protection and patient privacy laws as well as the clinic’s own Data Security Policy.

            By checking this box I am certifying that the patient has granted consent for their records to be shared automatically as part of the referral process.`,
        showConsentCheckbox: true,
      },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirm => {
      if (confirm && this.referral?._id) this.saveDecision(this.referralService.approveReferral(this.referral._id));
    });
  }

  declineReferral() {
    if (this.isActionDisabled()) return;
    this.dialog.open(FormDialogComponent, {
      width: '500px',
      data: {
        title: 'Decline Referral',
        fields: [{ name: 'reason', label: 'Reason for decline', type: 'select', required: true,
          options: this.reasons.filter(reason => reason.isActive && ['both', 'decline'].includes(reason.usage))
            .map(reason => ({ value: reason.code, label: reason.label })),
        }],
      },
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result?.result && this.referral?._id) {
        this.saveDecision(this.referralService.rejectReferral(this.referral._id, result.data.reason));
      }
    });
  }

  private saveDecision(request: Observable<Referral>) {
    this.isLoading = true;
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadAppointment(),
      error: error => {
        this.isLoading = false;
        this.alertService.error(error.error?.message || 'Unable to save the referral decision.');
      },
    });
  }

  isActionDisabled(): boolean {
    return this.isLoading || !this.referral?._id || this.referral.status !== ReferralStatus.PENDING ||
      this.referral.fromDoctorId?._id !== this.authService.currentUserValue?._id;
  }

  private getReasonLabel(code?: string): string {
    return code ? this.reasons.find(reason => reason.code === code)?.label || code : 'N/A';
  }
}
