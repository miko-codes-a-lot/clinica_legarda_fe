import { LoginPatient } from '../../login-patient/login-patient';
import { UiStateService } from '../../../_shared/service/ui-state-service';
import { UserSimple } from '../../../_shared/model/user-simple';
import { UserStatus } from '../../../_shared/model/user';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from '../../../_shared/service/alert.service';
import { AuthService } from '../../../_shared/service/auth-service';
import { UserService } from '../../../_shared/service/user-service';
import { UserSettingsUpdate } from './user-settings-update';
import { BehaviorSubject, of, throwError } from 'rxjs';

describe('UserSettingsUpdate', () => {
  function readyToSave() {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(new Promise<boolean>(() => {}));
    const users = jasmine.createSpyObj<UserService>('UserService', ['update']);
    const alerts = jasmine.createSpyObj<AlertService>('AlertService', ['success', 'error']);
    const fb = new FormBuilder();
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['checkAuthStatus']);
    const component = new UserSettingsUpdate(fb, auth, router, users, alerts);
    component.id = 'patient-id';
    component.user = { role: 'patient', username: 'patient' };
    component.profileForm = fb.group({ firstName: 'Alex', lastName: 'Rivera', emailAddress: 'alex@example.test', mobileNumber: '+639171234567', address: 'Manila', role: 'patient' });
    return { component, router, users, alerts };
  }

  it('returns a saved patient profile to patient settings without an admin redirect', () => {
    const { component, router, users, alerts } = readyToSave();
    users.update.and.returnValue(of({ firstName: 'Alex', middleName: '', lastName: 'Rivera', emailAddress: 'alex@example.test', mobileNumber: '+639171234567', address: 'Manila', operatingHours: [], appointments: [], role: 'patient' }));

    component.onSave();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/app/user-settings/index']);
    expect(alerts.success).toHaveBeenCalledWith('Successfully updated');
    expect(component.isLoading).toBeFalse();
  });

  it('keeps the patient on the form and clears saving state after a rejected update', () => {
    const { component, router, users, alerts } = readyToSave();
    users.update.and.returnValue(throwError(() => ({ error: { message: 'Update rejected' } })));

    component.onSave();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(alerts.error).toHaveBeenCalledWith('Update rejected');
    expect(component.isLoading).toBeFalse();
  });

  it('returns a patient to patient settings when editing is cancelled', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const component = new UserSettingsUpdate(
      new FormBuilder(),
      {} as AuthService,
      router,
      {} as UserService,
      {} as AlertService,
    );

    component.cancelEdit();

    expect(router.navigate).toHaveBeenCalledOnceWith([
      '/app/user-settings/index',
    ]);
  });
});


it('leaves profile refresh navigation to the current screen after patient login was destroyed', () => {
  const user = new BehaviorSubject<UserSimple | null>(null);
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const login = new LoginPatient({ isLoading$: of(false) } as UiStateService,
    { currentUser$: user.asObservable() } as AuthService, new FormBuilder(), router, {} as AlertService);
  login.ngOnInit();
  login.ngOnDestroy();
  user.next({ role: 'user', status: UserStatus.CONFIRMED } as UserSimple);
  expect(router.navigate).not.toHaveBeenCalled();
});
