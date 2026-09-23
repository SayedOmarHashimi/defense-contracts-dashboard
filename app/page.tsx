import Link from 'next/link';

import Leaderboard from '@/components/Leaderboard';
import { getContractors, getMeta } from '@/lib/data';

export default async function HomePage() {
  const [contractors, meta] = await Promise.all([getContractors(), getMeta()]);
  const totalAwarded = contractors.reduce((sum, c) => sum + c.total_awarded, 0);

  return (
    <main className="mx-auto max-w-[1024px] px-6 pt-12">
      <header className="flex flex-col gap-3">
        <h1 className="max-w-[18ch] text-[40px] [text-wrap:balance]">
          Defense Contracts Dashboard
        </h1>
        <p className="max-w-[42rem] text-base leading-[1.6] text-neutral-800 [text-wrap:pretty]">
          The {meta.contractor_count} largest {meta.awarding_agency} prime contractors by dollars
          obligated, FY{meta.fiscal_years.start}&ndash;FY{meta.fiscal_years.end}, totalling{' '}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 1,
          }).format(totalAwarded)}
          . Source: {meta.source}.
        </p>
      </header>

      <p className="mt-3.5 flex flex-wrap items-center gap-2 text-sm text-neutral-700">
        <span className="tag tag-accent-2">Snapshot</span>
        <span>
          This table is a stored snapshot, rebuilt every few hours.{' '}
          <Link href="/latest">Latest awards</Link> queries USASpending live instead.
        </span>
      </p>

      <section className="mt-9">
        <Leaderboard contractors={contractors} />
      </section>
    </main>
  );
}
