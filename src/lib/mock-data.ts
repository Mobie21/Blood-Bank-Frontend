export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export interface BloodUnit {
  id: string;
  group: BloodGroup;
  quantity: number;
  collectionDate: string;
  expiryDate: string;
  donorNumber: string;
  storageLocation: string;
  status: "available" | "reserved" | "expired";
}

export interface Hospital {
  id: string;
  code: string;
  name: string;
  type: "hospital" | "laboratory";
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  country: string;
  bloodDeptContact: string;
  status: "active" | "inactive";
  stock: Record<BloodGroup, number>;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: "hospital_admin" | "staff" | "technician";
  status: "active" | "inactive";
}

export interface ActivityItem {
  id: string;
  kind: "inbound" | "issued" | "audit" | "alert" | "enquiry";
  message: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  read: boolean;
}

export const HOSPITALS: Hospital[] = [
  {
    id: "h_001",
    code: "PARI-01",
    name: "Parirenyatwa Group of Hospitals",
    type: "hospital",
    email: "bloodbank@parirenyatwa.co.zw",
    phone: "+263 242 701 555",
    address: "Mazowe Street",
    city: "Harare",
    province: "Harare",
    country: "Zimbabwe",
    bloodDeptContact: "Dr. Tendai Chikomo",
    status: "active",
    stock: { "A+": 210, "A-": 42, "B+": 168, "B-": 22, "AB+": 65, "AB-": 14, "O+": 245, "O-": 38 },
  },
  {
    id: "h_002",
    code: "SMCH-02",
    name: "Sally Mugabe Central Hospital",
    type: "hospital",
    email: "transfusion@smch.co.zw",
    phone: "+263 242 621 111",
    address: "Lobengula Road, Southerton",
    city: "Harare",
    province: "Harare",
    country: "Zimbabwe",
    bloodDeptContact: "Dr. Rutendo Moyo",
    status: "active",
    stock: { "A+": 180, "A-": 30, "B+": 110, "B-": 18, "AB+": 44, "AB-": 9, "O+": 300, "O-": 62 },
  },
  {
    id: "h_003",
    code: "MPILO-03",
    name: "Mpilo Central Hospital",
    type: "hospital",
    email: "bloodbank@mpilo.co.zw",
    phone: "+263 292 271 195",
    address: "Vera Road, Mzilikazi",
    city: "Bulawayo",
    province: "Bulawayo",
    country: "Zimbabwe",
    bloodDeptContact: "Dr. Nkosana Ndlovu",
    status: "active",
    stock: { "A+": 92, "A-": 12, "B+": 74, "B-": 6, "AB+": 20, "AB-": 3, "O+": 130, "O-": 15 },
  },
  {
    id: "h_004",
    code: "UBH-04",
    name: "United Bulawayo Hospitals",
    type: "hospital",
    email: "transfusion@ubh.co.zw",
    phone: "+263 292 251 111",
    address: "St. Lukes Avenue, Belmont",
    city: "Bulawayo",
    province: "Bulawayo",
    country: "Zimbabwe",
    bloodDeptContact: "Dr. Sibongile Dube",
    status: "active",
    stock: { "A+": 60, "A-": 8, "B+": 55, "B-": 4, "AB+": 15, "AB-": 2, "O+": 88, "O-": 11 },
  },
  {
    id: "h_005",
    code: "MUT-05",
    name: "Mutare Provincial Hospital",
    type: "hospital",
    email: "bloodbank@mutarehosp.co.zw",
    phone: "+263 202 060 340",
    address: "Third Street",
    city: "Mutare",
    province: "Manicaland",
    country: "Zimbabwe",
    bloodDeptContact: "Dr. Farai Mutasa",
    status: "active",
    stock: { "A+": 55, "A-": 7, "B+": 40, "B-": 3, "AB+": 12, "AB-": 2, "O+": 78, "O-": 9 },
  },
  {
    id: "l_001",
    code: "LNCT-L1",
    name: "Lancet Clinical Laboratories",
    type: "laboratory",
    email: "harare@lancet.co.zw",
    phone: "+263 242 700 401",
    address: "9 Kwame Nkrumah Avenue",
    city: "Harare",
    province: "Harare",
    country: "Zimbabwe",
    bloodDeptContact: "Chipo Marufu",
    status: "active",
    stock: { "A+": 44, "A-": 6, "B+": 32, "B-": 3, "AB+": 12, "AB-": 2, "O+": 60, "O-": 9 },
  },
  {
    id: "l_002",
    code: "PSML-L2",
    name: "PSMAS Medlab Bulawayo",
    type: "laboratory",
    email: "medlab@psmas.co.zw",
    phone: "+263 292 886 210",
    address: "12 Fife Street",
    city: "Bulawayo",
    province: "Bulawayo",
    country: "Zimbabwe",
    bloodDeptContact: "Tawanda Sibanda",
    status: "active",
    stock: { "A+": 70, "A-": 10, "B+": 48, "B-": 5, "AB+": 18, "AB-": 3, "O+": 92, "O-": 14 },
  },
];

