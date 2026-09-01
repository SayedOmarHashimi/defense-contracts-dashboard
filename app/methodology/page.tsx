import type { Metadata } from 'next';
import Link from 'next/link';

import { getContractors, getMeta } from '@/lib/data';
import { formatCompactUsd, formatCount } from '@/lib/format';

const DESCRIPTION =
  'Where the Defense Contracts Dashboard data comes from, how it is built, how often it refreshes, and what it does not tell you.';

export const metadata: Metadata = {
  title: 'Methodology',
  description: DESCRIPTION,
  openGraph: {
    title: 'Methodology — Defense Contracts Dashboard',
    description: DESCRIPTION,
    url: '/methodology',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Methodology — Defense Contracts Dashboard',
    description: DESCRIPTION,
  },
};

export default async function MethodologyPage() {
  const [meta, contractors] = await Promise.all([getMeta(), getContractors()]);
  const generated = new Date(meta.generated_at);
  const years = `FY${meta.fiscal_years.start}–FY${meta.fiscal_years.end}`;
  const totalAwarded = contractors.reduce((sum, c) => sum + c.total_awarded, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="rounded-sm text-sm text-gray-600 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
      >
        &larr; Back to leaderboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Methodology</h1>
      <p className="mt-2 text-sm text-gray-600">
        Last built{' '}
        <time dateTime={meta.generated_at}>
          {generated.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC',
          })}
        </time>{' '}
        from {formatCount(meta.merged_uei_registrations)} UEI registrations.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Source</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          Every figure comes from{' '}
          <a
            className="underline underline-offset-2"
            href="https://www.usaspending.gov"
            target="_blank"
            rel="noreferrer"
          >
            USASpending.gov
          </a>
          , the U.S. Treasury&rsquo;s official source for federal spending, through its{' '}
          <a
            className="underline underline-offset-2"
            href={meta.source_url}
            target="_blank"
            rel="noreferrer"
          >
            public API
          </a>
          . No API key is required and no data is added, modelled, or estimated here. The underlying
          records are U.S. Government public domain.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">What is counted</h2>
        <dl className="mt-2 space-y-3 text-sm leading-relaxed text-gray-700">
          <div>
            <dt className="font-medium text-gray-900">Agency</dt>
            <dd>{meta.awarding_agency} only, as the awarding agency.</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Award types</dt>
            <dd>
              FPDS codes {meta.award_type_codes.join(', ')} &mdash; BPA calls, purchase orders,
              delivery orders and definitive contracts. Indefinite delivery vehicles, grants and
              loans are excluded.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Window</dt>
            <dd>
              {years}, a rolling six years ending in the current fiscal year. Federal fiscal years
              end 30 September.
              {meta.partial_fiscal_year !== null && (
                <>
                  {' '}
                  FY{meta.partial_fiscal_year} is still open, so its totals are partial and grow
                  with each refresh.
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Scale</dt>
            <dd>
              The {meta.contractor_count} largest contractors by obligations, totalling{' '}
              {formatCompactUsd(totalAwarded)}.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Two data paths</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          The site reads USASpending in two different ways, because the two questions cost very
          different amounts to answer.
        </p>
        <dl className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700">
          <div>
            <dt className="font-medium text-gray-900">Leaderboard and contractor pages</dt>
            <dd>
              A six-year aggregate across a hundred contractors, roughly 750 API queries and some
              forty minutes to assemble. Far too expensive to run per visit, so it is built on a
              schedule and stored. This is a snapshot.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Latest awards</dt>
            <dd>
              A single query for the most recently updated contract actions, cheap enough to run on
              demand. That page is regenerated at most every few minutes and is not baked in at
              build time.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Refresh cadence</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          A GitHub Actions workflow re-runs the pipeline every six hours. When the exports change it
          commits them, which triggers a rebuild and redeploy. The site is fully statically
          generated, so what you are reading was rendered at build time rather than fetched in your
          browser, and it changes only when that rebuild happens &mdash; this is a daily snapshot,
          not a live feed. The window rolls forward on its own, so newly awarded contracts appear as
          USASpending publishes them.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">What this does not tell you</h2>
        <ul className="mt-2 list-disc space-y-3 pl-5 text-sm leading-relaxed text-gray-700">
          <li>
            <span className="font-medium text-gray-900">This is not real-time.</span> Agencies
            report to FPDS on a delay, so USASpending itself runs days behind the contracts it
            describes. No amount of refreshing on this end changes that; the latest-awards page
            shows the measured lag so you can judge it. Recent months are incomplete, and earlier
            periods are restated as agencies correct their filings, so totals here will drift.
          </li>
          <li>
            <span className="font-medium text-gray-900">
              These are obligations, not money spent.
            </span>{' '}
            An obligation is a commitment to pay, not a payment. A large multi-year award lands
            entirely in the year it was obligated, which is why single-year totals are lumpy and why
            a contractor can post a huge year followed by a small one.
          </li>
          <li>
            <span className="font-medium text-gray-900">Some figures are negative.</span> Funds
            returned during the window net out as deobligations, so a fiscal year or an agency total
            can come out below zero. Charts use a zero baseline instead of a part-to-whole form,
            which cannot represent a negative share.
          </li>
          <li>
            <span className="font-medium text-gray-900">Companies are merged by name.</span> One
            company can hold several UEI registrations. Registrations whose names match once legal
            suffixes are dropped are combined into a single contractor, and the constituent UEIs are
            listed on each contractor page. Parent and subsidiary relationships are <em>not</em>{' '}
            rolled up: a subsidiary trading under its own name appears as its own contractor.
          </li>
          <li>
            <span className="font-medium text-gray-900">
              &ldquo;Competed&rdquo; is narrower than it sounds.
            </span>{' '}
            The split uses the FPDS extent-of-competition code. Competed covers full and open
            competition, full and open after exclusion of sources, and competition under simplified
            acquisition procedures. Everything else &mdash; including a follow-on to a previously
            competed action &mdash; counts as sole-source.
          </li>
          <li>
            <span className="font-medium text-gray-900">Prime awards only.</span> Subcontracts are
            not included, so a prime&rsquo;s total is not what that company kept.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">One implementation note</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          USASpending&rsquo;s <code className="text-xs">recipient_id</code> filter is silently
          ignored by its award-level endpoints, which return agency-wide results while appearing to
          succeed. This pipeline filters by UEI instead, and cross-checks that each
          contractor&rsquo;s yearly totals, agency breakdown and competition split all sum to the
          same figure before publishing.
        </p>
      </section>
    </main>
  );
}
