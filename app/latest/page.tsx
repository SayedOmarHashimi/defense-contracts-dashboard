import type { Metadata } from 'next';
import Link from 'next/link';

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
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="rounded-sm text-sm text-gray-600 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
      >
        &larr; Back to leaderboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Latest awards</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
        The most recently updated {formatCount(awards.length)} Department of Defense prime contract
        actions, queried from USASpending.gov when you loaded this page rather than baked in at
        build time.
      </p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-gray-200 p-4">
          <dt className="text-sm text-gray-600">Checked</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums text-gray-900">
            <time dateTime={fetchedAt}>
              {new Date(fetchedAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC',
              })}{' '}
              UTC
            </time>
          </dd>
          <dd className="mt-1 text-xs text-gray-500">
            Refreshes at most every {Math.round(LATEST_REVALIDATE_SECONDS / 60)} minutes
          </dd>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <dt className="text-sm text-gray-600">Source lag</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
            {sourceLagDays === null ? '—' : `${sourceLagDays}d`}
          </dd>
          <dd className="mt-1 text-xs text-gray-500">
            Age of the freshest record USASpending has published
          </dd>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <dt className="text-sm text-gray-600">Scope</dt>
          <dd className="mt-1 text-sm font-medium text-gray-900">DoD prime contracts</dd>
          <dd className="mt-1 text-xs text-gray-500">Last 45 days of activity</dd>
        </div>
      </dl>

      {error && (
        <p className="mt-6 rounded border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
          USASpending did not respond just now ({error}). This page queries the API directly, so it
          shows nothing rather than something stale. The{' '}
          <Link className="underline" href="/">
            leaderboard
          </Link>{' '}
          is unaffected — it is built from a stored snapshot.
        </p>
      )}

      {!error && awards.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">No contract actions in the last 45 days.</p>
      )}

      {awards.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Updated
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Recipient
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">
                  Amount
                </th>
                <th scope="col" className="py-2 font-semibold">
                  Awarding sub-agency
                </th>
              </tr>
            </thead>
            <tbody>
              {awards.map((award) => (
                <tr key={award.id} className="row-interactive border-b border-gray-200 align-top">
                  <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-gray-600">
                    {relativeDay(award.lastModified)}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="font-medium text-gray-900">{award.recipient}</span>
                    {award.description && (
                      <span className="mt-0.5 block max-w-md truncate text-xs text-gray-500">
                        {award.description}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatExactUsd(award.amount)}
                  </td>
                  <td className="py-2 text-gray-700">{award.subAgency ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-gray-500">
        &ldquo;Updated&rdquo; is when USASpending last modified the record, which is the closest
        available proxy for when an action was published. It is not when the contract was signed:
        agencies report to FPDS on a delay, so even a live query cannot show an award made today.
        Amounts can be negative where funds were deobligated.
      </p>
    </main>
  );
}
