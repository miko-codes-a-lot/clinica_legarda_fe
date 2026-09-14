import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { dentistAppointment, dentistUser } from '../../dentist/appointment/appointment-test-fixtures';
import { Appointment, AppointmentStatus } from '../model/appointment';
import { UserSimple } from '../model/user-simple';
import { AppointmentService } from '../service/appointment-service';
import { AuthService } from '../service/auth-service';
import { ClinicService } from '../service/clinic-service';
import { StaffAppointmentList } from './staff-appointment-list';

describe('Staff appointment account state', () => {
  const admin: UserSimple = { ...dentistUser, _id: 'admin-1', role: 'admin' };
  const appointment = dentistAppointment();
  let users: BehaviorSubject<UserSimple | null>;
  let requests: Subject<Appointment[]>[];
  let list: StaffAppointmentList;

  beforeEach(() => {
    users = new BehaviorSubject<UserSimple | null>(admin);
    requests = [];
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { currentUser$: users.asObservable() } },
      { provide: Router, useValue: {} },
      { provide: ClinicService, useValue: { getAll: () => of([appointment.clinic]) } },
      { provide: AppointmentService, useValue: { getAll: () => {
        const request = new Subject<Appointment[]>();
        requests.push(request);
        return request.asObservable();
      } } },
    ] });
    // Exercise account-bound RxJS state only: no component fixture or rendered UI.
    list = TestBed.runInInjectionContext(() => new StaffAppointmentList());
    list.ngOnInit();
  });

  function respond(request: Subject<Appointment[]>, records = [appointment]): void {
    request.next(records);
    request.complete();
  }

  it('clears account state immediately and cancels the prior request before loading another staff account', () => {
    respond(requests[0]);
    list.selectClinic('clinic-1');
    list.selectStatus(AppointmentStatus.CONFIRMED);
    list.dataSource.filter = 'maria';
    list.refresh();
    const previousRequest = requests[1];
    list.loadError = 'Previous account failure';

    users.next({ ...admin, _id: 'super-admin-2', role: 'super-admin' });
    expect(previousRequest.observed).toBeFalse();
    expect(list.selectedClinic).toBe('all');
    expect(list.selectedStatus).toBe('all');
    expect(list.dataSource.filter).toBe('');
    expect(list.dataSource.data).toEqual([]);
    expect(list.clinics).toEqual([]);
    expect(list.loadError).toBe('');
    expect(list.isLoading).toBeTrue();
    respond(previousRequest, [{ ...appointment, _id: 'stale-response' }]);
    expect(list.dataSource.data).toEqual([]);
    respond(requests[2], [{ ...appointment, _id: 'current-response' }]);
    expect(list.dataSource.data.map(record => record._id)).toEqual(['current-response']);
    expect(list.clinics).toEqual([appointment.clinic]);
    expect(list.isLoading).toBeFalse();
  });

  it('preserves filters on same-account updates and refresh, but clears and stops requests when staff access ends', () => {
    respond(requests[0]);
    list.selectClinic('clinic-1');
    list.selectStatus(AppointmentStatus.CONFIRMED);
    list.dataSource.filter = 'maria';
    users.next({ ...admin, firstName: 'Updated' });
    expect(requests.length).toBe(1);
    list.refresh();
    respond(requests[1]);
    expect(list.selectedClinic).toBe('clinic-1');
    expect(list.selectedStatus).toBe(AppointmentStatus.CONFIRMED);
    expect(list.dataSource.filter).toBe('maria');
    expect(list.dataSource.data).toEqual([appointment]);
    list.refresh();
    const previousRequest = requests[2];
    users.next({ ...admin, role: 'dentist' });
    expect(previousRequest.observed).toBeFalse();
    expect(list.dataSource.data).toEqual([]);
    expect(list.selectedClinic).toBe('all');
    expect(list.selectedStatus).toBe('all');
    expect(list.dataSource.filter).toBe('');
    expect(list.isLoading).toBeFalse();
    list.refresh();
    users.next(null);
    list.refresh();
    expect(requests.length).toBe(3);
  });
});
