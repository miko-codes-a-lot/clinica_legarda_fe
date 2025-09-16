import { Component } from '@angular/core';
import { NotificationService } from '../../../_shared/service/notification-service';
import { Notification } from '../../../_shared/model/notification';
import { TypeUtil } from '../../../utils/type-util';
import { User } from '../../../_shared/model/user';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';



@Component({
  selector: 'app-notification-list',
  imports: [GenericTableComponent],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css'
})


export class NotificationList {
  isLoading = false
  moduleUrl = '/admin/notification/'
  title = 'Notification'
  dataSource = new MatTableDataSource<Notification>();
  notifications: Notification[] = []
  displayedColumns: string[] = ['type', 'message', 'user', 'date', 'actions'];
  columnDefs = [
    { key: 'type', label: 'Type', cell: (notification: Notification) => notification.type ?? '' },
    { key: 'message', label: 'Message', cell: (notification: Notification) => notification.message},
    { key: 'user', label: 'User', cell: (notification: Notification): SafeHtml => {
      const fullName = this.getFullName(notification.createdBy)
      return this.sanitizer.bypassSecurityTrustHtml(`<a href="admin/user/details/${notification.createdBy._id}">${fullName}</a>`);
    }},
    { key: 'date', label: 'Date', cell: (notification: Notification) =>  notification.timestamp},
  ];
  
  constructor(
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.notificationService.getAll().subscribe({
      next: (notifications) => {
        this.dataSource.data = notifications
      },
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

  onMarkAsRead(docId: string) {
    this.isLoading = true

    // for now it should load
    this.notificationService.markAsRead(docId).subscribe({
      error: (err) => alert(`Something went wrong: ${err}`),
    }).add(() => this.isLoading = false)
  }
}
