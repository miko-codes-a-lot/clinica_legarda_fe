import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { UserSimple } from '../model/user-simple';
import { AuthService } from '../service/auth-service';
import { AuthGuard } from './auth-guard';

describe('AuthGuard', () => {
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

  const route = (data: Record<string, unknown> = {}) =>
    ({ data }) as unknown as ActivatedRouteSnapshot;

  const state = (url: string) =>
    ({ url }) as RouterStateSnapshot;

  function createGuard(user: UserSimple | null) {
    const authService = {
      currentUser$: of(user),
    } as unknown as AuthService;
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    return {
      guard: new AuthGuard(authService, router),
      router,
    };
  }

  it('blocks an anonymous direct visit to patient user settings', async () => {
    const { guard, router } = createGuard(null);

    const allowed = await firstValueFrom(
      guard.canActivate(route(), state('/app/user-settings/index')),
    );

    expect(allowed).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/app/login']);
  });

  it('allows a signed-in user through an authentication-only route', async () => {
    const { guard, router } = createGuard(signedInUser);

    const allowed = await firstValueFrom(
      guard.canActivate(route(), state('/app/user-settings/index')),
    );

    expect(allowed).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('retains role protection for signed-in users with the wrong role', async () => {
    const { guard, router } = createGuard(signedInUser);

    const allowed = await firstValueFrom(
      guard.canActivate(route({ role: 'admin' }), state('/admin/dashboard')),
    );

    expect(allowed).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/app/my-appointment']);
  });
});
