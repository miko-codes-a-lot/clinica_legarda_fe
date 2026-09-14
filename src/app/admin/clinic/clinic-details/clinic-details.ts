import { AuthService } from '../../../_shared/service/auth-service';
import { Component } from '@angular/core';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-clinic-details',
  imports: [ ListComponent, MatListModule, MatButtonModule ], // RouterLink
  templateUrl: './clinic-details.html',
  styleUrl: './clinic-details.css'
})
export class ClinicDetails {
  get moduleUrl(): string {
    return this.router.url.startsWith('/super-admin') ? '/super-admin/clinic' : '/admin/clinic';
  }

  isLoading = false
  loadError = ''
  id!: string
  clinic?: Clinic
  displayClinic: Record<string, any> = {};


  get canManage(): boolean { return this.authService.currentUserValue?.role === 'super-admin'; }

  constructor(
    private readonly authService: AuthService,
    private readonly clinicService: ClinicService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.clinicService.getOne(this.id).subscribe({
      next: (c) => {
        const { name, address, mobileNumber, emailAddress } = c
        this.displayClinic = {
          name,
          address,
          mobileNumber,
          emailAddress,
        }
        this.clinic = c
      },
      error: (e) => {
        this.loadError = e.error?.message || 'Unable to load or save the clinic.';
        this.alertService.error(this.loadError);
        this.isLoading = false;
      }
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    if (!this.canManage) return;
    this.router.navigate([`${this.moduleUrl}/update`, this.id])
  }

  // onAddBranch() {
  //   this.router.navigate(['/admin/branch/create'], { queryParams: { clinicId: this.id } })
  // }
}
