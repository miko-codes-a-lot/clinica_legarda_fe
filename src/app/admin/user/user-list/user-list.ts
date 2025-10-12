import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';


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
  displayedColumns: string[] = ['_id', 'name', 'role', 'actions'];
  columnDefs = [
    { key: '_id', label: 'ID', cell: (user: User) => user._id ?? '' },
    { key: 'name', label: 'Name', cell: (user: User) => `${user.firstName} ${user.lastName}` },
    { key: 'role', label: 'ROLE', cell: (user: User) => user.role ?? '' },
  ];

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.userService.getAll().subscribe({
      next: (users) => {
        this.dataSource.data = users;
      },
      error: (e) => alert(`Something went wrong ${e}`)
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
