import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from './notification-service';
import { httpInterceptor } from '../interceptor/http-interceptor';
import { environment } from '../../../environments/environment';
import { Notification, NotificationType } from '../model/notification';

describe('Notification state', () => {
  let service: NotificationService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([httpInterceptor])), provideHttpClientTesting()] });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('adds the API prefix only once when loading notifications', () => {
    service.getAll().subscribe();
    const request = http.expectOne(`${environment.apiUrl}/notifications`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
  it('clears the signed-out user’s notifications before another session', () => {
    let values: Notification[] = [];
    service.notifications$.subscribe(list => values = list);
    service.getAllNotifications().subscribe();
    http.expectOne(`${environment.apiUrl}/notifications`).flush([{
      _id: 'n1', recipient: 'd1', message: 'Appointment cancelled', read: false,
      type: NotificationType.APPOINTMENT_STATUS_UPDATED, createdAt: '2026-09-07T01:00:00Z', updatedAt: '2026-09-07T01:00:00Z',
    }]);
    expect(values.length).toBe(1);
    service.disconnect();
    expect(values).toEqual([]);
  });
});
