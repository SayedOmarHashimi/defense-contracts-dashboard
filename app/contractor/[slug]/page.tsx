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
  return {
    title: `${contractor.name} — Defense Contracts Dashboard`,
    description: `${formatCompactUsd(contractor.total_awarded)} in Department of Defense prime contract obligations to ${contractor.name}.`,
  };
}

export default async function ContractorPage({ params }: { params: { slug: string } }) {
  const [contractor, meta] = await Promise.all([getContractor(params.slug), getMeta()]);
  if (!contractor) notFound();

  const years = `FY${meta.fiscal_years.start}–FY${meta.fiscal_years.end}`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className="text-sm text-gray-600 underline underline-offset-2">
        &larr; Back to leaderboard
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{contractor.name}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {meta.awarding_agency} prime contract obligations, {years}
          {contractor.ueis.length > 1 && ` · ${contractor.ueis.length} UEI registrations merged`}
        </p>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
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
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Obligations by fiscal year</h2>
        <p className="mt-1 text-sm text-gray-600">
          Dollars obligated in each fiscal year, not cash paid out. Large multi-year awards land
          entirely in the year they were obligated.
        </p>
        <div className="mt-4">
          <YearlyObligationsChart data={contractor.yearly_totals} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Awarding sub-agencies</h2>
        <p className="mt-1 text-sm text-gray-600">
          Ranked by dollars obligated. Negative bars are net deobligations, where funds were
          returned during the window.
        </p>
        <div className="mt-4">
          <AgencyBreakdownChart data={contractor.agency_breakdown} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Competition</h2>
        <p className="mt-1 text-sm text-gray-600">
          Share of obligated dollars awarded competitively, by FPDS extent-of-competition code.
        </p>
        <div className="mt-4">
          <CompetitionMix data={contractor.competition_mix} />
        </div>
      </section>

      <p className="mt-10 text-xs text-gray-500">
        {contractor.ueis.length <= 3
          ? `UEI: ${contractor.ueis.join(', ')}`
          : `${contractor.ueis.length} UEI registrations`}{' '}
        &middot; Source: {meta.source}
      </p>
    </main>
  );
}
