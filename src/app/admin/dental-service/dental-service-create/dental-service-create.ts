import { Component, OnInit } from '@angular/core';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { Router } from '@angular/router';
import { DentalServiceForm } from '../dental-service-form/dental-service-form';
import { AlertService } from '../../../_shared/service/alert.service';


@Component({
  selector: 'app-dental-service-create',
  imports: [DentalServiceForm],
  templateUrl: './dental-service-create.html',
  styleUrl: './dental-service-create.css'
})
export class DentalServiceCreate implements OnInit {
  isLoading = false
  initDoc!: DentalService

  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.initDoc = this.dentalServicesService.getEmptyOrNullDoc()
  }

  onSubmit(dentalService: DentalService) {
    this.isLoading = true
    this.dentalServicesService.create(dentalService).subscribe({
      next: (c) => this.router.navigate(['admin/service/details', c._id], { replaceUrl: true }),
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false)
  }
}
