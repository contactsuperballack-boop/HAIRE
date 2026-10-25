// Which API paths the browser may reach through the proxy, and which requests count as same-origin.
// Login and logout are deliberately excluded: they have dedicated routes that manage the session cookie.
const ALLOWED = /^(jobs|profiles|applications|public\/jobs|auth\/(tenant|me))(\/|$)/;

export function isAllowedPath(path: string[]): boolean {
  const joined = path.join('/');
  return !joined.includes('..') && ALLOWED.test(joined);
}

export function isSameOrigin(origin: string | null, host: string): boolean {
  if (!origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
