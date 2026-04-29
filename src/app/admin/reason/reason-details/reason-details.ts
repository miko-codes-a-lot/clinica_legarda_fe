import { Component } from '@angular/core';
import { Reason } from '../../../_shared/model/reason';
import { ReasonService } from '../../../_shared/service/reason-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-reason-details',
  imports: [ ListComponent, MatListModule, MatButtonModule ], // RouterLink
  templateUrl: './reason-details.html',
  styleUrl: './reason-details.css'
})
export class ReasonDetails {
  isLoading = false
  id!: string
  reason?: Reason
  displayReason: Record<string, any> = {};


  constructor(
    private readonly reasonService: ReasonService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.reasonService.findOne(this.id).subscribe({
      next: (c) => {
        const { code, label, description, usage, isActive } = c
        this.displayReason = {
          code,
          label,
          description,
          usage,
          isActive
        }
        this.reason = c
      },
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate(['/admin/reason/update', this.id])
  }
}
