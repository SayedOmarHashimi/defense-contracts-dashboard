import Leaderboard from '@/components/Leaderboard';
import { getContractors, getMeta } from '@/lib/data';

export default async function HomePage() {
  const [contractors, meta] = await Promise.all([getContractors(), getMeta()]);
  const totalAwarded = contractors.reduce((sum, c) => sum + c.total_awarded, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Defense Contracts Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
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

      <section className="mt-8">
        <Leaderboard contractors={contractors} />
      </section>
    </main>
  );
}
