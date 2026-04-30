import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { AuthService } from '../../../_shared/service/auth-service';
import { UserSimple } from '../../../_shared/model/user-simple';
import { AlertService } from '../../../_shared/service/alert.service';

@Component({
  selector: 'app-user-list',
  imports: [GenericTableComponent],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})

export class UserList implements OnInit {
  isLoading = false
  moduleUrl = '/super-admin/user/'
  title = 'User Management'
  createLabel = 'Create User'
  dataSource = new MatTableDataSource<User>();
  displayedColumns: string[] = ['_id', 'name', 'role', 'mobileNumber', 'emailAddress', 'actions'];
  columnDefs = [
    { key: '_id', label: 'ID', cell: (user: User) => user._id ?? '' },
    { key: 'name', label: 'Name', cell: (user: User) => `${user.firstName} ${user.lastName}` },
    { key: 'role', label: 'ROLE', cell: (user: User) => user.role ?? '' },
    { key: 'mobileNumber', label: 'Mobile #', cell: (user: User) => user.mobileNumber ?? '' },
    { key: 'emailAddress', label: 'Email Address', cell: (user: User) => user.emailAddress ?? '' },
  ];

  user: UserSimple | null = null

  isSuperAdmin = false;

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.authService.currentUser$.subscribe({
      next: (u) => {
        this.user = u;
        this.isSuperAdmin = this.user?.role === 'super-admin';
      }
    })

    this.userService.getAll().subscribe({
      next: (users) => {
        this.dataSource.data = users;
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

  onDelete(id: string) {
    const confirmed = confirm('Are you sure you want to delete this user?');

    if (!confirmed) {
      return;
    }

    this.userService.delete(id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(
          user => user._id !== id
        );

        this.alertService.error('The user account has been deleted successfully.')
      },
      error: (e) => {
        console.error(e);
        this.alertService.error(e.error.message);
      }
    });
  }

}
