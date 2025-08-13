import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../_shared/service/user-service';
import { User } from '../../../_shared/model/user';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { MatTableDataSource } from '@angular/material/table';


@Component({
  selector: 'app-user-list',
  imports: [GenericTableComponent],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})

export class UserList implements OnInit {
  isLoading = false
  title = 'User Management'
  create = {
    label: 'Create User',
    link: '/admin/user/create',
  }

  dataSource = new MatTableDataSource<User>();
  displayedColumns: string[] = ['_id', 'name', 'actions'];
  columnDefs = [
    { key: '_id', label: 'ID', cell: (user: User) => user._id ?? '' },
    { key: 'name', label: 'Name', cell: (user: User) => `${user.firstName} ${user.lastName}` },
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
    this.router.navigate(['/admin/user/details', id])
  }

  onUpdate(id: string) {
    this.router.navigate(['/admin/user/update', id])
  }

}
