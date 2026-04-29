import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../_shared/service/auth-service';
import { AlertService } from '../../_shared/service/alert.service';

@Component({
  selector: 'app-profile',
  imports: [DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  user = {
    firstName: '',
    lastName: '',
    email: '',
    profileImage: '',
    address: '',
    memberSince: new Date('2023-01-15'),
    mobileNumber: '',
  };

  // user = {}

  constructor(
    private readonly authService: AuthService,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit() {
    // fetch the current user follow the structure
     this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          console.log('this.user', user)
          this.user = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.emailAddress,
            profileImage: '',
            address: user.address,
            memberSince: new Date('2023-01-15'),
            mobileNumber: user.mobileNumber,
          };
        }
      }
    })
  }

  editProfile() {
    this.alertService.error('Redirect to edit profile page.');
  }

  logout() {
    this.alertService.error('Logout successful.');
  }
}
