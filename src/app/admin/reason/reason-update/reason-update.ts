import { Component } from '@angular/core';
import { Reason } from '../../../_shared/model/reason';
import { ReasonService } from '../../../_shared/service/reason-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReasonForm } from '../reason-form/reason-form';
import { Day } from '../../../_shared/model/day';
import { forkJoin } from 'rxjs';
import { DayService } from '../../../_shared/service/day-service';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-reason-update',
  imports: [ReasonForm],
  templateUrl: './reason-update.html',
  styleUrl: './reason-update.css'
})
export class ReasonUpdate {
  isLoading = false
  id!: string
  reason!: Reason
  days: Day[] = []

  constructor(
    private readonly reasonService: ReasonService,
    private readonly dayService: DayService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']

    forkJoin({
      reason: this.reasonService.findOne(this.id),
      days: this.dayService.getAll(),
    }).subscribe({
      next: ({ reason, days }) => {
        this.reason = reason
        this.days = days
      },
      error: (e) => this.alertService.error(e.error.message),
      complete: () => this.isLoading = false
    })
  }

  onSubmit(reason: Reason) {
    this.isLoading = true
    this.reasonService.update(this.id, reason).subscribe({
      next: () => this.router.navigate(['admin/reason/details', this.id], { replaceUrl: true }),
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false)
  }
}
