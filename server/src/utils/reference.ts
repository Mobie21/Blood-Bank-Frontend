import { randomInt } from "crypto";

export function enquiryReference(): string {
  return `ENQ-${randomInt(100000, 999999)}`;
}

export function unitCode(): string {
  return `BB-${randomInt(1000, 9999)}${randomInt(10, 99)}`;
}
