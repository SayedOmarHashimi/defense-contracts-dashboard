import type { Metadata } from 'next';
import { Caprasimo, Figtree } from 'next/font/google';
import Link from 'next/link';

import './globals.css';

const heading = Caprasimo({ subsets: ['latin'], weight: '400', variable: '--font-heading' });
const body = Figtree({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
});

const SITE_NAME = 'Defense Contracts Dashboard';
const DESCRIPTION =
  'The largest Department of Defense prime contractors by dollars obligated, built from USASpending.gov open data.';

// Absolute URLs are required for Open Graph. Vercel exposes the deployment
// host at build time; the localhost fallback keeps local builds working.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    url: '/',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-bg font-body text-ink">
        {children}
        <footer className="mx-auto max-w-[1024px] px-6 pb-10 pt-14 text-[13px] text-neutral-700">
          <nav className="flex flex-wrap gap-2">
            <Link href="/" className="btn-pill">
              Leaderboard
            </Link>
            <Link href="/latest" className="btn-pill">
              Latest awards
            </Link>
            <Link href="/methodology" className="btn-pill">
              Methodology
            </Link>
            <a
              className="btn-pill"
              href="https://www.usaspending.gov"
              target="_blank"
              rel="noreferrer"
            >
              Source data &#8599;
            </a>
          </nav>
          <p className="mt-3.5">
            Obligations, not outlays. Source data is U.S. Government public domain.
          </p>
        </footer>
      </body>
    </html>
  );
}
