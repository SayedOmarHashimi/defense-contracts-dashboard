/** Scope shared by the Python pipeline and the live TypeScript client.
 *  Keep in sync with pipeline/config.py. */
export const AWARD_TYPE_CODES = ['A', 'B', 'C', 'D'];

export const AWARDING_AGENCY = {
  type: 'awarding',
  tier: 'toptier',
  name: 'Department of Defense',
} as const;
