import { api } from "./api";
import type { BloodGroup } from "./mock-data";

interface List<T> {
  data: T[];
  meta?: { total: number };
}

function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : "";
}

// ---------- Inventory ----------
export interface BloodUnit {
  id: string;
  unitCode: string;
  bloodGroup: BloodGroup;
  component: string;
  donorNumber?: string;
  storageLocation?: string;
  collectedOn?: string;
  expiresOn: string;
  status: "available" | "reserved" | "issued" | "expired" | "discarded";
  days_to_expiry: number;
}

export const listInventory = (p: { group?: string; q?: string }) =>
  api<List<BloodUnit>>(`/inventory${qs({ ...p, per_page: 100, sort: "expiresOn" })}`);

export const createUnits = (body: {
  bloodGroup: BloodGroup;
  quantity: number;
  collectedOn?: string;
  expiresOn: string;
  donorNumber?: string;
  storageLocation?: string;
}) => api<{ data: BloodUnit[] }>("/inventory", { method: "POST", body: JSON.stringify(body) });

// ---------- Search ----------
export interface SearchResult {
  institution: {
    id: string;
    name: string;
    type: "hospital" | "laboratory";
    city: string;
    province: string;
    phone?: string;
    blood_dept_contact?: string;
  };
  group: BloodGroup;
  available: number;
}

export const searchBlood = (p: { group: string; min_quantity: number; province?: string }) =>
  api<List<SearchResult>>(`/search/blood${qs(p)}`);

// ---------- Enquiries ----------
export type EnquiryStatus = "pending" | "approved" | "declined" | "fulfilled" | "cancelled";

interface RawTenant {
  _id: string;
  name: string;
}
interface RawEnquiry {
  _id: string;
  reference: string;
  kind: "enquiry" | "order";
  bloodGroup: BloodGroup;
  quantity: number;
  message?: string;
  status: EnquiryStatus;
  fromTenantId: RawTenant | string;
  toTenantId: RawTenant | string;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  reference: string;
  kind: "enquiry" | "order";
  group: BloodGroup;
  quantity: number;
  notes: string;
  status: EnquiryStatus;
  fromName: string;
  toName: string;
  createdAt: string;
}

const tenantName = (t: RawTenant | string) => (typeof t === "string" ? "—" : t.name);

export async function listEnquiries(direction: "received" | "sent") {
  const res = await api<List<RawEnquiry>>(`/enquiries${qs({ direction, per_page: 100 })}`);
  return res.data.map<Enquiry>((e) => ({
    id: e._id,
    reference: e.reference,
    kind: e.kind,
    group: e.bloodGroup,
    quantity: e.quantity,
    notes: e.message ?? "",
    status: e.status,
    fromName: tenantName(e.fromTenantId),
    toName: tenantName(e.toTenantId),
    createdAt: e.createdAt,
  }));
}

export const createEnquiry = (body: {
  supplier_id: string;
  kind: "enquiry" | "order";
  group: BloodGroup;
  quantity: number;
  notes?: string;
}) =>
  api<{ data: RawEnquiry }>("/enquiries", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(body),
  });

