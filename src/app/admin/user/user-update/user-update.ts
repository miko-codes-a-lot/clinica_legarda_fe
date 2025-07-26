import { Component, OnInit } from '@angular/core';
import { UserForm } from '../user-form/user-form';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-user-update',
  imports: [UserForm],
  templateUrl: './user-update.html',
  styleUrl: './user-update.css'
})
export class UserUpdate implements OnInit {
  isLoading = false
  id!: string
  user!: User

  constructor(
    private readonly userService: UserService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']

    this.userService.getOne(this.id).subscribe({
      next: (u) => this.user = u,
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }

  onSubmit(user: User) {
    this.isLoading = true
    this.userService.update(this.id, user).subscribe({
      next: () => this.router.navigate(['admin/user/details', this.id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
