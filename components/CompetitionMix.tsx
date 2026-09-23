import { CHART } from '@/lib/chartTheme';
import { formatExactUsd, formatPercent } from '@/lib/format';
import type { CompetitionMix as CompetitionMixData } from '@/lib/data';

/**
 * A two-part proportion. Plain markup rather than a chart library: it carries
 * no axis and no hover detail beyond the labels already on screen.
 */
export default function CompetitionMix({ data }: { data: CompetitionMixData }) {
  const segments = [
    {
      label: 'Competed',
      hint: 'Full and open, or competed under simplified acquisition',
      amount: data.competed_amount,
      fraction: data.competed_pct,
      color: CHART.series1,
    },
    {
      label: 'Sole-source',
      hint: 'Not competed, or a follow-on to a competed action',
      amount: data.not_competed_amount,
      fraction: data.not_competed_pct,
      color: CHART.series2,
    },
  ];

  // Percentages only mean something when both parts are non-negative.
  const plottable =
    segments.every((segment) => segment.amount >= 0) &&
    segments.some((segment) => segment.amount > 0);

  return (
    <div>
      {plottable && (
        <div
          className="flex h-[18px] w-full gap-[3px] overflow-hidden rounded-pill"
          aria-hidden="true"
        >
          {segments.map((segment) => (
            <div
              key={segment.label}
              style={{
                backgroundColor: segment.color,
                width: `${(segment.fraction ?? 0) * 100}%`,
              }}
            />
          ))}
        </div>
      )}

      <dl className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="flex flex-col gap-0.5 rounded-card bg-surface px-[22px] py-[18px]"
          >
            <dt className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {segment.label}
            </dt>
            <dd className="mt-1 font-heading text-[30px] leading-[1.15]">
              {plottable ? formatPercent(segment.fraction) : '—'}
            </dd>
            <dd className="text-sm text-neutral-800">{formatExactUsd(segment.amount)}</dd>
            <dd className="mt-1 text-xs text-neutral-700">{segment.hint}</dd>
          </div>
        ))}
      </dl>

      {!plottable && (
        <p className="mt-3 text-xs text-neutral-700">
          Net deobligations make a percentage split meaningless here; amounts are shown instead.
        </p>
      )}
    </div>
  );
}
