import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';

@Component({
  selector: 'app-clinic-list',
  imports: [RouterLink],
  templateUrl: './clinic-list.html',
  styleUrl: './clinic-list.css'
})
export class ClinicList {
  isLoading = false

  clinics: Clinic[] = [];

  constructor(
    private readonly clinicService: ClinicService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.clinicService.getAll().subscribe({
      next: (clinics) => this.clinics = clinics,
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onDetails(id: string) {
    this.router.navigate(['/admin/clinic/details', id])
  }

  onUpdate(id: string) {
    this.router.navigate(['/admin/clinic/update', id])
  }
}