function daysFromNow(d: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
}

export const INVENTORY: BloodUnit[] = [
  { id: "BB-9201", group: "O-", quantity: 1, collectionDate: daysFromNow(-38), expiryDate: daysFromNow(1), donorNumber: "D-4471", storageLocation: "Rack A-2", status: "available" },
  { id: "BB-8842", group: "A+", quantity: 1, collectionDate: daysFromNow(-36), expiryDate: daysFromNow(2), donorNumber: "D-4402", storageLocation: "Rack A-1", status: "available" },
  { id: "BB-7721", group: "B-", quantity: 1, collectionDate: daysFromNow(-34), expiryDate: daysFromNow(3), donorNumber: "D-4318", storageLocation: "Rack B-3", status: "available" },
  { id: "BB-7712", group: "O+", quantity: 1, collectionDate: daysFromNow(-20), expiryDate: daysFromNow(15), donorNumber: "D-4501", storageLocation: "Rack C-1", status: "available" },
  { id: "BB-7699", group: "AB+", quantity: 1, collectionDate: daysFromNow(-18), expiryDate: daysFromNow(17), donorNumber: "D-4522", storageLocation: "Rack D-2", status: "reserved" },
  { id: "BB-7650", group: "A-", quantity: 1, collectionDate: daysFromNow(-15), expiryDate: daysFromNow(20), donorNumber: "D-4577", storageLocation: "Rack A-4", status: "available" },
  { id: "BB-7601", group: "B+", quantity: 1, collectionDate: daysFromNow(-10), expiryDate: daysFromNow(25), donorNumber: "D-4610", storageLocation: "Rack B-1", status: "available" },
  { id: "BB-7580", group: "O+", quantity: 1, collectionDate: daysFromNow(-8), expiryDate: daysFromNow(27), donorNumber: "D-4622", storageLocation: "Rack C-2", status: "available" },
  { id: "BB-7550", group: "AB-", quantity: 1, collectionDate: daysFromNow(-6), expiryDate: daysFromNow(29), donorNumber: "D-4640", storageLocation: "Rack D-1", status: "available" },
  { id: "BB-7541", group: "A+", quantity: 1, collectionDate: daysFromNow(-4), expiryDate: daysFromNow(31), donorNumber: "D-4655", storageLocation: "Rack A-3", status: "available" },
];

export const STAFF: StaffMember[] = [
  { id: "s_1", name: "Dr. Tendai Chikomo", email: "tendai@parirenyatwa.co.zw", phone: "+263 772 100 001", department: "Haematology", position: "Chief Administrator", role: "hospital_admin", status: "active" },
  { id: "s_2", name: "Nurse Rumbidzai Mangwiro", email: "rumbidzai@parirenyatwa.co.zw", phone: "+263 772 100 002", department: "Blood Bank", position: "Senior Nurse", role: "staff", status: "active" },
  { id: "s_3", name: "Tatenda Chirwa", email: "tatenda@parirenyatwa.co.zw", phone: "+263 772 100 003", department: "Laboratory", position: "Technician", role: "technician", status: "active" },
  { id: "s_4", name: "Blessing Mudenda", email: "blessing@parirenyatwa.co.zw", phone: "+263 772 100 004", department: "Blood Bank", position: "Coordinator", role: "staff", status: "active" },
  { id: "s_5", name: "Munyaradzi Zvobgo", email: "munya@parirenyatwa.co.zw", phone: "+263 772 100 005", department: "Emergency", position: "Nurse", role: "staff", status: "inactive" },
];

export const ACTIVITY: ActivityItem[] = [
  { id: "a1", kind: "inbound", message: "New inbound transfer: 12 units O+ from Sally Mugabe Central Hospital", timestamp: "14 minutes ago" },
  { id: "a2", kind: "issued", message: "Emergency request fulfilled for Ward 4 (Surgery)", timestamp: "1 hour ago" },
  { id: "a3", kind: "audit", message: "Weekly audit completed by Dr. Chikomo", timestamp: "3 hours ago" },
  { id: "a4", kind: "alert", message: "AB- supply below emergency threshold", timestamp: "5 hours ago" },
  { id: "a5", kind: "enquiry", message: "Mpilo Central Hospital enquired about O- units", timestamp: "Yesterday" },
];

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", title: "Critical stock: O-", body: "Only 38 units remaining. Consider requesting from network.", severity: "critical", timestamp: "10 min ago", read: false },
  { id: "n2", title: "Expiring units", body: "3 units expiring within 72 hours.", severity: "warning", timestamp: "1 hour ago", read: false },
  { id: "n3", title: "New enquiry", body: "Mpilo Central Hospital enquired about O- units.", severity: "info", timestamp: "Yesterday", read: true },
  { id: "n4", title: "Staff account update", body: "Munyaradzi Zvobgo was deactivated by admin.", severity: "info", timestamp: "2 days ago", read: true },
];

export function totalStock(stock: Record<BloodGroup, number>) {
  return BLOOD_GROUPS.reduce((sum, g) => sum + stock[g], 0);
}
