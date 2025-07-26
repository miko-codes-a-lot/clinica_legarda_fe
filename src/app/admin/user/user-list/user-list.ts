import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList {
  constructor(private readonly router: Router) {}

  onDetails(id: number) {
    this.router.navigate(['/admin/user/details', id])
  }

  onUpdate(id: number) {
    this.router.navigate(['/admin/user/update', id])
  }

}
