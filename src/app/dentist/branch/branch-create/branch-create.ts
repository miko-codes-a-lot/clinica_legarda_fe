import { Component, OnInit } from '@angular/core';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { BranchForm } from '../branch-form/branch-form';
import { BranchService } from '../../../_shared/service/branch-service';
import { BranchPayload } from '../branch-form/branch-payload';
import { ActivatedRoute, Router } from '@angular/router';
import { Branch } from '../../../_shared/model/branch';

@Component({
  selector: 'app-branch-create',
  imports: [BranchForm],
  templateUrl: './branch-create.html',
  styleUrl: './branch-create.css'
})
export class BranchCreate implements OnInit {
  isLoading = false
  initBranch!: Branch
  clinics: Clinic[] = []

  constructor(
    private readonly clinicService: ClinicService,
    private readonly branchService: BranchService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    const initBranch = this.branchService.getEmptyNonNullBranch()
    const clinicId = this.route.snapshot.queryParams['clinicId']
    if (clinicId) {
      initBranch.clinic._id = clinicId
    }
    this.initBranch = initBranch

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
