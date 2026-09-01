import 'server-only';

import { AWARD_TYPE_CODES, AWARDING_AGENCY } from '@/lib/constants';

const API = 'https://api.usaspending.gov/api/v2';

/** How long a live response is reused before the next request refetches. */
export const LATEST_REVALIDATE_SECONDS = 300;

/** How far back to look for recent activity. */
const LOOKBACK_DAYS = 45;

export interface LatestAward {
  id: string;
  awardId: string;
  recipient: string;
  subAgency: string | null;
  amount: number;
  /** ISO date the record was last modified — the best available proxy for
   *  when the action reached USASpending. */
  lastModified: string | null;
  startDate: string | null;
  description: string | null;
}

export interface LatestAwardsResult {
  awards: LatestAward[];
  fetchedAt: string;
  /** Days between today and the freshest record — the real source lag. */
  sourceLagDays: number | null;
  error: string | null;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Most recently updated DoD prime contract actions.
 *
 * One request, unlike the six-year aggregate's ~750, which is what makes this
 * cheap enough to run per request rather than in a scheduled job.
 */
export async function getLatestAwards(limit = 25): Promise<LatestAwardsResult> {
  const fetchedAt = new Date().toISOString();
  const body = {
    filters: {
      time_period: [{ start_date: isoDaysAgo(LOOKBACK_DAYS), end_date: isoDaysAgo(0) }],
      agencies: [AWARDING_AGENCY],
      award_type_codes: AWARD_TYPE_CODES,
    },
    fields: [
      'Award ID',
      'Recipient Name',
      'Awarding Sub Agency',
      'Award Amount',
      'Start Date',
      'Last Modified Date',
      'Description',
    ],
    // Newest activity first. Start Date sorts to future-dated awards, which is
    // not the same question.
    sort: 'Last Modified Date',
    order: 'desc',
    limit,
    page: 1,
  };

  try {
    const response = await fetch(`${API}/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Next caches and revalidates this on a timer, so the upstream API sees
      // at most one request per window regardless of traffic.
      next: { revalidate: LATEST_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return {
        awards: [],
        fetchedAt,
        sourceLagDays: null,
        error: `USASpending returned ${response.status}`,
      };
    }

    const json = (await response.json()) as { results?: Record<string, unknown>[] };
    const awards: LatestAward[] = (json.results ?? []).map((row) => ({
      id: String(row.generated_internal_id ?? row.internal_id ?? row['Award ID']),
      awardId: String(row['Award ID'] ?? ''),
      recipient: String(row['Recipient Name'] ?? 'Unknown'),
      subAgency: (row['Awarding Sub Agency'] as string) ?? null,
      amount: typeof row['Award Amount'] === 'number' ? row['Award Amount'] : 0,
      lastModified: (row['Last Modified Date'] as string) ?? null,
      startDate: (row['Start Date'] as string) ?? null,
      description: (row['Description'] as string) ?? null,
    }));

    const newest = awards.find((a) => a.lastModified)?.lastModified ?? null;
    const sourceLagDays = newest
      ? Math.max(0, Math.round((Date.now() - new Date(newest.slice(0, 10)).getTime()) / 86_400_000))
      : null;

    return { awards, fetchedAt, sourceLagDays, error: null };
  } catch (error) {
    // The API drops connections under load. A stale-but-honest page beats a
    // 500, so the caller renders the error rather than throwing.
    return {
      awards: [],
      fetchedAt,
      sourceLagDays: null,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}
