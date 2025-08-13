import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Clinic } from '../../../_shared/model/clinic';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';

@Component({
  selector: 'app-clinic-list',
  imports: [GenericTableComponent],
  templateUrl: './clinic-list.html',
  styleUrl: './clinic-list.css'
})
export class ClinicList {
  isLoading = false
  title = 'Clinic'
  create = {
    label: 'Create Clinic',
    link: '/admin/clinic/create',
  }
  dataSource = new MatTableDataSource<Clinic>();

  displayedColumns: string[] = ['_id', 'name', 'address', 'actions'];
  columnDefs = [
    { key: '_id', label: 'ID', cell: (clinic: Clinic) => clinic._id ?? '' },
    { key: 'name', label: 'Name', cell: (clinic: Clinic) =>  clinic.name},
    { key: 'address', label: 'Address', cell: (clinic: Clinic) =>  clinic.address},
  ];
  

  constructor(
    private readonly clinicService: ClinicService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.clinicService.getAll().subscribe({
      next: (clinics) => {
        this.dataSource.data = clinics;
      },
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false);
  }

  onDetails(id: string) {
    this.router.navigate(['/admin/clinic/details', id])
  }

  onUpdate(id: string) {
    this.router.navigate(['/admin/clinic/update', id])
  }
}
