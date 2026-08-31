// Shared by Server and Client Components, so this file must stay free of
// server-only imports.

const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const exactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const wholeNumber = new Intl.NumberFormat('en-US');

export const formatCompactUsd = (value: number) => compactUsd.format(value);
export const formatExactUsd = (value: number) => exactUsd.format(value);
export const formatCount = (value: number) => wholeNumber.format(value);

export function formatPercent(fraction: number | null): string {
  if (fraction === null || Number.isNaN(fraction)) return 'n/a';
  return `${(fraction * 100).toFixed(1)}%`;
}

/** Sub-agency names are long; shorten the common prefixes for axis labels. */
export function shortAgency(name: string): string {
  return name
    .replace(/^Department of the /, '')
    .replace(/^Department of /, '')
    .replace(/^Defense /, 'Def. ');
}
