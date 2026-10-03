import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { NotificationRecords } from './notification-records';
import { AuthService } from '../service/auth-service';
import { NotificationService } from '../service/notification-service';
import { UserSimple } from '../model/user-simple';
import { Notification, NotificationType } from '../model/notification';

describe('Notification inbox account ownership', () => {
  const actor = (id: string) => ({ _id: id, role: 'admin' } as UserSimple);
  const oldNotification: Notification = { _id: 'old', recipient: 'first', message: 'First account only', read: false, type: NotificationType.APPOINTMENT_CREATED, createdAt: '2026-10-03T01:00:00Z', updatedAt: '2026-10-03T01:00:00Z' };
  let actors: BehaviorSubject<UserSimple | null>;
  let requests: Subject<Notification[]>[];
  let inbox: NotificationRecords;
  beforeEach(() => {
    actors = new BehaviorSubject<UserSimple | null>(actor('first'));
    requests = [];
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { currentUser$: actors, get currentUserValue() { return actors.value; } } },
      { provide: NotificationService, useValue: {
        notifications$: new BehaviorSubject<Notification[]>([]),
        getAllNotifications: () => { const request = new Subject<Notification[]>(); requests.push(request); return request.asObservable(); },
      } },
    ] });
    inbox = TestBed.runInInjectionContext(() => new NotificationRecords());
    inbox.ngOnInit();
  });
  it('cancels the prior initial load when the actor changes', () => {
    actors.next(actor('second'));
    requests[0].next([oldNotification]);
    expect(inbox.rows).toEqual([]);
    expect(requests[0].observed).toBeFalse();
    expect(requests[1].observed).toBeTrue();
  });
  it('cancels a retry when the actor changes so prior private rows cannot return', () => {
    requests[0].complete();
    inbox.retry();
    actors.next(actor('second'));
    requests[1].next([oldNotification]);
    expect(inbox.rows).toEqual([]);
    expect(requests[1].observed).toBeFalse();
    expect(requests[2].observed).toBeTrue();
  });
});
