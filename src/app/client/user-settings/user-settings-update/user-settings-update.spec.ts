import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from '../../../_shared/service/alert.service';
import { AuthService } from '../../../_shared/service/auth-service';
import { UserService } from '../../../_shared/service/user-service';
import { UserSettingsUpdate } from './user-settings-update';

describe('UserSettingsUpdate', () => {
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
