import User from "../models/User.js";
import Authority from "../models/Authority.js";
import { seedDefaultRules } from "./ruleEngine.js";
import env from "../config/env.js";

export const DEFAULT_AUTHORITIES = [
  {
    name: "District Health & Medical Directorate",
    type: "HOSPITAL",
    email: "health.authority@dumpsentry.gov.in",
    phone: "+91 33 2357 5000",
    location: "State Medical Hub",
    active: true,
  },
  {
    name: "Public Works Department (Roads & Highways)",
    type: "PWD",
    email: "pwd.roads@dumpsentry.gov.in",
    phone: "+91 33 2223 4567",
    location: "Division 1",
    active: true,
  },
  {
    name: "Department of Education (Campus Safety)",
    type: "EDUCATION",
    email: "education.safety@dumpsentry.gov.in",
    phone: "+91 33 2248 1122",
    location: "Education District",
    active: true,
  },
  {
    name: "Water Resources & Wetland Conservation Authority",
    type: "WATER_RESOURCES",
    email: "water.resources@dumpsentry.gov.in",
    phone: "+91 33 2334 5678",
    location: "Water Resources Bhavan",
    active: true,
  },
  {
    name: "Forest & Wildlife Protection Directorate",
    type: "FOREST",
    email: "forest.environment@dumpsentry.gov.in",
    phone: "+91 33 2335 1234",
    location: "Aranya Bhavan",
    active: true,
  },
  {
    name: "State Pollution Control Board (Industrial Division)",
    type: "POLLUTION_CONTROL",
    email: "pollution.control@dumpsentry.gov.in",
    phone: "+91 33 2335 0261",
    location: "Paribesh Bhavan",
    active: true,
  },
  {
    name: "City Municipal Corporation (Solid Waste Dept)",
    type: "MUNICIPAL",
    email: "municipal.waste@dumpsentry.gov.in",
    phone: "+91 33 2286 1000",
    location: "Central Civic Centre",
    active: true,
  },
  {
    name: "Regional Transport & Transit Authority",
    type: "TRANSPORT",
    email: "transport.authority@dumpsentry.gov.in",
    phone: "+91 33 2475 8900",
    location: "Parivahan Bhavan",
    active: true,
  },
  {
    name: "City Civic & Public Amenities Board",
    type: "CIVIC",
    email: "civic.public@dumpsentry.gov.in",
    phone: "+91 33 2286 2000",
    location: "Municipal Annex",
    active: true,
  },
  {
    name: "Department of Agriculture & Rural Development",
    type: "AGRICULTURE",
    email: "agriculture.dept@dumpsentry.gov.in",
    phone: "+91 33 2321 4567",
    location: "Krishi Bhavan",
    active: true,
  },
];

/**
 * Seed initial administrative user, default authorities, and default rules.
 */
export async function seedInitialData() {
  try {
    // 1. Seed Admin
    const adminEmail = env.adminEmail || "admin@dumpsentry.ai";
    const adminPassword = env.adminPassword || "DumpSentry@2026";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const admin = new User({
        email: adminEmail,
        passwordHash: adminPassword, // will be hashed by User pre-save hook
        name: "DumpSentry Admin",
        role: "admin",
      });
      await admin.save();
      console.log(`[Seed] Initial Admin created: ${adminEmail}`);
    }

    // 2. Correct any misclassified authorities (e.g. State Pollution Control Board from CIVIC -> POLLUTION_CONTROL)
    await Authority.updateMany(
      { name: /Pollution Control Board/i, type: "CIVIC" },
      { $set: { type: "POLLUTION_CONTROL" } }
    );

    // 3. Seed / Sync Default Authorities
    for (const def of DEFAULT_AUTHORITIES) {
      const existing = await Authority.findOne({ type: def.type });
      if (!existing) {
        await Authority.create(def);
        console.log(`[Seed] Created authority: ${def.name} (${def.type})`);
      } else {
        // Update outdated default emails if present
        if (
          existing.email.includes("@healthdept.gov.in") ||
          existing.email.includes("@citycorp.gov.in") ||
          existing.email.includes("@spcb.gov.in") ||
          existing.email.includes("@edu.gov.in") ||
          existing.email.includes("@pwd.gov.in")
        ) {
          existing.email = def.email;
          existing.name = def.name;
          await existing.save();
          console.log(`[Seed] Updated authority ${def.type} email -> ${def.email}`);
        }
      }
    }

    // 4. Seed / Sync Default Rules
    await seedDefaultRules();

  } catch (err) {
    console.error("[Seed] Error during seeding:", err.message);
  }
}
