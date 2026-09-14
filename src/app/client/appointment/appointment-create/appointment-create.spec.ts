import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Clinic } from '../../../_shared/model/clinic';
import { UserSimple } from '../../../_shared/model/user-simple';
import { AppointmentCreate } from './appointment-create';

const signedInPatient: UserSimple = {
  _id: 'patient-1', firstName: 'Maria', middleName: '', lastName: 'Santos',
  emailAddress: 'maria@example.test', mobileNumber: '', address: 'Manila',
  operatingHours: [], role: 'user', username: 'maria.santos',
  createdAt: '', updatedAt: '',
};
const clinic: Clinic = {
  _id: 'clinic-1', name: 'Test Clinic', address: 'Manila', mobileNumber: '',
  emailAddress: '', operatingHours: [], dentists: [],
};

describe('AppointmentCreate session restoration', () => {
  let fixture: ComponentFixture<AppointmentCreate>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentCreate],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AppointmentCreate);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify({ ignoreCancelled: true });
  });

  it('shows a loading state instead of asking for login while the session is unresolved', () => {
    expect(fixture.nativeElement.querySelector('.login-required')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    http.expectOne('/users/profile').flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('loads and displays the booking form after a delayed signed-in profile response', () => {
    http.expectOne('/users/profile').flush(signedInPatient);
    http.expectOne('/dental-catalog').flush([]);
    http.expectOne('/clinics').flush([clinic]);
    http.expectNone('/users');
    fixture.detectChanges();
    http.expectOne('/appointments').flush([]);
    http.expectOne('/reasons').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-appointment')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.login-required')).toBeNull();
    const patientInput: HTMLInputElement = fixture.nativeElement.querySelector('input[readonly]');
    expect(patientInput.value.trim()).toBe('Maria Santos');
  });

  it('does not ask a signed-in patient to log in while booking data is loading', () => {
    http.expectOne('/users/profile').flush(signedInPatient);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-required')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    http.expectOne('/dental-catalog').flush([]);
    http.expectOne('/clinics').flush([]);
    http.expectNone('/users');
  });

  it('offers login after the profile request confirms there is no session', () => {
    http.expectOne('/users/profile').flush(null, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-required')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    http.expectNone('/clinics');
  });

  it('shows an empty booking state when a signed-in patient has no clinics available', () => {
    http.expectOne('/users/profile').flush(signedInPatient);
    http.expectOne('/dental-catalog').flush([]);
    http.expectOne('/clinics').flush([]);
    http.expectNone('/users');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-required')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No clinics');
  });

  it('shows a booking error without claiming the patient has signed out', () => {
    http.expectOne('/users/profile').flush(signedInPatient);
    http.expectOne('/dental-catalog').flush([], { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-required')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});
