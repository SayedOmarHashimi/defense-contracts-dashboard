'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
    return <p className="py-8 text-sm text-gray-600">No agency breakdown available.</p>;
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

  const hasNegative = rows.some((row) => row.amount < 0);

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 38 + 40)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke={CHART.grid} horizontal={false} />
        <XAxis
          type="number"
          domain={domainIncludingZero(rows.map((row) => row.amount))}
          tickFormatter={(value: number) => formatCompactUsd(value)}
          tick={{ fill: CHART.axisText, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: CHART.axisText, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={132}
        />
        {hasNegative && <ReferenceLine x={0} stroke={CHART.axisText} />}
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          formatter={(value) => [
            formatExactUsd(typeof value === 'number' ? value : 0),
            'Obligated',
          ]}
          labelFormatter={(_label, payload) =>
            (payload?.[0]?.payload as { full?: string } | undefined)?.full ?? ''
          }
          contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${CHART.grid}` }}
        />
        <Bar
          dataKey="amount"
          fill={CHART.series1}
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
