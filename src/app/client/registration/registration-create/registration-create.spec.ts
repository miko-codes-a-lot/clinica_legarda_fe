import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AlertService } from '../../../_shared/service/alert.service';
import { RegistrationPage } from '../registration';
import { RegistrationCreate } from './registration-create';

describe('Public patient registration', () => {
  let fixture: ComponentFixture<RegistrationCreate>;
  let form: RegistrationPage;
  let http: HttpTestingController;
  let navigate: jasmine.Spy;

  beforeEach(async () => {
    navigate = jasmine.createSpy('navigate');
    await TestBed.configureTestingModule({
      imports: [RegistrationCreate],
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
        { provide: AlertService, useValue: { error: jasmine.createSpy('error') } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RegistrationCreate);
    fixture.detectChanges();
    form = fixture.debugElement.query(By.directive(RegistrationPage)).componentInstance;
    http = TestBed.inject(HttpTestingController);
    form.rxform.patchValue({
      firstName: 'Jamie', middleName: '', lastName: 'Flores', username: 'jamie.flores',
      emailAddress: 'jamie.flores@example.test', mobileNumber: '+639171113002',
      address: 'Manila', password: 'Password1!', passwordConfirm: 'Password1!',
    });
  });

  afterEach(() => http.verify());

  it('submits a valid patient role with the form details and proceeds to sign in', () => {
    expect(form.rxform.valid).toBeTrue();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    const request = http.expectOne('/users/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      firstName: 'Jamie', middleName: '', lastName: 'Flores', username: 'jamie.flores',
      emailAddress: 'jamie.flores@example.test', mobileNumber: '+639171113002',
      address: 'Manila', password: 'Password1!', role: 'user', status: 'pending', operatingHours: [],
    });
    request.flush({ role: 'user', status: 'pending' });
    expect(navigate).toHaveBeenCalledWith(['/app/login']);
    expect(fixture.componentInstance.isLoading).toBeFalse();
  });

  it('keeps registration a patient request even if the hidden form role is altered', () => {
    form.role.setValue('super-admin');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    const request = http.expectOne('/users/register');
    expect(request.request.body.role).toBe('user');
    request.flush({ role: 'user', status: 'pending' });
  });
});
