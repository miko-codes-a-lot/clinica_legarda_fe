import { Component, OnInit } from '@angular/core';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { BranchForm } from '../branch-form/branch-form';
import { BranchService } from '../../../_shared/service/branch-service';
import { BranchPayload } from '../branch-form/branch-payload';
import { Router } from '@angular/router';

@Component({
  selector: 'app-branch-create',
  imports: [BranchForm],
  templateUrl: './branch-create.html',
  styleUrl: './branch-create.css'
})
export class BranchCreate implements OnInit {
  isLoading = false
  clinics: Clinic[] = []

  constructor(
    private readonly clinicService: ClinicService,
    private readonly branchService: BranchService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.clinicService.getAll().subscribe({
      next: (c) => this.clinics = c,
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onSubmit(branch: BranchPayload) {
    this.isLoading = true
    this.branchService.create(branch).subscribe({
      next: (c) => this.router.navigate(['admin/branch/details', c._id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
