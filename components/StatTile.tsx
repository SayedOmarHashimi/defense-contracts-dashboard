import type { ReactNode } from 'react';

type Tone = 'default' | 'sage' | 'terracotta';

const TONES: Record<Tone, { tile: string; label: string; value: string; detail: string }> = {
  default: {
    tile: 'bg-surface',
    label: 'text-neutral-700',
    value: 'text-ink',
    detail: 'text-neutral-700',
  },
  sage: {
    tile: 'bg-accent-2-200',
    label: 'text-accent-2-800',
    value: 'text-accent-2-900',
    detail: 'text-accent-2-800',
  },
  terracotta: {
    tile: 'bg-accent-200',
    label: 'text-accent-800',
    value: 'text-accent-900',
    detail: 'text-accent-800',
  },
};

/**
 * A headline figure on a surface tile. `display` values are set in the
 * heading face; `text` values are for dates and phrases that read better in
 * the body face. Pass `description` when the tile sits inside a <dl>.
 */
export default function StatTile({
  label,
  value,
  detail,
  tone = 'default',
  size = 'display',
  description = false,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: Tone;
  size?: 'display' | 'text';
  description?: boolean;
}) {
  const colors = TONES[tone];
  const Term = description ? 'dt' : 'p';
  const Desc = description ? 'dd' : 'p';
  const valueClass =
    size === 'display'
      ? 'font-heading text-[30px] leading-[1.15]'
      : 'text-[15px] font-semibold leading-[1.55]';

  return (
    <div className={`flex flex-col gap-1 rounded-card px-[22px] py-5 ${colors.tile}`}>
      <Term className={`text-[13px] ${colors.label}`}>{label}</Term>
      <Desc className={`${valueClass} ${colors.value}`}>{value}</Desc>
      {detail && <Desc className={`text-xs ${colors.detail}`}>{detail}</Desc>}
    </div>
  );
}
