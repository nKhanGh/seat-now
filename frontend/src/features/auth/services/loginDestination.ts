export async function loginDestination(
  role: 'USER' | 'ADMIN',
  returnTo: string,
  hasManagedVenues: () => Promise<boolean>,
): Promise<string> {
  if (role === 'ADMIN') return '/admin';
  try {
    if (await hasManagedVenues()) return '/business';
  } catch {
    // An optional owner lookup must not interrupt login.
  }
  return returnTo;
}
