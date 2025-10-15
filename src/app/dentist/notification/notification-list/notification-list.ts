import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../_shared/service/notification-service';
import { Notification } from '../../../_shared/model/notification';
import { TypeUtil } from '../../../utils/type-util';
import { User } from '../../../_shared/model/user';
import { UserService } from '../../../_shared/service/user-service';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { GenericTableComponent } from '../../../_shared/component/table/generic-table.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-notification-list',
  imports: [GenericTableComponent],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css'
})


export class NotificationList implements OnInit {
  isLoading = false
  title = 'Notification'
  dataSource = new MatTableDataSource<Notification>();
  notifications: Notification[] = []
  displayedColumns: string[] = ['type', 'message', 'user', 'date' ];
  usersMap = new Map<string, string>(); // recipientId → fullName
  // 'read', 'message', 'recipient', 'actions'

  constructor(
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.notificationService.getAllNotifications().subscribe({
      next: (notifications) => {

        const updatedNotifications = notifications.map(n => ({
          ...n,
          link: n.link ? n.link.replace('/admin/', '/dentist/') : n.link
        }));

        this.notifications = updatedNotifications;
        this.dataSource.data = updatedNotifications;
        const uniqueUserIds = [...new Set(notifications.map(n => n.recipient))];

        if (uniqueUserIds.length === 0) {
          this.isLoading = false;
          return;
        }

        forkJoin(
          uniqueUserIds.map(id => this.userService.getOne(id))
        ).subscribe({
          next: (users) => {
            users.forEach(u => {
              const id = u._id ?? '';
              const name = u.username ?? '(No Name)';
              if (id) this.usersMap.set(id, name);
            });
          },
          complete: () => this.isLoading = false,
          error: () => this.isLoading = false
        });
      },
      error: (err) => {
        alert(`Something went wrong: ${err}`);
        this.isLoading = false;
      }
    });
  }

  columnDefs = [
      { key: 'type', label: 'Type', cell: (n: Notification) => n.type ?? '' },
      { key: 'message', label: 'Message', cell: (n: Notification) => n.message },
      {
        key: 'user',
        label: 'User',
        cell: (n: Notification) =>
          this.usersMap.get(n.recipient) ?? '(loading...)'
      },
      { key: 'date', label: 'Date', cell: (n: Notification) => n.createdAt }
    ];
  

  getTypeLabel(type: string) {
    return TypeUtil.appointmentType(type)
  }

  getFullName(user: User) {
    return `${user.firstName} ${user.lastName}`
  }

  onDetails(id: string) {

    console.log('test')
    this.router.navigate([`/dentist/notification/details`, id])
  }

  onMarkAsRead(docId: string) {
    this.isLoading = true

    // for now it should load
    this.notificationService.markAsRead(docId).subscribe({
      error: (err) => alert(`Something went wrong: ${err}`),
    }).add(() => this.isLoading = false)
  }
}
