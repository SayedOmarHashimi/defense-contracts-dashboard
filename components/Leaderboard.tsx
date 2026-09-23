'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { ContractorSummary } from '@/lib/data';

type SortKey = 'name' | 'total_awarded' | 'contract_count';
type Direction = 'asc' | 'desc';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const exactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat('en-US');

/** Podium, top ten, then everyone else. */
function rankBadgeClass(rank: number): string {
  if (rank <= 3) return 'bg-accent text-neutral-100';
  if (rank <= 10) return 'bg-accent-200 text-accent-800';
  return 'bg-neutral-200 text-neutral-800';
}

/** Numeric columns are most useful largest-first; the name column A-Z. */
const DEFAULT_DIRECTION: Record<SortKey, Direction> = {
  name: 'asc',
  total_awarded: 'desc',
  contract_count: 'desc',
};

function SortButton({
  label,
  column,
  sortKey,
  direction,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  direction: Direction;
  onSort: (column: SortKey) => void;
}) {
  const active = sortKey === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1.5 rounded-pill uppercase transition-colors duration-[var(--duration-hover)] hover:text-accent-700"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span
        aria-hidden="true"
        className={`text-[9px] ${active ? 'text-accent' : 'text-neutral-400'}`}
      >
        {active && direction === 'asc' ? '▲' : '▼'}
      </span>
    </button>
  );
}

export default function Leaderboard({ contractors }: { contractors: ContractorSummary[] }) {
  const [query, setQuery] = useState('');
  const [agency, setAgency] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('total_awarded');
  const [direction, setDirection] = useState<Direction>('desc');

  const agencies = useMemo(
    () =>
      Array.from(
        new Set(contractors.map((c) => c.top_agency).filter((a): a is string => Boolean(a))),
      ).sort(),
    [contractors],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = contractors.filter(
      (c) =>
        (needle === '' || c.name.toLowerCase().includes(needle)) &&
        (agency === 'all' || c.top_agency === agency),
    );

    // Sort on a copy, and break ties on rank so the order never wobbles
    // between renders when two contractors share a value.
    return [...filtered].sort((a, b) => {
      const factor = direction === 'asc' ? 1 : -1;
      const delta = sortKey === 'name' ? a.name.localeCompare(b.name) : a[sortKey] - b[sortKey];
      return delta !== 0 ? delta * factor : a.id - b.id;
    });
  }, [contractors, query, agency, sortKey, direction]);

  function handleSort(column: SortKey) {
    if (column === sortKey) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column);
      setDirection(DEFAULT_DIRECTION[column]);
    }
  }

  const ariaSort = (column: SortKey): 'ascending' | 'descending' | 'none' =>
    sortKey === column ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3.5">
        <div className="flex-[1_1_320px]">
          <label htmlFor="q" className="mb-[5px] block text-[13px] font-semibold text-neutral-800">
            Filter by name
          </label>
          <input
            id="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Boeing"
            className="field-input"
          />
        </div>
        <div className="min-w-[220px] flex-[0_1_300px]">
          <label
            htmlFor="agency"
            className="mb-[5px] block text-[13px] font-semibold text-neutral-800"
          >
            Top awarding agency
          </label>
          <select
            id="agency"
            value={agency}
            onChange={(event) => setAgency(event.target.value)}
            className="field-input"
          >
            <option value="all">All agencies</option>
            {agencies.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-3.5 text-[13px] text-neutral-700" aria-live="polite">
        {rows.length} of {contractors.length} contractors
      </p>

      <div className="mt-3 overflow-x-auto rounded-lg bg-neutral-100 px-4 pb-3 pt-2">
        <table className="data-table min-w-[36rem]">
          <thead>
            <tr>
              <th scope="col" className="w-12">
                #
              </th>
              <th scope="col" aria-sort={ariaSort('name')}>
                <SortButton
                  label="Contractor"
                  column="name"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={handleSort}
                />
              </th>
              <th scope="col" className="!text-right" aria-sort={ariaSort('total_awarded')}>
                <SortButton
                  label="Total awarded"
                  column="total_awarded"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={handleSort}
                />
              </th>
              <th scope="col" className="!text-right" aria-sort={ariaSort('contract_count')}>
                <SortButton
                  label="Contracts"
                  column="contract_count"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={handleSort}
                />
              </th>
              <th scope="col" className="hidden md:table-cell">
                Top agency
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((contractor) => (
              <tr key={contractor.slug} className="row-interactive">
                <td>
                  <span
                    className={`inline-grid h-7 min-w-7 place-items-center rounded-pill px-1 text-xs font-semibold ${rankBadgeClass(contractor.id)}`}
                  >
                    {contractor.id}
                  </span>
                </td>
                <td>
                  <Link
                    href={`/contractor/${contractor.slug}`}
                    className="font-semibold text-ink underline decoration-accent-400 decoration-[1.5px] underline-offset-[3px] transition-colors duration-[var(--duration-hover)] hover:text-accent-700 hover:decoration-accent-700"
                  >
                    {contractor.name}
                  </Link>
                  {/* The numeric columns scroll out of view on narrow screens,
                      so repeat the headline figure inline. */}
                  <span className="block text-xs text-neutral-700 md:hidden">
                    {currency.format(contractor.total_awarded)} &middot;{' '}
                    {contractor.top_agency ?? '—'}
                  </span>
                </td>
                <td
                  className="text-right font-semibold"
                  title={exactCurrency.format(contractor.total_awarded)}
                >
                  {currency.format(contractor.total_awarded)}
                </td>
                <td className="text-right">{count.format(contractor.contract_count)}</td>
                <td className="hidden text-neutral-800 md:table-cell">
                  {contractor.top_agency ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="mt-6 flex flex-wrap items-center gap-2.5 text-sm text-neutral-800">
          No contractors match those filters.{' '}
          <button
            type="button"
            className="btn-pill"
            onClick={() => {
              setQuery('');
              setAgency('all');
            }}
          >
            Clear filters
          </button>
        </p>
      )}
    </div>
  );
}
