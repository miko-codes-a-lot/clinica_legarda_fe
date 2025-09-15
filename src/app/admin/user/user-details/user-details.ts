import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../_shared/service/user-service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../../_shared/model/user';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { ListComponent } from '../../../_shared/component/list/list.component';


@Component({
  selector: 'app-user-details',
  imports: [MatButtonModule, MatListModule, ListComponent],
  templateUrl: './user-details.html',
  styleUrl: './user-details.css'
})
export class UserDetails implements OnInit {
  isLoading = false
  id!: string
  user?: User
  filteredUser: Record<string, any> = {};

  constructor(
    private readonly userService: UserService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.userService.getOne(this.id).subscribe({
      next: (u) => {
        const { firstName, middleName, lastName, emailAddress, mobileNumber, address, role } = u;
        this.filteredUser = {firstName, middleName, lastName, emailAddress, mobileNumber, address, role}
        this.user = u
      },
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)

  }

  onUpdate() {
    this.router.navigate(['/admin/user/update', this.id])
  }
}
