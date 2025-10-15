import { Component, OnInit, ViewChild, TemplateRef  } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../_shared/service/auth-service';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-user-settings-index',
  templateUrl: './user-settings-index.html',
  styleUrl: './user-settings-index.css',
  imports: [MatCardModule, MatDividerModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatIconModule, MatSelectModule, CommonModule, MatDialogModule]
})
export class UserSettingsIndex implements OnInit {
  @ViewChild('avatarModal') avatarModal!: TemplateRef<any>;
  profileForm!: FormGroup;
  avatarUrl: string = 'assets/images/default-dentist.png'; // default profile pic

  user = {
    firstName: '',
    middleName: '',
    lastName: '',
    emailAddress: '',
    // profileImage: '',
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

  selectedAvatarFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private dialog: MatDialog
  ) {}


  openAvatarModal() {
    this.dialog.open(this.avatarModal);
  }

  closeAvatarModal() {
    this.dialog.closeAll();
    this.selectedAvatarFile = null;
  }

  onAvatarChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = () => this.user.profilePicture = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  saveAvatar() {
    if (!this.selectedAvatarFile) return;

    // TODO: call API to save file
    console.log('Uploading file:', this.selectedAvatarFile);

    this.closeAvatarModal();
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
          this.user = {
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
            profilePicture: '',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
          console.log('this.user settings ', this.user);
        }
      }
    });

  }

  editUser () {
    console.log('edit page')
    this.router.navigate(['/app/user-settings/update'])
  }

  getProfilePictureUrl(): string {
    // replace with your actual file path / API
    return this.user.profilePicture 
      ? `/assets/profile-pictures/${this.user.profilePicture}` 
      : '';
  }

  changeProfilePicture () {
    console.log('test upload')
  }


  // logout() {
  //   this.isLoading = true

  //   this.authService.logout()
  //     .subscribe({
  //       next: () => this.router.navigate(['/admin/login']),
  //       error: (err) => alert(`Something went wrong: ${err}`)
  //     })
  //     .add(() => this.isLoading = false)
  // }

  triggerFileInput() {
    console.log('trigger file input')
  }
  // original
  // onAvatarChange(event: any): void {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = () => this.avatarUrl = reader.result as string;
  //     reader.readAsDataURL(file);
  //   }
  // }
}
