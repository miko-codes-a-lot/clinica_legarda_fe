import { TableColumn, TableFilter, tableOptions } from '../../../_shared/component/table/table-model';
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Referral } from '../../../_shared/model/referral';
import { ReferralService } from '../../../_shared/service/referral-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { AuthService } from '../../../_shared/service/auth-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { appointmentDateKey, formatAppointmentDate } from '../../appointment/appointment-schedule';

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
  displayedColumns = ['patient', 'clinic', 'date', 'reason', 'status', 'updatedAt', 'actions'];
  readonly dateValue = (row: Referral): string => row.appointment?.date ? appointmentDateKey(row.appointment.date) : '';
  columnDefs: TableColumn<Referral>[] = [
    { key: 'patient', label: 'Patient', cell: row => `${row.appointment?.patient?.firstName || ''} ${row.appointment?.patient?.lastName || ''}` },
    { key: 'clinic', label: 'Transfer clinic / dentist', cell: row => row.appointment?.clinic?.name, secondary: row => `${row.appointment?.dentist?.firstName || ''} ${row.appointment?.dentist?.lastName || ''}` },
    { key: 'date', label: 'Appointment', cell: row => row.appointment?.date ? formatAppointmentDate(row.appointment.date) : '', secondary: row => row.appointment ? `${row.appointment.startTime}–${row.appointment.endTime}` : '', sortValue: this.dateValue },
    { key: 'reason', label: 'Reason / patient note', cell: row => row.reason, secondary: row => row.appointment?.notes?.patientNotes || '' },
    { key: 'status', label: 'Status', cell: row => row.status, kind: 'status' },
    { key: 'updatedAt', label: 'Updated', cell: row => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '', sortValue: row => row.updatedAt },
  ];
  filters: TableFilter<Referral>[] = [];

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
      this.filters = [
        { key: 'status', label: 'Status', options: ['pending', 'confirmed', 'rejected'].map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })), value: row => row.status },
        { key: 'clinic', label: 'Transfer clinic', options: tableOptions(referrals, row => row.appointment?.clinic?._id || '', row => row.appointment?.clinic?.name || ''), value: row => row.appointment?.clinic?._id || '' },
      ];
      this.isLoading = false;
    });
  }

  onDetails(id: string) {
    this.router.navigate([`${this.moduleUrl}details`, id])
  }
}
