import Link from 'next/link';

import { getContractors, getMeta } from '@/lib/data';

// Stage 3 replaces this with the sortable, filterable leaderboard.
export default async function HomePage() {
  const [contractors, meta] = await Promise.all([getContractors(), getMeta()]);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Defense Contracts Dashboard</h1>
      <p className="mt-2">
        {meta.contractor_count} contractors &middot; {meta.awarding_agency} &middot; FY
        {meta.fiscal_years.start}&ndash;FY{meta.fiscal_years.end}
      </p>
      <ol className="mt-6 list-decimal space-y-1 pl-6">
        {contractors.map((contractor) => (
          <li key={contractor.slug}>
            <Link className="underline" href={`/contractor/${contractor.slug}`}>
              {contractor.name}
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
