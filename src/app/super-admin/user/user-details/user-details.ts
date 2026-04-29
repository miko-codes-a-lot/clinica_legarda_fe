import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../_shared/service/user-service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../../_shared/model/user';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatIconModule } from '@angular/material/icon';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-user-details',
  imports: [MatButtonModule, MatListModule, ListComponent, MatIconModule],
  templateUrl: './user-details.html',
  styleUrl: './user-details.css'
})
export class UserDetails implements OnInit {
  isLoading = false
  id!: string
  user?: User
  displayUser: Record<string, any> = {};

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
      next: (u) => {
        // set the data to display
        const { firstName, middleName, lastName, emailAddress, mobileNumber, address, role } = u;

        this.displayUser = {
          firstName,
          middleName,
          lastName,
          emailAddress,
          mobileNumber,
          address,
          role,
        }
        this.user = u
      },
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false)
  }

  isActionDisabled() {
    return this.user && this.user.status != null && ['confirmed', 'rejected'].includes(this.user.status);
  }

  onUpdate() {
    this.router.navigate(['/super-admin/user/update', this.id])
  }
}
