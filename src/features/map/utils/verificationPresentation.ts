import type { CommunityVerificationSummary } from '../types/placeDetails';

export function formatVerifiedDate(value: string | null): string {
  if (!value) return 'Not yet verified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Verification date unavailable';
  return new Intl.DateTimeFormat('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Colombo',
  }).format(date);
}

export function verificationStatusLabel(
  verification: CommunityVerificationSummary | null,
): string {
  if (!verification || verification.status === 'unavailable') return 'Verification unavailable';
  if (verification.status === 'verified') return 'Community verified';
  return 'Not yet community verified';
}
