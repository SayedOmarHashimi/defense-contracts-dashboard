import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getContractor, getContractorSlugs } from '@/lib/data';

// Every contractor page is built at compile time; nothing is fetched at runtime.
export async function generateStaticParams() {
  const slugs = await getContractorSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Any slug outside the generated set is a 404 rather than an on-demand render.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const contractor = await getContractor(params.slug);
  if (!contractor) return { title: 'Contractor not found' };
  return {
    title: `${contractor.name} — Defense Contracts Dashboard`,
    description: `Department of Defense prime contract awards to ${contractor.name}.`,
  };
}

// Stage 4 replaces this with charts. For now it proves the data layer resolves.
export default async function ContractorPage({ params }: { params: { slug: string } }) {
  const contractor = await getContractor(params.slug);
  if (!contractor) notFound();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">{contractor.name}</h1>
      <p className="mt-2">
        {contractor.total_awarded.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        })}{' '}
        across {contractor.contract_count.toLocaleString('en-US')} contracts &middot; top agency:{' '}
        {contractor.top_agency ?? 'n/a'}
      </p>
      <p className="mt-2">
        {contractor.yearly_totals.length} fiscal years &middot; {contractor.agency_breakdown.length}{' '}
        sub-agencies &middot;{' '}
        {contractor.competition_mix.competed_pct === null
          ? 'no competition data'
          : `${(contractor.competition_mix.competed_pct * 100).toFixed(1)}% competed`}
      </p>
      <p className="mt-6">
        <Link className="underline" href="/">
          Back to leaderboard
        </Link>
      </p>
    </main>
  );
}
