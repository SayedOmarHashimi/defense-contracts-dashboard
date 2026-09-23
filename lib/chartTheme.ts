/**
 * Chart tokens from the Organic design system. Slots 1 and 2 are the only
 * categorical hues used: terracotta and sage.
 *
 * Magnitude charts (obligations by year, obligations by agency) use a single
 * hue on purpose: colouring those by rank would tie colour to position rather
 * than to an entity.
 */
export const CHART = {
  /** Categorical slot 1 - also the single hue for magnitude charts. */
  series1: '#c67139',
  /** Light step of slot 1, used for the hatching on a partial year. */
  series1Light: '#ffc6a5',
  /** Categorical slot 2. */
  series2: '#7a8a5e',
  /** Net deobligations: a neutral, so a negative bar never reads as a series. */
  negative: '#a19786',
  grid: '#dcd3c4',
  axisText: '#645c50',
  surface: '#f9f4ed',
} as const;

/** Beyond this many agencies the remainder folds into a single "Other" bar. */
export const AGENCY_LIMIT = 7;

/**
 * Axis domain that always includes zero but never extends past the data.
 * Rounding outward would, on a contractor whose worst year is -$2.7M against
 * a $17B peak, reserve a third of the plot for empty negative space.
 */
export function domainIncludingZero(values: number[]): [number, number] {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  return [min, max === min ? 1 : max];
}
