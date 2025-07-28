import { Component } from '@angular/core';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dental-service-list',
  imports: [],
  templateUrl: './dental-service-list.html',
  styleUrl: './dental-service-list.css'
})
export class DentalServiceList {
  isLoading = false

  dentalServices: DentalService[] = [];

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.dentalServicesService.getAll().subscribe({
      next: (dentalServices) => this.dentalServices = dentalServices,
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onCreate() {
    this.router.navigate(['/admin/service/create'])
  }

  onDetails(id: string) {
    this.router.navigate(['/admin/service/details', id])
  }

  onUpdate(id: string) {
    this.router.navigate(['/admin/service/update', id])
  }
}
