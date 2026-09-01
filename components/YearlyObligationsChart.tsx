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

import { CHART, domainIncludingZero } from '@/lib/chartTheme';
import { formatCompactUsd, formatExactUsd } from '@/lib/format';
import type { YearlyTotal } from '@/lib/data';

export default function YearlyObligationsChart({
  data,
  partialFiscalYear,
}: {
  data: YearlyTotal[];
  partialFiscalYear: number | null;
}) {
  // The in-progress year is marked rather than hidden: an unlabelled short
  // final bar reads as collapsed spending instead of an incomplete year.
  const rows = data.map((row) => ({
    ...row,
    label: `FY${row.fiscal_year}${row.fiscal_year === partialFiscalYear ? '*' : ''}`,
    partial: row.fiscal_year === partialFiscalYear,
  }));
  const hasAnyObligation = rows.some((row) => row.amount !== 0);
  // Deobligations net out to a negative year for some contractors, so the
  // domain has to reach below zero rather than start at it.
  const hasNegative = rows.some((row) => row.amount < 0);

  if (!hasAnyObligation) {
    return <p className="py-8 text-sm text-gray-600">No obligations recorded in this window.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: CHART.axisText, fontSize: 12 }}
          axisLine={{ stroke: CHART.grid }}
          tickLine={false}
        />
        <YAxis
          domain={domainIncludingZero(rows.map((row) => row.amount))}
          tickFormatter={(value: number) => formatCompactUsd(value)}
          tick={{ fill: CHART.axisText, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        {hasNegative && <ReferenceLine y={0} stroke={CHART.axisText} />}
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          formatter={(value) => [
            formatExactUsd(typeof value === 'number' ? value : 0),
            'Obligated',
          ]}
          contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${CHART.grid}` }}
        />
        <Bar
          dataKey="amount"
          fill={CHART.series1}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
