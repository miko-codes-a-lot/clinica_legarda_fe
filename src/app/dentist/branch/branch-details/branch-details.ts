import { Component } from '@angular/core';
import { Branch } from '../../../_shared/model/branch';
import { BranchService } from '../../../_shared/service/branch-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-branch-details',
  imports: [RouterLink],
  templateUrl: './branch-details.html',
  styleUrl: './branch-details.css'
})
export class BranchDetails {
  isLoading = false
  id!: string
  branch?: Branch

  constructor(
    private readonly branchService: BranchService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.branchService.getOne(this.id).subscribe({
      next: (b) => this.branch = b,
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate(['/admin/branch/update', this.id])
  }
}
