import { CriteriaRatings } from '../types/review';

interface VerificationInput {
  photoUri: string | null;
  criteriaRatings: CriteriaRatings;
  comment: string;
  locationId: string;
}

interface VerificationResult {
  status: 'verified' | 'rejected';
  notes: string | null;
}

// AC-83: Check uploaded image
const checkImage = (photoUri: string | null): string | null => {
  if (!photoUri) return null; // photo is optional — absence isn't a failure
  const validExtensions = /\.(jpg|jpeg|png)$/i;
  if (!validExtensions.test(photoUri)) {
    return 'Photo does not appear to be a valid image file.';
  }
  return null;
};

// AC-84: Validate required information
const checkRequiredInfo = (input: VerificationInput): string[] => {
  const issues: string[] = [];

  if (!input.locationId) issues.push('Missing location reference.');
  if (!input.comment || input.comment.trim().length === 0) {
    issues.push('Review comment is empty.');
  }

  const allRated = Object.values(input.criteriaRatings).every(
    (v) => Number.isInteger(v) && v >= 1 && v <= 5
  );
  if (!allRated) issues.push('One or more accessibility criteria are not rated 1–5.');

  return issues;
};

export const verifySubmission = (input: VerificationInput): VerificationResult => {
  const imageIssue = checkImage(input.photoUri);
  const infoIssues = checkRequiredInfo(input);

  const allIssues = [imageIssue, ...infoIssues].filter((x): x is string => x !== null);

  if (allIssues.length > 0) {
    return { status: 'rejected', notes: allIssues.join(' ') };
  }
  return { status: 'verified', notes: null };
};