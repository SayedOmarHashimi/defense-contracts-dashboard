/**
 * Chart tokens. Values come from the validated reference palette; slots 1 and 2
 * are the only categorical hues used, and they clear the CVD and normal-vision
 * gates as an adjacent pair.
 *
 * Magnitude charts (obligations by year, obligations by agency) use a single
 * hue on purpose: colouring those by rank would tie colour to position rather
 * than to an entity.
 */
export const CHART = {
  /** Categorical slot 1 - also the single hue for magnitude charts. */
  series1: '#2a78d6',
  /** Categorical slot 2. */
  series2: '#eb6834',
  grid: '#e5e7eb',
  axisText: '#52514e',
  surface: '#ffffff',
} as const;

/** Beyond this many agencies the remainder folds into a single "Other" bar. */
export const AGENCY_LIMIT = 7;

/**
 * Axis domain that always includes zero but never extends past the data.
 * Recharts' automatic domain rounds outward, which on a contractor whose
 * worst year is -$2.7M against a $17B peak reserves a third of the plot for
 * empty negative space.
 */
export function domainIncludingZero(values: number[]): [number, number] {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  return [min, max === min ? 1 : max];
}
