import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Referral } from '../../../_shared/model/referral';
import { ReferralService } from '../../../_shared/service/referral-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { AuthService } from '../../../_shared/service/auth-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { formatAppointmentDate } from '../../appointment/appointment-schedule';

@Component({
  selector: 'app-referral-request-list',
  imports: [GenericTableComponent],
  templateUrl: './referral-request-list.html',
  styleUrl: './referral-request-list.css'
})

export class ReferralRequestList implements OnInit {
  isLoading = false
  moduleUrl = '/dentist/referral-request/'
  title = 'Referral Request'
  createLabel = 'Create appointment'
  loadError = '';
  private readonly destroyRef = inject(DestroyRef);
  dataSource = new MatTableDataSource<Referral>();
  displayedColumns: string[] = [ 'referTo', 'toBranch', 'appointment.patient', 'reason', 'appointment.notes', 'date', 'startTime', 'status', 'updatedAt', 'actions'];
  columnDefs = [

    {
      key: 'referTo',
      label: 'Refer to',
      cell: (row: Referral) => `${row.appointment?.dentist?.firstName ?? ''} ${row.appointment?.dentist?.lastName ?? ''}`
    },
    {
      key: 'toBranch',
      label: 'Transfer Branch',
      cell: (row: Referral) => row.appointment?.clinic?.name ?? ''
    },
    {
      key: 'appointment.patient',
      label: 'Patient',
      cell: (row: Referral) => `${row.appointment?.patient?.firstName ?? ''} ${row.appointment?.patient?.lastName ?? ''}`
    },
    {
      key: 'reason',
      label: 'Reason',
      cell: (row: Referral) => row.reason ?? ''
    },
    {
      key: 'appointment.notes',
      label: 'Note for Dentist',
      cell: (row: Referral) => row.appointment?.notes?.patientNotes ?? ''
    },
    // {
    //   key: 'appointmentStatus',
    //   label: 'Appointment Status',
    //   cell: (row: Referral) => row.appointment?.status ?? 'No Appointment'
    // },
    {
      key: 'date',
      label: 'Appointment Date',
      cell: (row: Referral) => row.appointment?.date ? formatAppointmentDate(row.appointment.date) : ''
    },
    {
      key: 'startTime',
      label: 'Appointment Time',
      cell: (row: Referral) => row.appointment ? `${row.appointment.startTime} - ${row.appointment.endTime}` : ''
    },
    // {
    //   key: 'appointmentClinic',
    //   label: 'Appointment Clinic',
    //   cell: (row: Referral) => row.appointment?.clinic?.name ?? ''
    // },
    {
      key: 'dentist',
      label: 'Dentist',
      cell: (row: Referral) =>
        row.appointment?.dentist
          ? `${row.appointment.dentist.firstName} ${row.appointment.dentist.lastName}`
          : ''
    },
    {
      key: 'status',
      label: 'Status',
      cell: (row: Referral) => row.status ?? ''
    },
    {
      key: 'updatedAt',
      label: 'Status Updated',
      cell: (row: Referral) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : ''
    },
  ];

  constructor(
    private readonly referralService: ReferralService,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(
      switchMap(user => {
        this.isLoading = !!user;
        this.loadError = '';
        return user ? this.referralService.getAll().pipe(
          catchError(() => {
            this.loadError = 'Unable to load referrals.';
            return of([] as Referral[]);
          }),
        ) : of([] as Referral[]);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(referrals => {
      this.dataSource.data = referrals;
      this.isLoading = false;
    });
  }

  onDetails(id: string) {
    this.router.navigate([`${this.moduleUrl}details`, id])
  }
}
