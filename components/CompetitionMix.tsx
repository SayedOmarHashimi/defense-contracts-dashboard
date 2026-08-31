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
        <div className="flex h-3 w-full gap-[2px] overflow-hidden" aria-hidden="true">
          {segments.map((segment) => (
            <div
              key={segment.label}
              style={{
                backgroundColor: segment.color,
                width: `${(segment.fraction ?? 0) * 100}%`,
              }}
              className="first:rounded-l last:rounded-r"
            />
          ))}
        </div>
      )}

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {segments.map((segment) => (
          <div key={segment.label}>
            <dt className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: segment.color }}
              />
              {segment.label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
              {plottable ? formatPercent(segment.fraction) : '—'}
            </dd>
            <dd className="text-sm tabular-nums text-gray-600">{formatExactUsd(segment.amount)}</dd>
            <dd className="mt-1 text-xs text-gray-500">{segment.hint}</dd>
          </div>
        ))}
      </dl>

      {!plottable && (
        <p className="mt-3 text-xs text-gray-500">
          Net deobligations make a percentage split meaningless here; amounts are shown instead.
        </p>
      )}
    </div>
  );
}
