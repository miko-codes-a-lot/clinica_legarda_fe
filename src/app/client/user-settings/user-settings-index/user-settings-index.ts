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
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';

import { AuthService } from '../../../_shared/service/auth-service';
import { UserService } from '../../../_shared/service/user-service';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { MatTableDataSource } from '@angular/material/table';

import { Appointment } from '../../../_shared/model/appointment';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { Clinic } from '../../../_shared/model/clinic';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-user-settings-index',
  templateUrl: './user-settings-index.html',
  styleUrl: './user-settings-index.css',
  imports: [MatCardModule, MatDividerModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatIconModule, MatSelectModule, CommonModule, MatDialogModule, GenericTableComponent]
})
export class UserSettingsIndex implements OnInit {
  @ViewChild('avatarModal') avatarModal!: TemplateRef<any>;
  profileForm!: FormGroup;
  // avatarUrl: string = 'assets/images/default-dentist.png'; // default profile pic
  avatarUrl: string | null = null;
  dataSource = new MatTableDataSource<Appointment>();
  clinics?: Clinic[] = [];

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

  activeTab: 'profile' | 'history' = 'profile';

  latestAppointments?: Appointment[] = [];;
  appointments: any[] = [];
  showAllHistory = false;

  displayedColumns: string[] = ['clinic', 'services', 'patient', 'dentist', 'date', 'time', 'status'];
  columnDefs = [
    { key: 'clinic', label: 'Clinic', cell: (latestAppointments: Appointment) => latestAppointments.clinic.name},
    { key: 'services', label: 'Services',   cell: (latestAppointments: Appointment) => latestAppointments.services.map(service => service.name).join(', ')
    },
    { key: 'patient', label: 'Patient', cell: (latestAppointments: Appointment) =>  `${latestAppointments.patient.firstName} ${latestAppointments.patient.lastName}` },
    { key: 'dentist', label: 'Dentist', cell: (latestAppointments: Appointment) =>  `${latestAppointments.dentist.firstName} ${latestAppointments.dentist.lastName}` },
    { key: 'date', label: 'Date', cell: (latestAppointments: Appointment) => latestAppointments.date },
    { key: 'time', label: 'Time', cell: (latestAppointments: Appointment) =>  `${latestAppointments.startTime} - ${latestAppointments.endTime}` },
    { key: 'status', label: 'Status', cell: (latestAppointments: Appointment) => latestAppointments.status },
  ];
  
  constructor(
    private fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly clinicService: ClinicService,
    private readonly appointmentService: AppointmentService,
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

    this.clinicService.getAll().subscribe({
      next: (data) => {
        this.clinics = data;  // Make sure clinics are loaded
        this.loadAppointments(); // After clinics are loaded, then load appointments
      },
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false);

    this.authService.currentUser$.subscribe({
      next: (user) => {
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

    this.loadAppointments();
  }

  editUser () {
    this.router.navigate(['/app/user-settings/update'])
  }


  logout() {
    this.isLoading = true
    this.authService.logout()
      .subscribe({
        next: () => this.router.navigate(['/app/login']),
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

  loadAppointments() {
    // Replace with your actual API call
    this.appointmentService.getAll(this.user._id)
      .subscribe((res: any) => {
        this.appointments = res;
        this.latestAppointments = this.appointments
          .filter(appointment => appointment.status === 'confirmed')
          .slice()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        this.dataSource.data = this.latestAppointments;
        console.log('this.dataSource.data', this.dataSource.data);
    });
  }

  toggleHistory() {
    this.showAllHistory = !this.showAllHistory;

    if (this.showAllHistory) {
      // show all
      this.latestAppointments = this.appointments
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      // show latest 10 only
      this.loadAppointments();
    }
  }

  getServiceNames(services: any[]) {
    if (!services || services.length === 0) return 'N/A';
    return services.map(s => s.name).join(', ');
  }
}
