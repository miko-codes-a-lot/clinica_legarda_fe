import { Component, OnInit } from '@angular/core';
import { UserForm } from '../user-form/user-form';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DayService } from '../../../_shared/service/day-service';
import { Day } from '../../../_shared/model/day';
import { UserPayload } from '../user-form/user-payload';

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
  days: Day[] = []

  constructor(
    private readonly userService: UserService,
    private readonly dayService: DayService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']

    forkJoin({
      user: this.userService.getOne(this.id),
      days: this.dayService.getAll(),
    }).subscribe({
      next: ({ user, days }) => {
        this.user = user
        this.days = days
      },
      error: (e) => alert(`Something went wrong: ${e}`),
      complete: () => this.isLoading = false,
    })
  }

  onSubmit(user: UserPayload) {
    this.isLoading = true
    this.userService.update(this.id, user).subscribe({
      next: () => this.router.navigate(['admin/user/details', this.id], { replaceUrl: true }),
      error: (e) => alert(`Something went wrong: ${e}`)
    }).add(() => this.isLoading = false)
  }
}
