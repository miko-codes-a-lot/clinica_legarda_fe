import { USER_TABLE_COLUMNS, userTableFilters } from '../../../_shared/component/table/management-table-config';
import { TableFilter } from '../../../_shared/component/table/table-model';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-user-list',
  imports: [GenericTableComponent],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})

export class UserList implements OnInit {
  isLoading = false
  moduleUrl = '/admin/user/'
  title = 'User Management'
  createLabel = 'Create User'
  dataSource = new MatTableDataSource<User>();
  displayedColumns = ['name', 'role', 'status', 'contact', 'clinics', 'actions'];
  columnDefs = USER_TABLE_COLUMNS;
  filters: TableFilter<User>[] = [];

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.userService.getAll().subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.filters = userTableFilters(users);
      },
      error: (e) => this.alertService.error(e.error.message)
    }).add(() => this.isLoading = false);
  }

  onDetails(id: string) {
    this.router.navigate([`${this.moduleUrl}/details`, id])
  }

  onUpdate(id: string) {
    this.router.navigate([`${this.moduleUrl}/update`, id])
  }

  onCreate() {
    this.router.navigate([`${this.moduleUrl}/create`])
  }

}
