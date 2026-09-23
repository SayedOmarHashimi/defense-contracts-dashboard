import { AGENCY_LIMIT, CHART, domainIncludingZero } from '@/lib/chartTheme';
import { formatCompactUsd, formatExactUsd, shortAgency } from '@/lib/format';
import type { AgencyBreakdown } from '@/lib/data';

/**
 * Ranked bars rather than a pie or 100% stacked bar: net deobligations make
 * some agency amounts negative, and a part-to-whole chart cannot represent a
 * negative share. Bars against a zero baseline can.
 */
export default function AgencyBreakdownChart({ data }: { data: AgencyBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg bg-neutral-100 px-6 py-5">
        <p className="py-6 text-sm text-neutral-700">No agency breakdown available.</p>
      </div>
    );
  }

  const head = data.slice(0, AGENCY_LIMIT);
  const tail = data.slice(AGENCY_LIMIT);
  const rows = [
    ...head.map((row) => ({
      label: shortAgency(row.agency),
      full: row.agency,
      amount: row.amount,
    })),
    ...(tail.length > 0
      ? [
          {
            label: `Other (${tail.length})`,
            full: `${tail.length} smaller agencies`,
            amount: tail.reduce((sum, row) => sum + row.amount, 0),
          },
        ]
      : []),
  ];

  const [min, max] = domainIncludingZero(rows.map((row) => row.amount));
  /** Distance from the left of the track, as a percentage. */
  const x = (value: number) => ((value - min) / (max - min)) * 100;
  const zero = x(0);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-neutral-100 px-6 py-5">
      {rows.map((row) => {
        const title = `${row.full}: ${formatExactUsd(row.amount)} obligated`;
        return (
          <div
            key={row.full}
            title={title}
            className="grid min-h-[30px] grid-cols-[132px_1fr_72px] items-center gap-3 rounded-pill px-2 transition-colors duration-[var(--duration-hover)] hover:bg-tint"
          >
            <span className="truncate text-right text-xs text-neutral-800">{row.label}</span>
            <div className="relative h-[22px]" role="img" aria-label={title}>
              <div
                className="absolute -inset-y-1 border-l-[1.5px] border-neutral-400"
                style={{ left: `${zero}%` }}
              />
              <div
                className="absolute inset-y-0 min-w-[3px] rounded-pill"
                style={{
                  left: `${x(Math.min(0, row.amount))}%`,
                  width: `${Math.abs(x(row.amount) - zero)}%`,
                  backgroundColor: row.amount < 0 ? CHART.negative : CHART.series1,
                }}
              />
            </div>
            <span className="text-right text-xs font-semibold">{formatCompactUsd(row.amount)}</span>
          </div>
        );
      })}
    </div>
  );
}
