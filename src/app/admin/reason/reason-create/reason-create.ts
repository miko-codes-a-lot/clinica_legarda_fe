import { Component, OnInit } from '@angular/core';
import { ReasonForm } from '../reason-form/reason-form';
import { ReasonService } from '../../../_shared/service/reason-service';
import { Router } from '@angular/router';
import { Reason } from '../../../_shared/model/reason';
import { Day } from '../../../_shared/model/day';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-reason-create',
  imports: [ReasonForm],
  templateUrl: './reason-create.html',
  styleUrl: './reason-create.css'
})
export class ReasonCreate implements OnInit {
  isLoading = false

  constructor(
    private readonly reasonService: ReasonService,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true
  }

  onSubmit(reason: Reason) {
    this.isLoading = true
    this.reasonService.create(reason).subscribe({
      next: (c) => this.router.navigate(['admin/reason/details', c._id], { replaceUrl: true }),
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false)
  }
}
