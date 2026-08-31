export type EvidenceFreshnessKey = 'current' | 'review-due' | 'stale' | 'not-applicable';

export interface EvidenceFreshness {
  key: EvidenceFreshnessKey;
  label: string;
}

const DAY_MS = 86_400_000;
const REVIEW_GRACE_DAYS = 90;

const parseDateOnly = (value: string) => Date.parse(`${value}T00:00:00Z`);

export function deriveEvidenceFreshness(nextReview: string | null | undefined, referenceDate = new Date()): EvidenceFreshness {
  if (!nextReview) return { key: 'not-applicable', label: '更新対象外' };
  const reviewAt = parseDateOnly(nextReview);
  const referenceAt = Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate());
  if (!Number.isFinite(reviewAt)) throw new Error(`Invalid nextReview date: ${nextReview}`);
  if (referenceAt <= reviewAt) return { key: 'current', label: '更新期限内' };
  if (referenceAt <= reviewAt + REVIEW_GRACE_DAYS * DAY_MS) return { key: 'review-due', label: '再確認期限超過' };
  return { key: 'stale', label: '情報が古い可能性' };
}
