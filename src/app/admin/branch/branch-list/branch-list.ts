import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Branch } from '../../../_shared/model/branch';
import { BranchService } from '../../../_shared/service/branch-service';
import { AlertService } from '../../../_shared/service/alert.service';


@Component({
  selector: 'app-branch-list',
  imports: [RouterLink],
  templateUrl: './branch-list.html',
  styleUrl: './branch-list.css'
})
export class BranchList {
  isLoading = false

  branches: Branch[] = [];

  constructor(
    private readonly branchService: BranchService,
    private readonly router: Router,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.branchService.getAll().subscribe({
      next: (branches) => this.branches = branches,
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false)
  }

  onDetails(id: string) {
    this.router.navigate(['/admin/branch/details', id])
  }

  onUpdate(id: string) {
    this.router.navigate(['/admin/branch/update', id])
  }
}
