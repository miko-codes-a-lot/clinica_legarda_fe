import { Component } from '@angular/core';
import { Notification } from '../../../_shared/model/notification';
import { NotificationService } from '../../../_shared/service/notification-service';
import { ActivatedRoute } from '@angular/router';
import { TypeUtil } from '../../../utils/type-util';
import { User } from '../../../_shared/model/user';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-notification-details',
  imports: [MatProgressSpinner],
  templateUrl: './notification-details.html',
  styleUrl: './notification-details.css'
})
export class NotificationDetails {
  isLoading = false
  id!: string
  notification?: Notification

  constructor(
    private readonly notificationService: NotificationService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.notificationService.getOne(this.id).subscribe({
      next: (n) => this.notification = n,
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  getTypeLabel(type: string) {
    return TypeUtil.appointmentType(type)
  }

  getFullName(user: User) {
    return `${user.firstName} ${user.lastName}`
  }

  markAsRead() {
    this.isLoading = true

    this.notificationService.markAsRead(this.id).subscribe({
      error: (err) => alert(`Something went wrong: ${err}`),
    }).add(() => this.isLoading = false)
  }
}
