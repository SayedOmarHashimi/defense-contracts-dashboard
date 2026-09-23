import type { CSSProperties } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import AgencyBreakdownChart from '@/components/AgencyBreakdownChart';
import CompetitionMix from '@/components/CompetitionMix';
import StatTile from '@/components/StatTile';
import YearlyObligationsChart from '@/components/YearlyObligationsChart';
import { getContractor, getContractorSlugs, getMeta } from '@/lib/data';
import { formatCompactUsd, formatCount, formatExactUsd, formatPercent } from '@/lib/format';

export async function generateStaticParams() {
  const slugs = await getContractorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const contractor = await getContractor(params.slug);
  if (!contractor) return { title: 'Contractor not found' };
  const description = `${formatCompactUsd(contractor.total_awarded)} in Department of Defense prime contract obligations to ${contractor.name}, FY2020-FY2025.`;

  return {
    // The root layout's title template appends the site name.
    title: contractor.name,
    description,
    // Set explicitly so a shared contractor link previews that contractor
    // rather than inheriting the site-wide card from the root layout.
    openGraph: {
      title: `${contractor.name} — Defense Contracts Dashboard`,
      description,
      url: `/contractor/${contractor.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${contractor.name} — Defense Contracts Dashboard`,
      description,
    },
  };
}

export default async function ContractorPage({ params }: { params: { slug: string } }) {
  const [contractor, meta] = await Promise.all([getContractor(params.slug), getMeta()]);
  if (!contractor) notFound();

  const years = `FY${meta.fiscal_years.start}–FY${meta.fiscal_years.end}`;

  return (
    <main className="mx-auto max-w-[896px] px-6 pt-12">
      <Link href="/" className="text-sm text-neutral-800 underline">
        &larr; Back to leaderboard
      </Link>

      <header className="mt-[18px] flex flex-col gap-2.5">
        <h1 className="text-[40px] [text-wrap:balance]">{contractor.name}</h1>
        <p className="text-sm text-neutral-700">
          {meta.awarding_agency} prime contract obligations, {years}
          {contractor.ueis.length > 1 && ` · ${contractor.ueis.length} UEI registrations merged`}
        </p>
      </header>

      <section
        className="reveal mt-7 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3"
        style={{ '--reveal-delay': '40ms' } as CSSProperties}
      >
        <StatTile
          label="Total obligated"
          value={formatCompactUsd(contractor.total_awarded)}
          detail={formatExactUsd(contractor.total_awarded)}
        />
        <StatTile
          label="Contract awards"
          value={formatCount(contractor.contract_count)}
          detail={`Across ${contractor.agency_breakdown.length} sub-${
            contractor.agency_breakdown.length === 1 ? 'agency' : 'agencies'
          }`}
        />
        <StatTile
          label="Competed"
          value={formatPercent(contractor.competition_mix.competed_pct)}
          detail={`Top agency: ${contractor.top_agency ?? 'n/a'}`}
          tone="sage"
        />
      </section>

      <section className="reveal mt-11" style={{ '--reveal-delay': '80ms' } as CSSProperties}>
        <h2 className="text-2xl">Obligations by fiscal year</h2>
        <p className="mt-2 max-w-[44rem] text-sm leading-[1.6] text-neutral-800 [text-wrap:pretty]">
          Dollars obligated in each fiscal year, not cash paid out. Large multi-year awards land
          entirely in the year they were obligated.
          {meta.partial_fiscal_year !== null && (
            <>
              {' '}
              FY{meta.partial_fiscal_year}* is still in progress, so its total is incomplete and
              will keep rising until the fiscal year closes on 30 September.
            </>
          )}
        </p>
        <div className="mt-4">
          <YearlyObligationsChart
            data={contractor.yearly_totals}
            partialFiscalYear={meta.partial_fiscal_year}
          />
        </div>
      </section>

      <section className="reveal mt-11" style={{ '--reveal-delay': '120ms' } as CSSProperties}>
        <h2 className="text-2xl">Awarding sub-agencies</h2>
        <p className="mt-2 max-w-[44rem] text-sm leading-[1.6] text-neutral-800">
          Ranked by dollars obligated. Negative bars are net deobligations, where funds were
          returned during the window.
        </p>
        <div className="mt-4">
          <AgencyBreakdownChart data={contractor.agency_breakdown} />
        </div>
      </section>

      <section className="reveal mt-11" style={{ '--reveal-delay': '160ms' } as CSSProperties}>
        <h2 className="text-2xl">Competition</h2>
        <p className="mt-2 text-sm leading-[1.6] text-neutral-800">
          Share of obligated dollars awarded competitively, by FPDS extent-of-competition code.
        </p>
        <div className="mt-4">
          <CompetitionMix data={contractor.competition_mix} />
        </div>
      </section>

      <p className="mt-10 text-xs text-neutral-700">
        {contractor.ueis.length <= 3
          ? `UEI: ${contractor.ueis.join(', ')}`
          : `${contractor.ueis.length} UEI registrations`}{' '}
        &middot; Source: {meta.source}
      </p>
    </main>
  );
}
