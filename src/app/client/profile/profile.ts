import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  user = {
    firstName: 'Juan',
    lastName: 'Della Cruz',
    email: 'juan@gmail.com',
    profileImage: 'assets/images/user-profile.jpg',
    memberSince: new Date('2023-01-15'),
    mobileNumber: '+63 912 345 6789',
  };

  editProfile() {
    alert('Redirect to edit profile page.');
  }

  logout() {
    alert('Logout successful.');
  }
}
