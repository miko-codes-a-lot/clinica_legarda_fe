import { Component } from '@angular/core';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServicesService } from '../../../_shared/service/dental-services-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';



@Component({
  selector: 'app-dental-service-details',
  imports: [ListComponent, MatListModule, MatButtonModule],
  templateUrl: './dental-service-details.html',
  styleUrl: './dental-service-details.css'
})
export class DentalServiceDetails {
  isLoading = false
  id!: string
  dentalService?: DentalService
  displayDentalService: Record<string, any> = {};


  constructor(
    private readonly dentalServicesService: DentalServicesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']

    this.dentalServicesService.getOne(this.id).subscribe({
      next: (d) => {
        const { name, duration: durationData } = d
        const duration = durationData + ' minutes'
        this.displayDentalService = {
          name,
          duration
         }
        this.dentalService = d
      },
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate(['/admin/service/update', this.id])
  }
}
