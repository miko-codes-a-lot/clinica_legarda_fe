import { Component, OnInit, ViewChild, TemplateRef  } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { RouterLink, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';

import { AuthService } from '../../../_shared/service/auth-service';
import { UserService } from '../../../_shared/service/user-service';


// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-user-settings-index',
  templateUrl: './user-settings-index.html',
  styleUrl: './user-settings-index.css',
  imports: [MatCardModule, MatDividerModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatIconModule, MatSelectModule, CommonModule, RouterLink, MatDialogModule]
})
export class UserSettingsIndex implements OnInit {
  @ViewChild('avatarModal') avatarModal!: TemplateRef<any>;
  profileForm!: FormGroup;
  // avatarUrl: string = 'assets/images/default-dentist.png'; // default profile pic
  avatarUrl: string | null = null;

  user = {
    _id: '',
    firstName: '',
    middleName: '',
    lastName: '',
    emailAddress: '',
    address: '',
    role: '',
    username: '',
    mobileNumber: '',
    profilePicture: '',
    createdAt: '',
    updatedAt: '',
  };

  isLoading = false

  selectedDays = new Set<string>();

  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef  // <-- inject
  ) {}


  openAvatarModal() {
    this.dialog.open(this.avatarModal);
  }

  closeAvatarModal() {
    this.dialog.closeAll();
    this.selectedFile = null;
  }

  onUpload() {
  if (!this.selectedFile) return;
  console.log('this.selectedFile', this.selectedFile)
  this.userService.uploadProfilePicture(this.user._id, this.selectedFile)
    .subscribe({
      next: (res) => {
        alert('Profile picture uploaded successfully!');
        this.closeAvatarModal(); // close the dialog
      },
      error: (err) => {
        console.error('Upload error', err);
        alert('Failed to upload profile picture.');
      }
    });
    // console.log('result index TS', result)
    // TODO: call API to save file

    // to activate/use
    // this.closeAvatarModal();
  }

  ngOnInit(): void {

    // change the format to E.164
    // const mobileNumber = this.profileForm.get('mobileNumber');
    // if (mobileNumber) {
    //   applyPHMobilePrefix(mobileNumber)
    // }
    this.authService.currentUser$.subscribe({
      next: (user) => {
        console.log('current user: ', user)
        if(user) {
          if(user?.profilePicture) {
            this.loadProfilePicture(user._id);
          }
          this.user = {
            _id: user._id,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            emailAddress: user.emailAddress,
            // profileImage: user.firstName,
            address: user.address,
            role: user.role,
            username: user.username,
            // memberSince: new Date('2023-01-15'),
            mobileNumber: user.mobileNumber,
            profilePicture: user.profilePicture || '',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      }
    });
  }

  editUser () {
    console.log('edit page')
    this.router.navigate(['/admin/user-settings/update'])
  }


  logout() {
    this.isLoading = true
    this.authService.logout()
      .subscribe({
        next: () => this.router.navigate(['/admin/login']),
        error: (err) => alert(`Something went wrong: ${err}`)
      })
      .add(() => this.isLoading = false)
  }

  triggerFileInput() {
    console.log('trigger file input')
  }

  // Load the actual profile picture from backend
  loadProfilePicture(userId: string) {
    this.userService.getProfilePicture(userId).subscribe({
      next: (url) => this.avatarUrl = url,
      error: () => this.avatarUrl = null
    });
  }
  // original
  onAvatarChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.avatarUrl = reader.result as string;
      reader.readAsDataURL(file);
    }
  }
}
