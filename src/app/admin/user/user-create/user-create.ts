import { Component } from '@angular/core';
import { UserForm } from '../user-form/user-form';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-create',
  imports: [UserForm],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css'
})
export class UserCreate {
  isLoading = false

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
  ) {}

  onSubmit(user: User) {
    this.isLoading = true
    this.userService.create(user).subscribe({
      next: (u) => this.router.navigate(['admin/user/details', u.id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
