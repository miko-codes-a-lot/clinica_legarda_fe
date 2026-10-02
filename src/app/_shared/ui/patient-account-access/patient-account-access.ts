import { Component, Input } from '@angular/core';
import { User } from '../../model/user';
import { StatusBadge } from '../status-badge/status-badge';

@Component({
  selector: 'app-patient-account-access',
  imports: [StatusBadge],
  template: `
    <section class="ui-card mt-5 p-5 sm:p-6" aria-label="Patient account access">
      <div class="ui-toolbar mb-3">
        <h2 class="ui-section-title">Patient account access</h2>
        <app-status-badge [status]="user.status || 'pending'" />
      </div>
      @if (user.status === 'walk_in') {
        <p class="ui-muted">Registered by staff for in-person care. Clinic staff can create appointments.</p>
      }
      @if (user.status === 'pending' || user.status === 'walk_in') {
        <p class="ui-muted mt-2">For online booking, add an email the patient can access and provide their username and initial password. They sign in and complete the email OTP to confirm this same account.</p>
      } @else if (user.status === 'confirmed') {
        <p class="ui-muted">This patient account is confirmed and can book online after signing in.</p>
      } @else {
        <p class="ui-muted">This account cannot be used for new bookings. Review its status with the clinic.</p>
      }
      @if (user.isWalkIn) { <p class="ui-muted mt-2">Originally registered as a walk-in patient.</p> }
    </section>
  `,
})
export class PatientAccountAccess {
  @Input({ required: true }) user!: User;
}
