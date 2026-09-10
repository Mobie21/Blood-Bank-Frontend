export const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const ROLES = ["super_admin", "hospital_admin", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const INSTITUTION_TYPES = ["hospital", "laboratory"] as const;
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

export const ENTITY_STATUS = ["active", "suspended"] as const;
export type EntityStatus = (typeof ENTITY_STATUS)[number];

export const UNIT_STATUS = ["available", "reserved", "issued", "expired", "quarantined"] as const;
export type UnitStatus = (typeof UNIT_STATUS)[number];

export const COMPONENTS = ["whole_blood", "packed_cells", "plasma", "platelets"] as const;
export type Component = (typeof COMPONENTS)[number];

export const ENQUIRY_KINDS = ["enquiry", "order"] as const;
export type EnquiryKind = (typeof ENQUIRY_KINDS)[number];

export const ENQUIRY_STATUS = ["pending", "approved", "declined", "fulfilled", "cancelled"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUS)[number];

export const PRIORITIES = ["routine", "urgent", "emergency"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const MOVEMENT_TYPES = [
  "add",
  "issue",
  "reserve",
  "release",
  "expire",
  "transfer_out",
  "transfer_in",
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "enquiry_new",
  "enquiry_response",
  "order_fulfilled",
  "stock_critical",
  "stock_expiring",
  "user_added",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
