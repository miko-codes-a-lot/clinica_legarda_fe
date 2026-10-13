import { forkJoin } from 'rxjs';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { staffManagementPath } from '../../../_shared/model/staff-management-path';
import { PageHeader } from '../../../_shared/ui/page-header/page-header';
import { Component } from '@angular/core';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-dental-service-details',
  imports: [PageHeader, ListComponent, MatListModule, MatButtonModule],
  templateUrl: './dental-service-details.html',
  styleUrl: './dental-service-details.css'
})
export class DentalServiceDetails {
  isLoading = false
  loadError = '';
  id!: string
  dentalService?: DentalService
  displayDentalService: Record<string, any> = {};


  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly clinicService: ClinicService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']

    forkJoin({ service: this.dentalServicesService.getOne(this.id), clinics: this.clinicService.getAccessible() }).subscribe({
      next: ({ service: d, clinics }) => {
        const { name, duration: durationData } = d
        const duration = durationData + ' minutes'
        this.displayDentalService = {
          name,
          duration,
          availableAtClinics: clinics.filter(clinic => d.clinics === undefined || d.clinics.includes(clinic._id ?? '')).map(clinic => clinic.name).join(', ') || 'Unavailable',
         }
        this.dentalService = d
      },
      error: () => { this.loadError = 'Unable to load this service.'; this.alertService.error(this.loadError); }
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate([`${staffManagementPath(this.router.url)}/service/update`, this.id])
  }
}
