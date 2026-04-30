import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Referral } from '../../../_shared/model/referral';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ReferralService } from '../../../_shared/service/referral-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { AuthService } from '../../../_shared/service/auth-service';
import { AlertService } from '../../../_shared/service/alert.service';

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
  appointments: Appointment[] = []
  dataSource = new MatTableDataSource<Referral>();
  displayedColumns: string[] = [ 'referTo', 'toBranch', 'appointment.patient', 'reason', 'appointment.notes', 'date', 'startTime', 'status', 'updatedAt', 'actions'];
  columnDefs = [

    {
      key: 'referTo',
      label: 'Refer to',
      cell: (row: any) => `${row.appointment?.dentist.firstName ?? ''} ${row.fromDoctorId?.lastName ?? ''}`
    },
    {
      key: 'toBranch',
      label: 'Transfer Branch',
      cell: (row: any) => row.appointment?.clinic.name ?? ''
    },
    {
      key: 'appointment.patient',
      label: 'Patient',
      cell: (row: any) => `${row.appointment?.patient?.firstName ?? ''} ${row.appointment?.patient?.lastName ?? ''}`
    },
    {
      key: 'reason',
      label: 'Reason',
      cell: (row: any) => row.reason ?? ''
    },
    {
      key: 'appointment.notes',
      label: 'Note for Dentist',
      cell: (row: any) => row.appointment?.notes.patientNotes ?? ''
    },
    // {
    //   key: 'appointmentStatus',
    //   label: 'Appointment Status',
    //   cell: (row: any) => row.appointment?.status ?? 'No Appointment'
    // },
    {
      key: 'date',
      label: 'Appointment Date',
      cell: (row: any) => row.appointment?.date ? new Date(row.appointment.date).toLocaleDateString() : ''
    },
    {
      key: 'startTime',
      label: 'Appointment Time',
      cell: (row: any) => row.appointment ? `${row.appointment.startTime} - ${row.appointment.endTime}` : ''
    },
    // {
    //   key: 'appointmentClinic',
    //   label: 'Appointment Clinic',
    //   cell: (row: any) => row.appointment?.clinic?.name ?? ''
    // },
    {
      key: 'dentist',
      label: 'Dentist',
      cell: (row: any) =>
        row.appointment?.dentist
          ? `${row.appointment.dentist.firstName} ${row.appointment.dentist.lastName}`
          : ''
    },
    {
      key: 'status',
      label: 'Status',
      cell: (row: any) => row.status ?? ''
    },
    {
      key: 'updatedAt',
      label: 'Status Updated',
      cell: (row: any) => new Date(row.updatedAt).toLocaleDateString() ?? ''
    },
  ];

  constructor(
    private readonly referralService: ReferralService,
    private readonly appointmentService: AppointmentService,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.referralService.getAllByDentist(user._id).subscribe({
            next: (data: Referral[]) => {
              this.dataSource.data = data;
              this.getAppointmentByReferral(data)
              this.isLoading = false
            },
            error: (err) => console.error(err)
          });
        }
      }
    })

  }

  getAppointmentByReferral(referralData: Referral[]) {
    const referralIds = referralData.map(r => r._id);

    this.appointmentService.getAll().subscribe({
      next: (appointments) => {
        // Filter appointments that match any referral ID
        const matchedAppointments = appointments.filter(app => referralIds.includes(app.referral?._id));

        // Merge each referral with its appointment temporarily for the table
        const tableData = referralData.map(referral => {
          const appointment = matchedAppointments.find(app => app.referral?._id === referral._id);
          return {
            ...referral,
            appointment // temporarily add appointment for display
          };
        });

        this.dataSource.data = tableData as any;
        console.log('Merged table data', tableData);
      },
      error: (e) => this.alertService.error(e.error.message),
      complete: () => this.isLoading = false
    });
  }

  onDetails(id: string) {
    console.log('id', id);
    this.router.navigate([`${this.moduleUrl}/details`, id])
  }
}
