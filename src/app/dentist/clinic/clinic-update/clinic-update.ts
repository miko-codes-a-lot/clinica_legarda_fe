import { Component } from '@angular/core';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ClinicForm } from '../clinic-form/clinic-form';
import { Day } from '../../../_shared/model/day';
import { forkJoin } from 'rxjs';
import { DayService } from '../../../_shared/service/day-service';

@Component({
  selector: 'app-clinic-update',
  imports: [ClinicForm],
  templateUrl: './clinic-update.html',
  styleUrl: './clinic-update.css'
})
export class ClinicUpdate {
  isLoading = false
  id!: string
  clinic!: Clinic
  days: Day[] = []

  constructor(
    private readonly clinicService: ClinicService,
    private readonly dayService: DayService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']

    forkJoin({
      clinic: this.clinicService.getOne(this.id),
      days: this.dayService.getAll(),
    }).subscribe({
      next: ({ clinic, days }) => {
        this.clinic = clinic
        this.days = days
      },
      error: (e) => alert(`Something went wrong: ${e}`),
      complete: () => this.isLoading = false
    })
  }

  onSubmit(clinic: Clinic) {
    this.isLoading = true
    this.clinicService.update(this.id, clinic).subscribe({
      next: () => this.router.navigate(['admin/clinic/details', this.id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
