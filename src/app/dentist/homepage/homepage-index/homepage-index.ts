import { Component, OnInit } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { Referral } from '../../../_shared/model/referral';

import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ReferralService } from '../../../_shared/service/referral-service';
import { AuthService } from '../../../_shared/service/auth-service';

import { UserSimple } from '../../../_shared/model/user-simple';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dentist-home',
  templateUrl: './homepage-index.html',
  styleUrl: './homepage-index.css',
  imports: [
    CommonModule
  ],
})
export class HomepageIndex implements OnInit {

  user: UserSimple | null = null;

  todayAppointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];

  referrals: Referral[] = [];

  isLoading = false;

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly referralService: ReferralService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe({
      next: (u) => {
        this.user = u;

        if (u?._id) {
          this.loadAppointments(u._id);
          this.loadReferrals(u._id);
        }
      }
    });
  }

  private loadAppointments(dentistId: string) {
    this.isLoading = true;

    this.appointmentService.getAll().subscribe({
      next: (appointments) => {

        const now = new Date();

        this.todayAppointments = appointments.filter(a => {
          const appointmentDate = new Date(a.date);

          return (
            a.dentist?._id === dentistId &&
            appointmentDate.toDateString() === now.toDateString()
          );
        });

        this.upcomingAppointments = appointments
          .filter(a => {
            const appointmentDate = new Date(a.date);

            return (
              a.dentist?._id === dentistId &&
              appointmentDate > now
            );
          })
          .sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          .slice(0, 5);

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadReferrals(dentistId: string) {

    this.referralService.getAll().subscribe({
      next: (referrals) => {

        // referrals CREATED by this dentist
        this.referrals = referrals.filter(r =>
          String(r.fromDoctorId) === dentistId
        );
      }
    });
  }

  get pendingReferralCount(): number {
    return this.referrals.filter(r =>
      r.status.toLowerCase() === 'pending'
    ).length;
  }

}