import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCalendarHarness } from '@angular/material/datepicker/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Appointment, AppointmentStatus } from '../../_shared/model/appointment';
import { Clinic } from '../../_shared/model/clinic';
import { User, UserStatus } from '../../_shared/model/user';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { AuthService } from '../../_shared/service/auth-service';
import { AppointmentPage } from './appointment';

describe('Patient branch schedule selection', () => {
  const operatingHours = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .map(day => ({ day, startTime: '09:00', endTime: '17:00' }));
  const clinics: Clinic[] = ['source', 'receiving'].map(id => ({
    _id: id, name: `${id} clinic`, address: '', mobileNumber: '', emailAddress: '', operatingHours, dentists: [],
  }));
  const patient: User = {
    _id: 'patient', firstName: 'Test', middleName: '', lastName: 'Patient', role: 'user',
    status: UserStatus.CONFIRMED, emailAddress: 'patient@example.test', mobileNumber: '',
    address: '', operatingHours: [], appointments: [],
  };
  const dentists: User[] = clinics.map(clinic => ({
    ...patient, _id: `${clinic._id}-dentist`, role: 'dentist', clinics: [clinic._id!], operatingHours,
  }));
  let fixture: ComponentFixture<AppointmentPage>;
  let root: HTMLElement;
  let http: HttpTestingController;

  function availability(dentist: string, clinic: string) {
    http.expectOne(`/appointments/availability/${dentist}`).flush([]);
    http.expectOne(request => request.url === '/clinic-closures/availability' && request.params.get('clinic') === clinic).flush([]);
    http.expectOne(request => request.url === `/dentist-availability/${dentist}/public` && request.params.get('clinic') === clinic).flush([]);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService);
    http.expectOne('/users/profile').flush(patient);
    fixture = TestBed.createComponent(AppointmentPage);
    root = fixture.nativeElement;
    fixture.componentRef.setInput('appointment', TestBed.inject(AppointmentService).getEmptyNonNullDoc());
    fixture.componentRef.setInput('clinics', clinics);
    fixture.componentRef.setInput('dentalServices', [{ _id: 'cleaning', name: 'Cleaning', duration: 30 }]);
    fixture.detectChanges();
    const previous: Appointment = {
      _id: 'previous', patient, dentist: dentists[0], clinic: clinics[0], date: new Date('2026-01-01'),
      startTime: '09:00', endTime: '09:30', services: [{ _id: 'cleaning', name: 'Cleaning', duration: 30 }],
      status: AppointmentStatus.COMPLETED, notes: { patientNotes: '', clinicNotes: '' }, history: [],
    };
    http.expectOne('/appointments').flush([previous]);
    http.expectOne('/dependents').flush([]);
    http.expectOne('/users/dentists').flush(dentists);
    availability('source-dentist', 'source');
    fixture.detectChanges();
  });

  afterEach(() => { fixture.destroy(); http.verify(); });

  async function switchBranch() {
    const component = fixture.componentInstance;
    component.clinic.setValue('receiving');
    fixture.detectChanges();
    const dialog = TestBed.inject(MatDialog).openDialogs[0];
    const closed = firstValueFrom(dialog.afterClosed());
    dialog.close(true); await closed;
    http.expectOne('/users/dentists').flush(dentists);
    component.dentist.setValue('receiving-dentist');
    availability('receiving-dentist', 'receiving');
    component.services.setValue(['cleaning']);
    fixture.detectChanges();
    return component;
  }

  async function chooseDay() {
    const calendar = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatCalendarHarness);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getMonth() !== new Date().getMonth()) await calendar.next();
    await calendar.selectCell({ text: String(tomorrow.getDate()) });
    fixture.detectChanges();
    return tomorrow;
  }

  it('lets a patient choose receiving dates and times before entering the required referral reason', async () => {
    const component = await switchBranch();
    const submitted = jasmine.createSpy('booking'); component.onSubmitEvent.subscribe(submitted);
    expect(component.isChangeBranch).toBeTrue();
    expect(component.reason.invalid).toBeTrue();
    const tomorrow = await chooseDay();
    expect(component.date.value?.getDate()).toBe(tomorrow.getDate());
    const time = Array.from(root.querySelectorAll<HTMLButtonElement>('button.slot'))
      .find((button: HTMLButtonElement) => button.textContent?.includes('9:00 AM'));
    expect(time?.disabled).toBeFalse(); time?.click(); fixture.detectChanges();
    expect(component.time.value).toBe('09:00');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBeTrue();
    component.onSubmit();
    expect(submitted).not.toHaveBeenCalled();
    http.expectNone('/referrals');

    component.reason.setValue('Continue treatment at the other branch'); fixture.detectChanges();
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBeFalse();
    component.onSubmit();
    const referral = http.expectOne('/referrals');
    expect(referral.request.body).toEqual(jasmine.objectContaining({ patient: 'patient', fromDoctorId: 'source-dentist', fromClinicId: 'source' }));
    referral.flush({ _id: 'new-referral' });
    expect(submitted).toHaveBeenCalledWith(jasmine.objectContaining({ clinic: 'receiving', dentist: 'receiving-dentist', referral: 'new-referral', startTime: '09:00' }));
  });

  it('keeps time choices usable when the referral reason is cleared, while still preventing submission', async () => {
    const component = await switchBranch();
    component.reason.setValue('Continue treatment at the other branch'); fixture.detectChanges();
    await chooseDay();
    component.reason.setValue(''); fixture.detectChanges();
    const time = Array.from(root.querySelectorAll<HTMLButtonElement>('button.slot'))
      .find((button: HTMLButtonElement) => button.textContent?.includes('10:00 AM'));
    expect(time?.disabled).toBeFalse(); time?.click(); fixture.detectChanges();
    expect(component.time.value).toBe('10:00');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBeTrue();
  });

  it('blocks calendar interactions while a booking submission is in progress', async () => {
    const component = await switchBranch();
    component.reason.setValue('Continue treatment at the other branch'); fixture.detectChanges();
    component.isLoading = true; fixture.detectChanges();
    await chooseDay();
    expect(component.date.value).toBeNull();
    expect(component.time.value).toBe('');
  });
});
