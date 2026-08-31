import Link from 'next/link';

// Placeholder. Stage 4 replaces this with real contractor detail.
export default function ContractorPage({ params }: { params: { slug: string } }) {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Contractor: {params.slug}</h1>
      <p className="mt-2">Detail for this contractor is built in Stage 4.</p>
      <p className="mt-6">
        <Link className="underline" href="/">
          Back to leaderboard
        </Link>
      </p>
    </main>
  );
}
