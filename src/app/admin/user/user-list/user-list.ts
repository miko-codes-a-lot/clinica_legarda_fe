import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../_shared/service/user-service';
import { User } from '../../../_shared/model/user';
import {MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';


@Component({
  selector: 'app-user-list',
  imports: [RouterLink, MatTableModule, MatProgressSpinnerModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList implements OnInit {
  isLoading = false

  users: User[] = [];
  displayedColumns: string[] = ['_id', 'name', 'actions'];

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.userService.getAll().subscribe({
      next: (users) => this.users = users,
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)

    console.log('users', this.users);
  }

  onDetails(id: string) {
    this.router.navigate(['/admin/user/details', id])
  }

  onUpdate(id: string) {
    this.router.navigate(['/admin/user/update', id])
  }

}
