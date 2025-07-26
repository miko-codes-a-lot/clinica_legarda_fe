import { Component } from '@angular/core';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-clinic-details',
  imports: [],
  templateUrl: './clinic-details.html',
  styleUrl: './clinic-details.css'
})
export class ClinicDetails {
  isLoading = false
  id!: string
  clinic?: Clinic

  constructor(
    private readonly clinicService: ClinicService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.clinicService.getOne(this.id).subscribe({
      next: (c) => this.clinic = c,
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate(['/admin/clinic/update', this.id])
  }
}
