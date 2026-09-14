import { Component } from '@angular/core';
import { StaffAppointmentList } from '../../../_shared/staff-appointment-list/staff-appointment-list';

@Component({
  selector: 'app-admin-appointment-list',
  imports: [StaffAppointmentList],
  template: '<app-staff-appointment-list area="admin" />',
})
export class AppointmentList {}
