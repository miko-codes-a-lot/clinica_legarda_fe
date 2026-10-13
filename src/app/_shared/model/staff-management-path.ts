/** Shared staff screens stay within the active role's route tree. */
export function staffManagementPath(url: string): '/super-admin' | '/admin' {
  return url.startsWith('/super-admin/') || url === '/super-admin' ? '/super-admin' : '/admin';
}
