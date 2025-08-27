import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockService } from './mock-service';
import { Notification } from '../model/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private readonly mockService: MockService) {}

  getAll(): Observable<Notification[]> {
    return new Observable((s) => {
      setTimeout(() => {
        const notification = this.mockService.mockNotification()

        s.next([notification])
        s.complete()
      }, 1000);
    })
  }

  getOne(id: string): Observable<Notification> {
    return new Observable((s) => {
      setTimeout(() => {
        const notification = this.mockService.mockNotification()

        s.next(notification)
        s.complete()
      }, 1000);
    })
  }

  markAsRead(docId: string): Observable<Notification> {
    return new Observable((s) => {
      setTimeout(() => {
        const notification = this.mockService.mockNotification()
        notification.isRead = true

        s.next(notification)
        s.complete()
      }, 1000);
    })
  }

  create(createdBy: string, targetUser: string): Observable<Notification> {
    return new Observable((s) => {
      setTimeout(() => {
        const notification = this.mockService.mockNotification()

        s.next(notification)
        s.complete()
      }, 1000);
    })
  }
}
