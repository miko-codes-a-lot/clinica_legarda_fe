import { Component } from '@angular/core';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ListComponent } from '../../../_shared/component/list/list.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-clinic-details',
  imports: [ ListComponent, MatListModule, MatButtonModule ], // RouterLink
  templateUrl: './clinic-details.html',
  styleUrl: './clinic-details.css'
})
export class ClinicDetails {
  isLoading = false
  id!: string
  clinic?: Clinic
  displayClinic: Record<string, any> = {};


  constructor(
    private readonly clinicService: ClinicService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.clinicService.getOne(this.id).subscribe({
      next: (c) => {
        const { name, address, mobileNumber, emailAddress } = c
        this.displayClinic = {
          name,
          address,
          mobileNumber,
          emailAddress,
        }
        this.clinic = c
      },
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate(['/admin/clinic/update', this.id])
  }

  // onAddBranch() {
  //   this.router.navigate(['/admin/branch/create'], { queryParams: { clinicId: this.id } })
  // }
}
