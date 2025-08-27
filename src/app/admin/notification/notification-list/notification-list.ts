import { Component } from '@angular/core';
import { NotificationService } from '../../../_shared/service/notification-service';
import { Notification } from '../../../_shared/model/notification';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TypeUtil } from '../../../utils/type-util';
import { User } from '../../../_shared/model/user';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-notification-list',
  imports: [MatProgressSpinner, RouterLink],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css'
})
export class NotificationList {
  isLoading = false
  notifications: Notification[] = []
  
  constructor(
    private readonly notificationService: NotificationService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.notificationService.getAll().subscribe({
      next: (n) => this.notifications = n,
      error: (err) => alert(`Something went wrong ${err}`),
    }).add(() => this.isLoading = false);
  }

  getTypeLabel(type: string) {
    return TypeUtil.appointmentType(type)
  }

  getFullName(user: User) {
    return `${user.firstName} ${user.lastName}`
  }

  onDetails(id: string) {
    this.router.navigate([`/admin/notification/details`, id])
  }

  markAsRead(docId: string) {
    this.isLoading = true

    this.notificationService.markAsRead(docId).subscribe({
      error: (err) => alert(`Something went wrong: ${err}`),
    }).add(() => this.isLoading = false)
  }
}
