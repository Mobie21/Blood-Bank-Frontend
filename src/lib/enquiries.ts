import type { BloodGroup } from "@/lib/mock-data";

export type EnquiryKind = "enquiry" | "order";
export type EnquiryStatus = "pending" | "approved" | "declined" | "fulfilled";

export interface Enquiry {
  id: string;
  reference: string;
  kind: EnquiryKind;
  group: BloodGroup;
  quantity: number;
  notes: string;
  /** Institution the request was sent to */
  supplierId: string;
  supplierName: string;
  /** Institution / user who raised the request */
  requesterTenantId: string;
  requesterTenantName: string;
  requesterName: string;
  status: EnquiryStatus;
  createdAt: string;
}

const KEY = "haemocentral.enquiries";

const SEED: Enquiry[] = [
  {
    id: "e_001",
    reference: "ENQ-480213",
    kind: "order",
    group: "O-",
    quantity: 12,
    notes: "Theatre reserve for scheduled caesarean list.",
    supplierId: "h_002",
    supplierName: "Mpilo Central Hospital",
    requesterTenantId: "h_001",
    requesterTenantName: "Parirenyatwa Group of Hospitals",
    requesterName: "Dr. Tendai Chikomo",
    status: "approved",
    createdAt: "2026-08-21T09:15:00Z",
  },
  {
    id: "e_002",
    reference: "ENQ-480199",
    kind: "enquiry",
    group: "AB+",
    quantity: 0,
    notes: "Checking availability ahead of transfer from Gweru.",
    supplierId: "h_003",
    supplierName: "United Bulawayo Hospitals",
    requesterTenantId: "h_001",
    requesterTenantName: "Parirenyatwa Group of Hospitals",
    requesterName: "Dr. Tendai Chikomo",
    status: "pending",
    createdAt: "2026-08-22T14:02:00Z",
  },
  {
    id: "e_003",
    reference: "ENQ-480167",
    kind: "order",
    group: "A+",
    quantity: 6,
    notes: "Paediatric ward — urgent.",
    supplierId: "h_001",
    supplierName: "Parirenyatwa Group of Hospitals",
    requesterTenantId: "h_004",
    requesterTenantName: "Chitungwiza Central Hospital",
    requesterName: "Sister Rudo Mavhunga",
    status: "pending",
    createdAt: "2026-08-23T07:41:00Z",
  },
  {
    id: "e_004",
    reference: "ENQ-480102",
    kind: "order",
    group: "B-",
    quantity: 4,
    notes: "Replacement stock after emergency use.",
    supplierId: "h_001",
    supplierName: "Parirenyatwa Group of Hospitals",
    requesterTenantId: "l_001",
    requesterTenantName: "Lancet Clinical Laboratories",
    requesterName: "Aisha Moyo",
    status: "fulfilled",
    createdAt: "2026-08-19T11:20:00Z",
  },
];

export function loadEnquiries(): Enquiry[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    const parsed = JSON.parse(raw) as Enquiry[];
    return Array.isArray(parsed) ? parsed : SEED;
  } catch {
    return SEED;
  }
}

export function saveEnquiries(list: Enquiry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function addEnquiry(entry: Omit<Enquiry, "id" | "createdAt">) {
  const record: Enquiry = {
    ...entry,
    id: `e_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [record, ...loadEnquiries()];
  saveEnquiries(next);
  return record;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
