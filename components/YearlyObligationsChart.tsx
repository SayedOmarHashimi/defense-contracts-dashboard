import { CHART, domainIncludingZero } from '@/lib/chartTheme';
import { formatCompactUsd, formatExactUsd } from '@/lib/format';
import type { YearlyTotal } from '@/lib/data';

const TICK_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

/**
 * Plain markup rather than a chart library: six static bars need no more than
 * positioned boxes, and dropping the library takes ~110 kB off this route.
 */
export default function YearlyObligationsChart({
  data,
  partialFiscalYear,
}: {
  data: YearlyTotal[];
  partialFiscalYear: number | null;
}) {
  if (!data.some((row) => row.amount !== 0)) {
    return <p className="py-8 text-sm text-neutral-700">No obligations recorded in this window.</p>;
  }

  // Deobligations net out to a negative year for some contractors, so the
  // domain has to reach below zero rather than start at it.
  const [min, max] = domainIncludingZero(data.map((row) => row.amount));
  const span = max - min;
  /** Distance from the top of the plot, as a percentage. */
  const y = (value: number) => ((max - value) / span) * 100;

  const ticks = TICK_FRACTIONS.map((fraction) => ({
    top: fraction * 100,
    label: formatCompactUsd(max - fraction * span),
  }));

  // The in-progress year is marked rather than hidden: an unlabelled short
  // final bar reads as collapsed spending instead of an incomplete year.
  const bars = data.map((row) => {
    const partial = row.fiscal_year === partialFiscalYear;
    const top = y(Math.max(0, row.amount));
    const bottom = y(Math.min(0, row.amount));
    return {
      key: row.fiscal_year,
      label: `FY${row.fiscal_year}${partial ? '*' : ''}`,
      title: `FY${row.fiscal_year}: ${formatExactUsd(row.amount)} obligated${
        partial ? ' (in progress)' : ''
      }`,
      top,
      height: bottom - top,
      fill: partial
        ? `repeating-linear-gradient(135deg, ${CHART.series1Light} 0 6px, ${CHART.series1} 6px 8px)`
        : CHART.series1,
      radius: row.amount >= 0 ? '12px 12px 4px 4px' : '4px 4px 12px 12px',
    };
  });

  return (
    <div className="rounded-lg bg-neutral-100 px-6 pb-4 pt-6">
      <div
        className="grid grid-cols-[64px_1fr] gap-x-3"
        role="img"
        aria-label={`Obligations by fiscal year: ${bars.map((bar) => bar.title).join('; ')}`}
      >
        <div className="relative h-[240px]" aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick.top}
              className="absolute right-0 -translate-y-1/2 text-xs text-neutral-700"
              style={{ top: `${tick.top}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>

        <div className="relative h-[240px]">
          {ticks.map((tick) => (
            <div
              key={tick.top}
              className="absolute inset-x-0 border-t border-dashed"
              style={{ top: `${tick.top}%`, borderColor: CHART.grid }}
            />
          ))}
          <div
            className="absolute inset-x-0 border-t-[1.5px] border-neutral-600"
            style={{ top: `${y(0)}%` }}
          />
          <div className="absolute inset-0 flex gap-[4%] px-[2%]">
            {bars.map((bar) => (
              <div
                key={bar.key}
                title={bar.title}
                className="relative flex-1 rounded-[14px] transition-colors duration-[var(--duration-hover)] hover:bg-tint"
              >
                <div
                  className="absolute inset-x-[10%] min-h-[2px]"
                  style={{
                    top: `${bar.top}%`,
                    height: `${bar.height}%`,
                    background: bar.fill,
                    borderRadius: bar.radius,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div />
        <div className="flex gap-[4%] px-[2%] pt-2.5" aria-hidden="true">
          {bars.map((bar) => (
            <span key={bar.key} className="flex-1 text-center text-xs text-neutral-700">
              {bar.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
