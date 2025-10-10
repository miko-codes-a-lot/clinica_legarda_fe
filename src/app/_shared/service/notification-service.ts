import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MockService } from './mock-service';
import { io, Socket } from 'socket.io-client';
import { Notification } from '../model/notification';
import { environment } from '../../../environments/environment';

export interface NotificationV2 {
  _id: string;
  recipient: string;
  message: string;
  read: boolean;
  type: string;
  link?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket?: Socket
  private notifications$$ = new BehaviorSubject<NotificationV2[]>([])
  public notifications$: Observable<NotificationV2[]> = this.notifications$$.asObservable()

  constructor(private readonly mockService: MockService) {}

  // call on login
  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(`${environment.apiUrl}/notifications`, {
      withCredentials: true,
    })

    this.socket.on('connect', () => {
      console.log('Successfully connected to WebSocket server.');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server. Reason:', reason);
    });

    this.socket.on('new_notification', (notification: NotificationV2) => {
      console.log('New notification received:', notification);

      // Get the current list of notifications and add the new one to the top
      const currentNotifications = this.notifications$$.getValue();
      this.notifications$$.next([notification, ...currentNotifications]);
    });
  }

  // call on logout
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

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
