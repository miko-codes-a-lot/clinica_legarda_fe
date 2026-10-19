import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { BookingCalendar } from '../../_shared/component/booking-calendar/booking-calendar';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { AuthService } from '../../_shared/service/auth-service';
import { MockService } from '../../_shared/service/mock-service';
import { AppointmentPage } from './appointment';

describe('Patient appointment booking form', () => {
  let fixture: ComponentFixture<AppointmentPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService);
    http.expectOne('/users/profile').flush({
      _id: 'patient-1', firstName: 'Maria', middleName: '', lastName: 'Santos',
      emailAddress: 'maria@example.test', mobileNumber: '', address: 'Manila',
      operatingHours: [], role: 'user', status: 'confirmed', username: 'maria.santos', createdAt: '', updatedAt: '',
    });
    fixture = TestBed.createComponent(AppointmentPage);
    fixture.componentRef.setInput('appointment', TestBed.inject(AppointmentService).getEmptyNonNullDoc());
    fixture.componentRef.setInput('clinics', [{
      _id: 'clinic-1', name: 'Clinic', address: 'Manila', mobileNumber: '',
      emailAddress: '', operatingHours: TestBed.inject(MockService).mockClinicBase().operatingHours, dentists: [],
    }]);
    fixture.componentRef.setInput('dentalServices', [{ _id: 'service-1', name: 'Cleaning', duration: 30 }]);
    fixture.detectChanges();
    http.expectOne('/appointments').flush([]);
    http.expectNone('/reasons');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify();
  });

  it('enables Save after valid appointment choices without leaving date or time invalid', () => {
    const component = fixture.componentInstance;
    const dentist = TestBed.inject(MockService).mockUserBase();
    component.clinic.setValue('clinic-1');
    http.expectOne('/users/dentists').flush([{ ...dentist, _id: 'dentist-1', clinic: 'clinic-1', role: 'dentist', status: 'confirmed' }]);
    component.dentist.setValue('dentist-1');
    http.expectOne('/appointments/availability/dentist-1').flush([]);
    http.expectOne(request => request.url === '/clinic-closures/availability').flush([]);
    http.expectOne(request => request.url === '/dentist-availability/dentist-1/public').flush([]);
    component.services.setValue(['service-1']);
    fixture.detectChanges();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const calendar: BookingCalendar = fixture.debugElement.query(By.directive(BookingCalendar)).componentInstance;
    calendar.selectDate(tomorrow);
    fixture.detectChanges();
    calendar.selectTime(calendar.slots.find(slot => slot.value === '13:00')!);
    fixture.detectChanges();

    expect(component.date.valid).toBeTrue();
    expect(component.time.valid).toBeTrue();
    const save: HTMLButtonElement = fixture.nativeElement.querySelector('app-form button');
    expect(save.disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('.mat-form-field-invalid')).toBeNull();
    component.services.setValue([]);
    expect(component.time.value).toBe('');
  });

  it('cancels stale dentist availability requests and clears schedule choices on clinic change', () => {
    const component = fixture.componentInstance, dentist = TestBed.inject(MockService).mockUserBase();
    component.clinic.setValue('clinic-1');
    http.expectOne('/users/dentists').flush([{ ...dentist, _id: 'dentist-1', clinic: 'clinic-1', role: 'dentist', status: 'confirmed' }]);
    component.dentist.setValue('dentist-1');
    const slots = http.expectOne('/appointments/availability/dentist-1');
    const closures = http.expectOne(request => request.url === '/clinic-closures/availability');
    const days = http.expectOne(request => request.url === '/dentist-availability/dentist-1/public');
    component.date.setValue(new Date()); component.time.setValue('13:00'); component.clinic.setValue('');
    expect(slots.cancelled && closures.cancelled && days.cancelled).toBeTrue();
    expect(component.bookingSchedule).toBeUndefined(); expect(component.date.value).toBeNull(); expect(component.time.value).toBe('');
  });
  it('accepts a new plain-text referral reason and rejects blank or short text', () => {
    const reason = fixture.componentInstance.reason;
    for (const value of ['  ', 'ab', 'a'.repeat(501)]) { reason.setValue(value); expect(reason.invalid).toBeTrue(); }
    reason.setValue('Please continue care at the other clinic'); expect(reason.valid).toBeTrue();
  });
});
