import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { AppointmentStatus } from '../../../_shared/model/appointment';
import { UserSimple } from '../../../_shared/model/user-simple';
import { AlertService } from '../../../_shared/service/alert.service';
import { AppointmentPayload } from '../../../admin/appointment/appointment-payload';
import { CLIENT_ROUTES } from '../../client.routes';
import { MyAppointment } from '../../my-appointment/my-appointment';
import { AppointmentCreate } from './appointment-create';

const patient: UserSimple = {
  _id: 'patient-1', firstName: 'Maria', middleName: '', lastName: 'Santos',
  emailAddress: 'maria@example.test', mobileNumber: '', address: 'Manila',
  operatingHours: [], role: 'user', username: 'maria.santos', createdAt: '', updatedAt: '',
};

describe('Patient navigation after booking', () => {
  let component: AppointmentCreate;
  let router: Router;
  let http: HttpTestingController;
  let booking: AppointmentPayload;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        AppointmentCreate, provideHttpClient(), provideHttpClientTesting(),
        // Use the real patient routes and guards without rendering the shell or its sockets.
        provideRouter([{ path: 'app', children: CLIENT_ROUTES[0].children }]),
      ],
    });
    component = TestBed.inject(AppointmentCreate);
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
    http.expectOne('/users/profile').flush(patient);
    await router.navigateByUrl('/app/appointment');
    booking = {
      clinic: 'clinic-1', patient: 'patient-1', dentist: 'dentist-1', services: ['service-1'],
      date: new Date(2026, 9, 5), startTime: '09:00', endTime: '09:30',
      status: AppointmentStatus.PENDING, notes: { patientNotes: '', clinicNotes: '' },
    };
  });

  afterEach(() => http.verify());

  it('opens the working appointment page only after the booking is saved', async () => {
    component.onSubmit(booking);
    const save = http.expectOne({ method: 'POST', url: '/appointments' });
    expect(router.url).toBe('/app/appointment');
    const navigated = firstValueFrom(router.events.pipe(filter(event => event instanceof NavigationEnd)));
    save.flush({ ...booking, _id: 'appointment-1', history: [] });
    await navigated;

    expect(router.url).toBe('/app/my-appointment');
    expect(router.routerState.snapshot.root.firstChild?.firstChild?.component).toBe(MyAppointment);
    expect(component.isLoading).toBeFalse();
  });

  it('keeps the patient on the booking page when saving fails', async () => {
    spyOn(TestBed.inject(AlertService), 'error');
    component.onSubmit(booking);
    http.expectOne({ method: 'POST', url: '/appointments' }).flush(
      { message: 'This time is no longer available.' }, { status: 409, statusText: 'Conflict' },
    );
    await Promise.resolve();

    expect(router.url).toBe('/app/appointment');
    expect(component.isLoading).toBeFalse();
  });

  it('takes an old appointment details link to the working appointment page', async () => {
    await router.navigateByUrl('/app/my-appointment/details/appointment-1');

    expect(router.url).toBe('/app/my-appointment');
    expect(router.routerState.snapshot.root.firstChild?.firstChild?.component).toBe(MyAppointment);
  });
});
