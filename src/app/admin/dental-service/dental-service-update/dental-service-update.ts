import { Component } from '@angular/core';
import { DentalServiceForm } from '../dental-service-form/dental-service-form';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-dental-service-update',
  imports: [DentalServiceForm],
  templateUrl: './dental-service-update.html',
  styleUrl: './dental-service-update.css'
})
export class DentalServiceUpdate {
  isLoading = false
  id!: string
  dentalService!: DentalService

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']

    this.dentalServicesService.getOne(this.id).subscribe({
      next: (d) => this.dentalService = d,
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }

  onSubmit(dentalService: DentalService) {
    this.isLoading = true
    this.dentalServicesService.update(this.id, dentalService).subscribe({
      next: () => this.router.navigate(['admin/service/details', this.id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
