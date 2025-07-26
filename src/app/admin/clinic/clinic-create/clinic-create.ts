import { Component } from '@angular/core';
import { ClinicForm } from '../clinic-form/clinic-form';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { Router } from '@angular/router';
import { Clinic } from '../../../_shared/model/clinic';

@Component({
  selector: 'app-clinic-create',
  imports: [ClinicForm],
  templateUrl: './clinic-create.html',
  styleUrl: './clinic-create.css'
})
export class ClinicCreate {
  isLoading = false

  constructor(
    private readonly clinicService: ClinicService,
    private readonly router: Router,
  ) {}

  onSubmit(clinic: Clinic) {
    this.isLoading = true
    this.clinicService.create(clinic).subscribe({
      next: (c) => this.router.navigate(['admin/clinic/details', c._id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
