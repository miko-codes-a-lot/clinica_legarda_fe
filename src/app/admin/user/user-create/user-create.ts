import { Component, OnInit } from '@angular/core';
import { UserForm } from '../user-form/user-form';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { Router } from '@angular/router';
import { DayService } from '../../../_shared/service/day-service';
import { Day } from '../../../_shared/model/day';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { Clinic } from '../../../_shared/model/clinic';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-create',
  imports: [UserForm],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css'
})
export class UserCreate implements OnInit {
  isLoading = false
  clinics: Clinic[] = []
  days: Day[] = []

  constructor(
    private readonly clinicService: ClinicService,
    private readonly userService: UserService,
    private readonly dayService: DayService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    forkJoin({
      days: this.dayService.getAll(),
      clinics: this.clinicService.getAll(),
    }).subscribe({
      next: ({ days, clinics }) => {
        this.days = days
        this.clinics = clinics
      },
      error: e => alert(`Something went wrong ${e}`),
      complete: () => this.isLoading = false
    })
  }

  onSubmit(user: User) {
    this.isLoading = true
    this.userService.create(user).subscribe({
      next: (u) => this.router.navigate(['admin/user/details', u._id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