export const enquiryAction = (id: string, action: "approve" | "decline" | "fulfil", reason?: string) =>
  api(`/enquiries/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify(action === "decline" ? { reason: reason || "Declined by supplier" } : {}),
  });

// ---------- Staff ----------
export interface Staff {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  role: "hospital_admin" | "staff" | "super_admin";
  status: "active" | "suspended";
}

export type StaffInput = Pick<Staff, "fullName" | "email" | "phone" | "department" | "designation"> & {
  role: "hospital_admin" | "staff";
};

export const listStaff = () => api<List<Staff>>(`/staff${qs({ per_page: 100 })}`);
export const createStaff = (body: StaffInput) =>
  api<{ data: Staff; temporary_password?: string }>("/staff", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateStaff = (id: string, body: Partial<StaffInput>) =>
  api<{ data: Staff }>(`/staff/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const setStaffStatus = (id: string, action: "suspend" | "activate") =>
  api(`/staff/${id}/${action}`, { method: "POST" });
export const deleteStaff = (id: string) => api(`/staff/${id}`, { method: "DELETE" });

// ---------- Dashboard / analytics ----------
export interface InventorySummary {
  total_units: number;
  available: number;
  reserved: number;
  expiring_soon: number;
  critical_groups: BloodGroup[];
  by_group: Record<BloodGroup, number>;
}
export const getInventorySummary = () => api<{ data: InventorySummary }>("/inventory/summary").then((r) => r.data);
export const getExpiring = (days: number) =>
  api<{ data: BloodUnit[] }>(`/inventory/expiring${qs({ days })}`).then((r) => r.data);
export const getEnquiryStats = () =>
  api<{ data: Partial<Record<EnquiryStatus, number>> }>("/analytics/enquiries").then((r) => r.data);
export const getDistribution = () =>
  api<{ data: { group: BloodGroup; units: number }[] }>("/analytics/distribution").then((r) => r.data);
export const getTrends = (metric: "inflow" | "issued" | "expired", period: "7d" | "30d" | "90d") =>
  api<{ data: { date: string; units: number }[] }>(`/analytics/trends${qs({ metric, period })}`).then((r) => r.data);

// ---------- Notifications ----------
export interface AppNotification {
  _id: string;
  title: string;
  body?: string;
  severity: "info" | "warning" | "critical";
  readAt: string | null;
  createdAt: string;
}
export const listNotifications = () =>
  api<{ data: AppNotification[]; unread: number }>(`/notifications${qs({ per_page: 50 })}`);
export const markNotificationRead = (id: string) => api(`/notifications/${id}/read`, { method: "POST" });
export const markAllNotificationsRead = () => api("/notifications/read-all", { method: "POST" });

// ---------- Super admin ----------
export interface AdminOverview {
  hospitals: number;
  laboratories: number;
  users: number;
  pending_enquiries: number;
  national_stock: Partial<Record<BloodGroup, number>>;
  total_units: number;
}
export const getAdminOverview = () => api<{ data: AdminOverview }>("/admin/overview").then((r) => r.data);

export interface Institution {
  id: string;
  code: string;
  name: string;
  type: "hospital" | "laboratory";
  province: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  bloodDeptContact?: string;
  status: "active" | "suspended";
  stock: Record<BloodGroup, number>;
  total_units: number;
  staff_count: number;
}
export type InstitutionInput = {
  name: string;
  type: "hospital" | "laboratory";
  province: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  bloodDeptContact?: string;
};
export const listInstitutions = (type?: "hospital" | "laboratory") =>
  api<List<Institution>>(`/institutions${qs({ type, per_page: 100, sort: "name" })}`).then((r) => r.data);
export const createInstitution = (body: InstitutionInput) =>
  api("/institutions", { method: "POST", body: JSON.stringify(body) });
export const updateInstitution = (id: string, body: Partial<InstitutionInput>) =>
  api(`/institutions/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const setInstitutionStatus = (id: string, status: "active" | "suspended") =>
  api(`/institutions/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteInstitution = (id: string) => api(`/institutions/${id}`, { method: "DELETE" });

export interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: "super_admin" | "hospital_admin" | "staff";
  status: "active" | "suspended";
  tenantId: { _id: string; name: string } | null;
}
export type AdminUserInput = {
  fullName: string;
  email: string;
  role: AdminUser["role"];
  tenantId: string | null;
};
export const listAdminUsers = () => api<List<AdminUser>>(`/admin/users${qs({ per_page: 100 })}`).then((r) => r.data);
export const createAdminUser = (body: AdminUserInput) =>
  api<{ data: AdminUser; temporary_password?: string }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updateAdminUser = (id: string, body: Partial<AdminUserInput>) =>
  api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const setAdminUserStatus = (id: string, action: "suspend" | "activate") =>
  api(`/admin/users/${id}/${action}`, { method: "POST" });
export const deleteAdminUser = (id: string) => api(`/admin/users/${id}`, { method: "DELETE" });

export interface AuditLog {
  _id: string;
  action: string;
  entity: string;
  createdAt: string;
  actorId: { fullName: string } | null;
}
export const listAuditLogs = () => api<List<AuditLog>>(`/admin/audit-logs${qs({ per_page: 8 })}`).then((r) => r.data);

export function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export function emptyStock(): Record<BloodGroup, number> {
  return { "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0 };
}
