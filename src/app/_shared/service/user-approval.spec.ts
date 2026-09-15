import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user-service';

describe('Dentist approval request', () => {
  it('sends only the approval action with credentials and returns the saved account', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(UserService);
    const http = TestBed.inject(HttpTestingController);
    const saved = jasmine.createSpy('saved');
    service.approveDentist('dentist-1').subscribe(saved);
    const request = http.expectOne('/users/dentist-1/approve-dentist');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    expect(request.request.withCredentials).toBeTrue();
    const account = { _id: 'dentist-1', role: 'dentist', status: 'confirmed', clinics: ['clinic-1'] };
    request.flush(account);
    expect(saved).toHaveBeenCalledOnceWith(account);
    http.verify();
  });
});
