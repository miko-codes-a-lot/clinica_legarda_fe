import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AlertService } from '../../_shared/service/alert.service';
import { AuthService } from '../../_shared/service/auth-service';
import { ClinicService } from '../../_shared/service/clinic-service';
import { UiStateService } from '../../_shared/service/ui-state-service';
import { UserForm as AdminUserForm } from '../../admin/user/user-form/user-form';
import { RegistrationPage } from '../../client/registration/registration';
import { UserForm as SuperAdminUserForm } from '../../super-admin/user/user-form/user-form';
import { ResetPassword } from '../../_shared/component/reset-password/reset-password';

describe('password policy forms', () => {
  const formBuilder = new FormBuilder();
  const clinicService = {} as ClinicService;

  it('rejects each missing password requirement during registration', () => {
    const component = new RegistrationPage(formBuilder, clinicService);
    component.ngOnInit();

    const weakPasswords = [
      'Pass1!',
      'password1!',
      'PASSWORD1!',
      'Password!',
      'Password1',
    ];

    for (const password of weakPasswords) {
      component.password.setValue(password);
      expect(component.password.hasError('pattern')).withContext(password).toBeTrue();
    }

    component.password.setValue('Password1!');
    expect(component.password.valid).toBeTrue();
  });

  it('enforces the policy when an admin creates a user', () => {
    const component = new AdminUserForm(formBuilder, clinicService);
    component.ngOnInit();

    component.password.setValue('Password1');
    expect(component.password.hasError('pattern')).toBeTrue();

    component.password.setValue('Password1!');
    expect(component.password.valid).toBeTrue();
  });

  it('enforces the policy when a super admin creates a user', () => {
    const component = new SuperAdminUserForm(formBuilder, clinicService);
    component.ngOnInit();

    component.password.setValue('Password1');
    expect(component.password.hasError('pattern')).toBeTrue();

    component.password.setValue('Password1!');
    expect(component.password.valid).toBeTrue();
  });

  it('enforces the policy when a user resets a password', () => {
    history.replaceState({ emailAddress: 'patient@example.test' }, '');
    const component = new ResetPassword(
      formBuilder,
      {} as AuthService,
      {
        isLoading$: of(false),
      } as UiStateService,
      {} as Router,
      {} as AlertService,
    );
    component.ngOnInit();

    component.newPassword.setValue('Password1');
    expect(component.newPassword.hasError('pattern')).toBeTrue();

    component.newPassword.setValue('Password1!');
    expect(component.newPassword.valid).toBeTrue();
  });
});
