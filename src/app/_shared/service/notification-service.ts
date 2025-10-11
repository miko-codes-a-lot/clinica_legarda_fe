import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { MockService } from './mock-service';
import { io, Socket } from 'socket.io-client';
import { Notification } from '../model/notification';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket?: Socket
  private notifications$$ = new BehaviorSubject<Notification[]>([])

  public notifications$: Observable<Notification[]> = this.notifications$$.asObservable()


  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(
    private readonly mockService: MockService,
    private readonly http: HttpClient,
  ) {}

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

    this.socket.on('new_notification', (notification: Notification) => {
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
    // should be the body not ID
    return this.http.get<Notification[]>(this.apiUrl, { withCredentials: true });
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>('/notifications').pipe(
      tap(notifications => {
        // Once fetched, update the BehaviorSubject with the full list
        this.notifications$$.next(notifications);
      })
    );
  }

  getOne(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`/notifications/${id}/read`, {}).pipe(
      tap(updatedNotification => {
        // For a snappier UI, we update the local state immediately
        // instead of re-fetching the entire list.
        const currentNotifications = this.notifications$$.getValue();
        const updatedList = currentNotifications.map(n =>
          n._id === id ? { ...n, read: true } : n
        );
        this.notifications$$.next(updatedList);
      })
    );
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
