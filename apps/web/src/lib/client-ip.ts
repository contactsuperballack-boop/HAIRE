// The API rate-limits by client IP. The web app calls the API on behalf of every browser, so it must pass along
// the X-Forwarded-For that its own load balancer set; otherwise all users would share the web server's one IP.
// Anything that is not a plausible address list is dropped rather than forwarded.
const PLAUSIBLE = /^[0-9a-fA-F:., ]{1,200}$/;

export function forwardedForHeaders(value: string | null | undefined): Record<string, string> {
  return value && PLAUSIBLE.test(value) ? { 'x-forwarded-for': value } : {};
}
