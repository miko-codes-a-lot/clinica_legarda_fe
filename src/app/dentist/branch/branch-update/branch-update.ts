import { Component } from '@angular/core';
import { BranchForm } from '../branch-form/branch-form';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { BranchService } from '../../../_shared/service/branch-service';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchPayload } from '../branch-form/branch-payload';
import { Branch } from '../../../_shared/model/branch';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-branch-update',
  imports: [BranchForm],
  templateUrl: './branch-update.html',
  styleUrl: './branch-update.css'
})
export class BranchUpdate {
  isLoading = false
  id!: string
  clinics: Clinic[] = []
  branch?: Branch

  constructor(
    private readonly clinicService: ClinicService,
    private readonly branchService: BranchService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']

    forkJoin({
      branch: this.branchService.getOne(this.id),
      clinics: this.clinicService.getAll(),
    }).subscribe({
      next: ({ branch, clinics }) => {
        this.branch = branch
        this.clinics = clinics
      },
      error: (e) => alert(`Something went wrong ${e}`),
      complete: () => this.isLoading = false
    })
  }

  onSubmit(branch: BranchPayload) {
    this.isLoading = true
    this.branchService.create(branch).subscribe({
      next: (c) => this.router.navigate(['admin/branch/details', c._id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
