import bcrypt from "bcryptjs";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/db";
import {
  AlertThresholdModel,
  AuditLogModel,
  BloodUnitModel,
  EnquiryMessageModel,
  EnquiryModel,
  InstitutionModel,
  NotificationModel,
  SessionModel,
  StockLevelModel,
  StockMovementModel,
  UserModel,
} from "./models";
import { recomputeAllStockLevels } from "./services/stock.service";
import { BLOOD_GROUPS } from "./types/enums";
import { unitCode } from "./utils/reference";

const INSTITUTIONS = [
  { code: "HSP-001", name: "Parirenyatwa Group of Hospitals", type: "hospital", province: "Harare", city: "Harare", phone: "+263 242 701 555", email: "info@parirenyatwa.co.zw" },
  { code: "HSP-002", name: "Mpilo Central Hospital", type: "hospital", province: "Bulawayo", city: "Bulawayo", phone: "+263 292 212 011", email: "info@mpilo.co.zw" },
  { code: "HSP-003", name: "Sally Mugabe Central Hospital", type: "hospital", province: "Harare", city: "Harare", phone: "+263 242 621 100", email: "info@smch.co.zw" },
  { code: "HSP-004", name: "Mutare Provincial Hospital", type: "hospital", province: "Manicaland", city: "Mutare", phone: "+263 20 206 4311", email: "info@mutarehospital.co.zw" },
  { code: "HSP-005", name: "Gweru Provincial Hospital", type: "hospital", province: "Midlands", city: "Gweru", phone: "+263 54 222 1301", email: "info@gweruhospital.co.zw" },
  { code: "LAB-001", name: "Lancet Laboratories Zimbabwe", type: "laboratory", province: "Harare", city: "Harare", phone: "+263 242 700 521", email: "info@lancet.co.zw" },
  { code: "LAB-002", name: "PSMI Laboratories", type: "laboratory", province: "Harare", city: "Harare", phone: "+263 242 250 123", email: "lab@psmi.co.zw" },
] as const;

async function main() {
  await connectDatabase();
  console.log("Clearing collections…");
  await Promise.all(
    [AlertThresholdModel, AuditLogModel, BloodUnitModel, EnquiryMessageModel, EnquiryModel, InstitutionModel, NotificationModel, SessionModel, StockLevelModel, StockMovementModel, UserModel].map((m) => (m as unknown as { deleteMany: (f: object) => Promise<unknown> }).deleteMany({})),
  );

  const institutions = await InstitutionModel.insertMany(INSTITUTIONS.map((i) => ({ ...i, departments: ["Blood Bank", "Emergency", "Maternity"] })));
  const byCode = Object.fromEntries(institutions.map((i) => [i.code, i]));
  const passwordHash = await bcrypt.hash(env.SEED_DEFAULT_PASSWORD, env.BCRYPT_ROUNDS);

  await UserModel.insertMany([
    { email: "admin@haemocentral.co.zw", fullName: "Tendai Moyo", role: "super_admin", tenantId: null, phone: "+263 77 123 4567", passwordHash },
    { email: "admin@parirenyatwa.co.zw", fullName: "Dr. Nyasha Chikwanha", role: "hospital_admin", tenantId: byCode["HSP-001"]._id, designation: "Blood Bank Manager", phone: "+263 71 234 5678", passwordHash },
    { email: "staff@parirenyatwa.co.zw", fullName: "Rudo Mutasa", role: "staff", tenantId: byCode["HSP-001"]._id, department: "Blood Bank", designation: "Lab Technician", phone: "+263 78 345 6789", passwordHash },
    { email: "admin@mpilo.co.zw", fullName: "Dr. Sibusiso Ndlovu", role: "hospital_admin", tenantId: byCode["HSP-002"]._id, designation: "Blood Bank Manager", phone: "+263 77 456 7890", passwordHash },
    { email: "admin@lancet.co.zw", fullName: "Farai Chirwa", role: "hospital_admin", tenantId: byCode["LAB-001"]._id, designation: "Lab Manager", phone: "+263 71 567 8901", passwordHash },
  ]);

  console.log("Creating blood units…");
  const units: Record<string, unknown>[] = [];
  for (const inst of institutions) {
    for (const group of BLOOD_GROUPS) {
      const count = 5 + Math.floor(Math.random() * 30);
      for (let i = 0; i < count; i++) {
        const days = 3 + Math.floor(Math.random() * 38);
        units.push({
          unitCode: `${unitCode()}${i}`,
          tenantId: inst._id,
          bloodGroup: group,
          volumeMl: 450,
          collectedOn: new Date(Date.now() - (42 - days) * 86400000),
          expiresOn: new Date(Date.now() + days * 86400000),
          storageLocation: `Fridge ${1 + (i % 4)}`,
        });
      }
    }
  }
  await BloodUnitModel.insertMany(units);
  for (const inst of institutions) await recomputeAllStockLevels(inst._id);

  console.log(`Seeded ${institutions.length} institutions, ${units.length} units.`);
  console.log(`All demo users use password: ${env.SEED_DEFAULT_PASSWORD}`);
  await disconnectDatabase();
}

main().catch(async (e) => {
  console.error(e);
  await disconnectDatabase();
  process.exit(1);
});
