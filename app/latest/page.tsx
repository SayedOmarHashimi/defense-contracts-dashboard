import type { Metadata } from 'next';
import Link from 'next/link';

import StatTile from '@/components/StatTile';
import { formatCount, formatExactUsd } from '@/lib/format';
import { LATEST_REVALIDATE_SECONDS, getLatestAwards } from '@/lib/usaspending';

const DESCRIPTION =
  'The most recently updated Department of Defense prime contract actions, queried live from USASpending.gov.';

export const metadata: Metadata = {
  title: 'Latest awards',
  description: DESCRIPTION,
  openGraph: {
    title: 'Latest awards — Defense Contracts Dashboard',
    description: DESCRIPTION,
    url: '/latest',
    type: 'article',
  },
};

// Unlike every other route, this page is not baked at build time. It is
// regenerated on demand at most once per window, so it tracks USASpending
// without a rebuild or a commit.
export const revalidate = LATEST_REVALIDATE_SECONDS;

function relativeDay(iso: string | null): string {
  if (!iso) return '—';
  const days = Math.round((Date.now() - new Date(iso.slice(0, 10)).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export default async function LatestPage() {
  const { awards, fetchedAt, sourceLagDays, error } = await getLatestAwards(30);

  return (
    <main className="mx-auto max-w-[1024px] px-6 pt-12">
      <Link href="/" className="text-sm text-neutral-800 underline">
        &larr; Back to leaderboard
      </Link>

      <h1 className="mt-[18px] text-[40px] [text-wrap:balance]">Latest awards</h1>
      <p className="mt-2.5 max-w-[48rem] text-[15px] leading-[1.6] text-neutral-800 [text-wrap:pretty]">
        The most recently updated {formatCount(awards.length)} Department of Defense prime contract
        actions, queried from USASpending.gov when you loaded this page rather than baked in at
        build time.
      </p>

      <dl className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        <StatTile
          description
          size="text"
          label="Checked"
          value={
            <time dateTime={fetchedAt}>
              {new Date(fetchedAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC',
              })}{' '}
              UTC
            </time>
          }
          detail={`Refreshes at most every ${Math.round(LATEST_REVALIDATE_SECONDS / 60)} minutes`}
        />
        <StatTile
          description
          tone="terracotta"
          label="Source lag"
          value={sourceLagDays === null ? '—' : `${sourceLagDays}d`}
          detail="Age of the freshest record USASpending has published"
        />
        <StatTile
          description
          size="text"
          label="Scope"
          value="DoD prime contracts"
          detail="Last 45 days of activity"
        />
      </dl>

      {error && (
        <p className="mt-6 rounded-lg bg-neutral-200 px-[22px] py-[18px] text-sm leading-[1.6] text-neutral-900">
          USASpending did not respond just now ({error}). This page queries the API directly, so it
          shows nothing rather than something stale. The <Link href="/">leaderboard</Link> is
          unaffected — it is built from a stored snapshot.
        </p>
      )}

      {!error && awards.length === 0 && (
        <p className="mt-6 text-sm text-neutral-800">No contract actions in the last 45 days.</p>
      )}

      {awards.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg bg-neutral-100 px-4 pb-3 pt-2">
          <table className="data-table min-w-[44rem]">
            <thead>
              <tr>
                <th scope="col">Updated</th>
                <th scope="col">Recipient</th>
                <th scope="col" className="!text-right">
                  Amount
                </th>
                <th scope="col">Awarding sub-agency</th>
              </tr>
            </thead>
            <tbody>
              {awards.map((award) => (
                <tr key={award.id} className="row-interactive align-top">
                  <td className="whitespace-nowrap text-neutral-700">
                    {relativeDay(award.lastModified)}
                  </td>
                  <td>
                    <span className="block font-semibold">{award.recipient}</span>
                    {award.description && (
                      <span className="mt-0.5 block max-w-[28rem] truncate text-xs text-neutral-700">
                        {award.description}
                      </span>
                    )}
                  </td>
                  <td
                    className={`text-right font-semibold ${award.amount < 0 ? 'text-accent-700' : 'text-ink'}`}
                  >
                    {formatExactUsd(award.amount)}
                  </td>
                  <td className="text-neutral-800">{award.subAgency ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 max-w-[48rem] text-xs leading-[1.6] text-neutral-700">
        &ldquo;Updated&rdquo; is when USASpending last modified the record, which is the closest
        available proxy for when an action was published. It is not when the contract was signed:
        agencies report to FPDS on a delay, so even a live query cannot show an award made today.
        Amounts can be negative where funds were deobligated.
      </p>
    </main>
  );
}
