export const REQUEST_CONSTANTS = {
  TIMEOUT_HOURS: 24,
  TIMEOUT_MS: 24 * 60 * 60 * 1000,
} as const;

export const REQUEST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export type RequestStatus =
  (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];
