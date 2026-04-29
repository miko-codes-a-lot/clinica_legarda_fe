import { Component, OnInit } from '@angular/core';
import { ClinicForm } from '../clinic-form/clinic-form';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { Router } from '@angular/router';
import { Clinic } from '../../../_shared/model/clinic';
import { DayService } from '../../../_shared/service/day-service';
import { Day } from '../../../_shared/model/day';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-clinic-create',
  imports: [ClinicForm],
  templateUrl: './clinic-create.html',
  styleUrl: './clinic-create.css'
})
export class ClinicCreate implements OnInit {
  isLoading = false
  days: Day[] = []

  constructor(
    private readonly clinicService: ClinicService,
    private readonly dayService: DayService,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.dayService.getAll().subscribe({
      next: (days) => this.days = days,
      error: (err) => this.alertService.error(err.error.message)
    }).add(() => this.isLoading = false)
  }

  onSubmit(clinic: Clinic) {
    this.isLoading = true
    this.clinicService.create(clinic).subscribe({
      next: (c) => this.router.navigate(['admin/clinic/details', c._id], { replaceUrl: true }),
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false)
  }
}
