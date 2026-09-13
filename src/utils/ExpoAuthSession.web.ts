export function makeRedirectUri(): string {
  return typeof window === 'undefined' ? '' : window.location.origin;
}
