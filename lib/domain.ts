/** Domain constants shared by the schema, server actions, and client forms. */

export const SIDES = ["port", "starboard", "both", "scull"] as const;
export type Side = (typeof SIDES)[number];

export const SESSION_TYPES = ["water", "erg", "weights", "cross-training"] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const TEST_TYPES = ["2k", "5k", "6k", "30min"] as const;
export type TestType = (typeof TEST_TYPES)[number];

/** Meters for the fixed-distance tests; 30min is distance-for-time. */
export const TEST_DISTANCES: Record<Exclude<TestType, "30min">, number> = {
  "2k": 2000,
  "5k": 5000,
  "6k": 6000,
};

export const SIDE_LABEL: Record<Side, string> = {
  port: "Port",
  starboard: "Starboard",
  both: "Both sides",
  scull: "Scull",
};

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  water: "On water",
  erg: "Erg",
  weights: "Weights",
  "cross-training": "Cross-training",
};
