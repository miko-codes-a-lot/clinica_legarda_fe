import { Component } from '@angular/core';
import { Notification } from '../../../_shared/model/notification';
import { NotificationService } from '../../../_shared/service/notification-service';
import { ActivatedRoute } from '@angular/router';
import { TypeUtil } from '../../../utils/type-util';
import { User } from '../../../_shared/model/user';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AlertService } from '../../../_shared/service/alert.service';

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
    private readonly alertService: AlertService,

  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.notificationService.getOne(this.id).subscribe({
      next: (n) => this.notification = n,
      error: (e) => this.alertService.error(e.error.message)
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
      error: (err) => this.alertService.error(err),
    }).add(() => this.isLoading = false)
  }
}
