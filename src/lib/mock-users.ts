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
    email: "amara@haemocentral.gov",
    password: "admin123",
    name: "Amara Okonkwo",
    role: "super_admin",
    institution: "National Health Authority",
  },
  {
    email: "aris.thorne@stjude.med",
    password: "hospital123",
    name: "Dr. Aris Thorne",
    role: "hospital_admin",
    institution: "St. Jude Medical Center",
  },
  {
    email: "aisha@meridian.lab",
    password: "lab123",
    name: "Aisha Bakari",
    role: "lab_admin",
    institution: "Meridian Diagnostics Lab",
  },
];

export function findUser(email: string, password: string): MockUser | undefined {
  return MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
}
