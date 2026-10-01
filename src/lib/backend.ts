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
