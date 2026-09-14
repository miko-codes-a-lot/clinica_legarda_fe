import { Component } from '@angular/core';
import { StaffDashboard } from '../../../_shared/staff-dashboard/staff-dashboard';

@Component({
  selector: 'app-dashboard-index',
  imports: [StaffDashboard],
  template: '<app-staff-dashboard area="super-admin" />',
})
export class DashboardIndex {}
