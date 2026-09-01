import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900`}>
        {children}
        <footer className="mx-auto max-w-5xl px-4 py-10 text-xs text-gray-500 sm:px-6">
          <nav className="flex gap-4">
            <Link
              href="/"
              className="rounded-sm underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
            >
              Leaderboard
            </Link>
            <Link
              href="/latest"
              className="rounded-sm underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
            >
              Latest awards
            </Link>
            <Link
              href="/methodology"
              className="rounded-sm underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
            >
              Methodology
            </Link>
            <a
              className="rounded-sm underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
              href="https://www.usaspending.gov"
              target="_blank"
              rel="noreferrer"
            >
              Source data
            </a>
          </nav>
          <p className="mt-3">
            Obligations, not outlays. Source data is U.S. Government public domain.
          </p>
        </footer>
      </body>
    </html>
  );
}
