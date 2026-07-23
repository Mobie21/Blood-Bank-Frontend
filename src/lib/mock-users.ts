import type { Role } from "./tenant-context";

export interface MockUser {
  email: string;
  password: string;
  name: string;
  role: Role;
  institution: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    email: "amara@haemocentral.gov.zw",
    password: "admin123",
    name: "Amara Nyathi",
    role: "super_admin",
    institution: "National Blood Service Zimbabwe",
  },
  {
    email: "tendai.chikomo@parirenyatwa.co.zw",
    password: "hospital123",
    name: "Dr. Tendai Chikomo",
    role: "hospital_admin",
    institution: "Parirenyatwa Group of Hospitals",
  },
  {
    email: "chipo@lancet.co.zw",
    password: "lab123",
    name: "Chipo Marufu",
    role: "lab_admin",
    institution: "Lancet Clinical Laboratories",
  },
];

export function findUser(email: string, password: string): MockUser | undefined {
  return MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
}
