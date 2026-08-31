import { CLIENT_ROUTES } from './client.routes';

describe('CLIENT_ROUTES', () => {
  it('exposes the privacy policy without authentication', () => {
    const clientShell = CLIENT_ROUTES.find((route) => route.path === '');
    const privacyPolicy = clientShell?.children?.find(
      (route) => route.path === 'privacy-policy',
    );

    expect(privacyPolicy).toBeDefined();
    expect(privacyPolicy?.canActivate).toBeUndefined();
  });
});
