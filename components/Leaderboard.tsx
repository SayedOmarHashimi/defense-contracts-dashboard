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
      className="inline-flex items-center gap-1 rounded-sm font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span aria-hidden="true" className={active ? 'text-gray-900' : 'text-gray-300'}>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="block text-sm font-medium text-gray-700">
            Filter by name
          </label>
          <input
            id="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Boeing"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm transition-colors duration-150 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="sm:w-72">
          <label htmlFor="agency" className="block text-sm font-medium text-gray-700">
            Top awarding agency
          </label>
          <select
            id="agency"
            value={agency}
            onChange={(event) => setAgency(event.target.value)}
            className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-150 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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

      <p className="mt-3 text-sm text-gray-600" aria-live="polite">
        {rows.length} of {contractors.length} contractors
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th scope="col" className="py-2 pr-3 font-semibold">
                #
              </th>
              <th scope="col" className="py-2 pr-3" aria-sort={ariaSort('name')}>
                <SortButton
                  label="Contractor"
                  column="name"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={handleSort}
                />
              </th>
              <th
                scope="col"
                className="py-2 pr-3 text-right"
                aria-sort={ariaSort('total_awarded')}
              >
                <SortButton
                  label="Total awarded"
                  column="total_awarded"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={handleSort}
                />
              </th>
              <th
                scope="col"
                className="py-2 pr-3 text-right"
                aria-sort={ariaSort('contract_count')}
              >
                <SortButton
                  label="Contracts"
                  column="contract_count"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={handleSort}
                />
              </th>
              <th scope="col" className="hidden py-2 font-semibold md:table-cell">
                Top agency
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((contractor) => (
              <tr key={contractor.slug} className="row-interactive border-b border-gray-200">
                <td className="py-2 pr-3 tabular-nums text-gray-500">{contractor.id}</td>
                <td className="py-2 pr-3">
                  <Link
                    href={`/contractor/${contractor.slug}`}
                    className="rounded-sm font-medium text-gray-900 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  >
                    {contractor.name}
                  </Link>
                  {/* The numeric columns scroll out of view on narrow screens,
                      so repeat the headline figure inline. */}
                  <span className="block text-xs text-gray-500 md:hidden">
                    {currency.format(contractor.total_awarded)} &middot;{' '}
                    {contractor.top_agency ?? '—'}
                  </span>
                </td>
                <td
                  className="py-2 pr-3 text-right tabular-nums"
                  title={exactCurrency.format(contractor.total_awarded)}
                >
                  {currency.format(contractor.total_awarded)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {count.format(contractor.contract_count)}
                </td>
                <td className="hidden py-2 text-gray-700 md:table-cell">
                  {contractor.top_agency ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">
          No contractors match those filters.{' '}
          <button
            type="button"
            className="underline"
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
