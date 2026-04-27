/** Safe return path after login/register (from PrivateRoute state). */
export function redirectAfterAuth(state: unknown): string {
  const pathname = (state as { from?: { pathname?: string } })?.from?.pathname
  if (typeof pathname === 'string' && pathname.startsWith('/') && !pathname.startsWith('//')) return pathname
  return '/'
}
