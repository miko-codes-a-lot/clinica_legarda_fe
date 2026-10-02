import { PageHeader } from '../../../_shared/ui/page-header/page-header';
import { EmptyState } from '../../../_shared/ui/empty-state/empty-state';
import { Component, OnInit } from '@angular/core';
import { UserForm } from '../user-form/user-form';
import { UserService } from '../../../_shared/service/user-service';
import { Router } from '@angular/router';
import { DayService } from '../../../_shared/service/day-service';
import { Day } from '../../../_shared/model/day';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { Clinic } from '../../../_shared/model/clinic';
import { forkJoin } from 'rxjs';
import { UserPayload } from '../user-form/user-payload';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-user-create',
  imports: [PageHeader, EmptyState, UserForm],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css'
})
export class UserCreate implements OnInit {
  isLoading = false
  loadError = ''
  clinics: Clinic[] = []
  days: Day[] = []

  constructor(
    private readonly clinicService: ClinicService,
    private readonly userService: UserService,
    private readonly dayService: DayService,
    private readonly alertService: AlertService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    forkJoin({
      days: this.dayService.getAll(),
      clinics: this.clinicService.getAccessible(),
    }).subscribe({
      next: ({ days, clinics }) => {
        this.days = days
        this.clinics = clinics
      },
      error: e => {
        this.loadError = e.error?.message || 'Unable to load user options.';
        this.alertService.error(this.loadError);
      },
    }).add(() => this.isLoading = false)
  }

  onSubmit(user: UserPayload) {
    this.isLoading = true
    this.userService.create(user).subscribe({
      next: (u) => this.router.navigate(['admin/user/details', u._id], { replaceUrl: true }),
      error: (e) => {
        this.alertService.error(
          e.error?.message || 'Something went wrong'
        );
      },
    }).add(() => this.isLoading = false)
  }
}
