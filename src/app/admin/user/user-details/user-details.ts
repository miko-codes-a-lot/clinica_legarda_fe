import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../_shared/service/user-service';
import { ActivatedRoute, Router } from '@angular/router';
import { assignedClinics, User } from '../../../_shared/model/user';
import { Clinic } from '../../../_shared/model/clinic';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { AlertService } from '../../../_shared/service/alert.service';
import { DentistApproval } from '../../../_shared/component/dentist-approval/dentist-approval';


@Component({
  selector: 'app-user-details',
  imports: [MatButtonModule, MatListModule, ListComponent, DentistApproval],
  templateUrl: './user-details.html',
  styleUrl: './user-details.css'
})
export class UserDetails implements OnInit {
  isLoading = false
  id!: string
  user?: User
  displayUser: Record<string, string | undefined> = {};

  constructor(
    private readonly userService: UserService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.userService.getOne(this.id).subscribe({
      next: (user) => this.setUser(user),
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false)

  }

  setUser(user: User): void {
    const { firstName, middleName, lastName, emailAddress, mobileNumber, address, role } = user;
    this.displayUser = { firstName, middleName, lastName, emailAddress, mobileNumber, address, role };
    this.user = user;
  }

  onUpdate() {
    this.router.navigate(['/admin/user/update', this.id])
  }

  get clinicAssignments(): Clinic[] {
    return this.user ? assignedClinics(this.user) : [];
  }
}
