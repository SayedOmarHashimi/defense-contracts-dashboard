import 'server-only';

import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react';

const DATA_DIR = path.join(process.cwd(), 'data');

/** One fiscal year of obligations. Fiscal years end September 30. */
export interface YearlyTotal {
  fiscal_year: number;
  amount: number;
}

/** Obligations attributed to one DoD awarding sub-agency. */
export interface AgencyBreakdown {
  agency: string;
  amount: number;
  /** Fraction of the contractor's total, 0-1. */
  share: number;
}

/**
 * Competed vs. sole-source split, by dollars obligated.
 * The `_pct` fields are null when a contractor has no classified obligations.
 */
export interface CompetitionMix {
  competed_amount: number;
  not_competed_amount: number;
  competed_pct: number | null;
  not_competed_pct: number | null;
}

/** A row in the leaderboard. Matches data/contractors.json exactly. */
export interface ContractorSummary {
  /** Rank by total_awarded, 1 = largest. */
  id: number;
  name: string;
  slug: string;
  total_awarded: number;
  contract_count: number;
  top_agency: string | null;
}

/** A contractor detail record. Matches data/contractor/<slug>.json exactly. */
export interface ContractorDetail extends Omit<ContractorSummary, 'id'> {
  /** Every UEI registration merged into this contractor. */
  ueis: string[];
  yearly_totals: YearlyTotal[];
  agency_breakdown: AgencyBreakdown[];
  competition_mix: CompetitionMix;
}

/** Provenance for the methodology page. Matches data/meta.json exactly. */
export interface DatasetMeta {
  source: string;
  source_url: string;
  generated_at: string;
  fiscal_years: { start: number; end: number };
  awarding_agency: string;
  award_type_codes: string[];
  contractor_count: number;
  merged_uei_registrations: number;
}

async function readJson<T>(...segments: string[]): Promise<T> {
  const file = path.join(DATA_DIR, ...segments);
  return JSON.parse(await fs.readFile(file, 'utf8')) as T;
}

/**
 * All contractors, ranked. `cache` dedupes the read across every component
 * that asks for it while rendering a single page.
 */
export const getContractors = cache(async (): Promise<ContractorSummary[]> =>
  readJson<ContractorSummary[]>('contractors.json'),
);

export const getMeta = cache(async (): Promise<DatasetMeta> => readJson<DatasetMeta>('meta.json'));

/** Slugs for generateStaticParams. */
export const getContractorSlugs = cache(async (): Promise<string[]> => {
  const contractors = await getContractors();
  return contractors.map((contractor) => contractor.slug);
});

/**
 * One contractor's detail record, or null when the slug is unknown.
 * Returning null rather than throwing lets the route call notFound().
 */
export const getContractor = cache(async (slug: string): Promise<ContractorDetail | null> => {
  // Guard against path traversal: the slug becomes part of a file path.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return await readJson<ContractorDetail>('contractor', `${slug}.json`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
});
