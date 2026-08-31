import Link from 'next/link';

// Placeholder. Stage 3 replaces this with the contractor leaderboard.
export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Defense Contracts Dashboard</h1>
      <p className="mt-2">
        Department of Defense prime contract awards, FY2020&ndash;FY2025, from USASpending.gov.
      </p>
      <p className="mt-6">
        Routing check:{' '}
        <Link className="underline" href="/contractor/lockheed-martin-corporation">
          /contractor/lockheed-martin-corporation
        </Link>
      </p>
    </main>
  );
}
