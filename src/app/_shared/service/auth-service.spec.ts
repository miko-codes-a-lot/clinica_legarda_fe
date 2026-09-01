import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { UserSimple } from '../model/user-simple';
import { AuthService } from './auth-service';
import { MockService } from './mock-service';

describe('AuthService', () => {
  const signedInUser: UserSimple = {
    _id: 'user-1',
    firstName: 'Maria',
    middleName: '',
    lastName: 'Santos',
    emailAddress: 'maria@example.test',
    mobileNumber: '+639171112101',
    address: 'Manila',
    operatingHours: [],
    role: 'user',
    username: 'maria.santos',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  function createService(profileResponse: Subject<UserSimple>) {
    const http = {
      get: () => profileResponse,
    } as unknown as HttpClient;
    const mockService = {
      mockUser: () => signedInUser,
    } as unknown as MockService;

    return new AuthService(mockService, http);
  }

  it('waits for the initial profile request before publishing auth state', () => {
    const profileResponse = new Subject<UserSimple>();
    const service = createService(profileResponse);
    const emissions: Array<UserSimple | null> = [];
    service.currentUser$.subscribe((user) => emissions.push(user));

    expect(emissions).toEqual([]);

    profileResponse.next(signedInUser);

    expect(emissions).toEqual([signedInUser]);
  });

  it('publishes anonymous state after the initial profile request fails', () => {
    const profileResponse = new Subject<UserSimple>();
    const service = createService(profileResponse);
    const emissions: Array<UserSimple | null> = [];
    service.currentUser$.subscribe((user) => emissions.push(user));

    profileResponse.error(new Error('Unauthorized'));

    expect(emissions).toEqual([null]);
  });
});
