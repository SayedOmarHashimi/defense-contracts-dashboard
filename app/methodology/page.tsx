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
    <main className="mx-auto max-w-[768px] px-6 pt-12 text-[15px] leading-[1.65] text-neutral-900">
      <Link href="/" className="text-sm text-neutral-800 underline">
        &larr; Back to leaderboard
      </Link>

      <h1 className="mt-[18px] text-[40px]">Methodology</h1>
      <p className="mt-2.5 text-sm text-neutral-700">
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

      <section className="mt-9">
        <h2 className="mb-2 text-2xl">Source</h2>
        <p>
          Every figure comes from{' '}
          <a href="https://www.usaspending.gov" target="_blank" rel="noreferrer">
            USASpending.gov
          </a>
          , the U.S. Treasury&rsquo;s official source for federal spending, through its{' '}
          <a href={meta.source_url} target="_blank" rel="noreferrer">
            public API
          </a>
          . No API key is required and no data is added, modelled, or estimated here. The underlying
          records are U.S. Government public domain.
        </p>
      </section>

      <section className="mt-9">
        <h2 className="mb-3 text-2xl">What is counted</h2>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-2.5">
          <div className="flex flex-col gap-0.5 rounded-card bg-surface px-5 py-4">
            <dt className="font-bold">Agency</dt>
            <dd>{meta.awarding_agency} only, as the awarding agency.</dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-card bg-surface px-5 py-4">
            <dt className="font-bold">Award types</dt>
            <dd>
              FPDS codes {meta.award_type_codes.join(', ')} &mdash; BPA calls, purchase orders,
              delivery orders and definitive contracts. Indefinite delivery vehicles, grants and
              loans are excluded.
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-card bg-surface px-5 py-4">
            <dt className="font-bold">Window</dt>
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
          <div className="flex flex-col gap-0.5 rounded-card bg-surface px-5 py-4">
            <dt className="font-bold">Scale</dt>
            <dd>
              The {meta.contractor_count} largest contractors by obligations, totalling{' '}
              {formatCompactUsd(totalAwarded)}.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-9">
        <h2 className="mb-2 text-2xl">Two data paths</h2>
        <p>
          The site reads USASpending in two different ways, because the two questions cost very
          different amounts to answer.
        </p>
        <dl className="mt-3.5 flex flex-col gap-3.5">
          <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1">
            {/* `contents` lets the tag take the grid's first column while
                staying inside the <dt>, which is all a <dl> group may hold. */}
            <dt className="contents">
              <span className="tag tag-accent-2 row-span-2 mt-[3px] self-start">Snapshot</span>
              <span className="font-bold">Leaderboard and contractor pages</span>
            </dt>
            <dd>
              A six-year aggregate across a hundred contractors, roughly 750 API queries and some
              forty minutes to assemble. Far too expensive to run per visit, so it is built on a
              schedule and stored. This is a snapshot.
            </dd>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1">
            <dt className="contents">
              <span className="tag tag-accent row-span-2 mt-[3px] self-start">Live</span>
              <span className="font-bold">Latest awards</span>
            </dt>
            <dd>
              A single query for the most recently updated contract actions, cheap enough to run on
              demand. That page is regenerated at most every few minutes and is not baked in at
              build time.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-9">
        <h2 className="mb-2 text-2xl">Refresh cadence</h2>
        <p>
          A GitHub Actions workflow re-runs the pipeline every six hours. When the exports change it
          commits them, which triggers a rebuild and redeploy. The site is fully statically
          generated, so what you are reading was rendered at build time rather than fetched in your
          browser, and it changes only when that rebuild happens &mdash; this is a daily snapshot,
          not a live feed. The window rolls forward on its own, so newly awarded contracts appear as
          USASpending publishes them.
        </p>
      </section>

      <section className="mt-9">
        <h2 className="mb-3 text-2xl">What this does not tell you</h2>
        <ul className="flex flex-col gap-3.5">
          <li className="grid grid-cols-[10px_1fr] gap-3.5">
            <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
            <span>
              <strong>This is not real-time.</strong> Agencies report to FPDS on a delay, so
              USASpending itself runs days behind the contracts it describes. No amount of
              refreshing on this end changes that; the latest-awards page shows the measured lag so
              you can judge it. Recent months are incomplete, and earlier periods are restated as
              agencies correct their filings, so totals here will drift.
            </span>
          </li>
          <li className="grid grid-cols-[10px_1fr] gap-3.5">
            <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
            <span>
              <strong>These are obligations, not money spent.</strong> An obligation is a commitment
              to pay, not a payment. A large multi-year award lands entirely in the year it was
              obligated, which is why single-year totals are lumpy and why a contractor can post a
              huge year followed by a small one.
            </span>
          </li>
          <li className="grid grid-cols-[10px_1fr] gap-3.5">
            <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
            <span>
              <strong>Some figures are negative.</strong> Funds returned during the window net out
              as deobligations, so a fiscal year or an agency total can come out below zero. Charts
              use a zero baseline instead of a part-to-whole form, which cannot represent a negative
              share.
            </span>
          </li>
          <li className="grid grid-cols-[10px_1fr] gap-3.5">
            <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
            <span>
              <strong>Companies are merged by name.</strong> One company can hold several UEI
              registrations. Registrations whose names match once legal suffixes are dropped are
              combined into a single contractor, and the constituent UEIs are listed on each
              contractor page. Parent and subsidiary relationships are <em>not</em> rolled up: a
              subsidiary trading under its own name appears as its own contractor.
            </span>
          </li>
          <li className="grid grid-cols-[10px_1fr] gap-3.5">
            <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
            <span>
              <strong>&ldquo;Competed&rdquo; is narrower than it sounds.</strong> The split uses the
              FPDS extent-of-competition code. Competed covers full and open competition, full and
              open after exclusion of sources, and competition under simplified acquisition
              procedures. Everything else &mdash; including a follow-on to a previously competed
              action &mdash; counts as sole-source.
            </span>
          </li>
          <li className="grid grid-cols-[10px_1fr] gap-3.5">
            <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 rounded-full bg-accent" />
            <span>
              <strong>Prime awards only.</strong> Subcontracts are not included, so a prime&rsquo;s
              total is not what that company kept.
            </span>
          </li>
        </ul>
      </section>

      <section className="mt-9">
        <h2 className="mb-2 text-2xl">One implementation note</h2>
        <p>
          USASpending&rsquo;s{' '}
          <code className="rounded-pill bg-surface px-2 py-0.5 text-[13px]">recipient_id</code>{' '}
          filter is silently ignored by its award-level endpoints, which return agency-wide results
          while appearing to succeed. This pipeline filters by UEI instead, and cross-checks that
          each contractor&rsquo;s yearly totals, agency breakdown and competition split all sum to
          the same figure before publishing.
        </p>
      </section>
    </main>
  );
}
