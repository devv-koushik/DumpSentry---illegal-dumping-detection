import User from "../models/User.js";
import Authority from "../models/Authority.js";
import { seedDefaultRules } from "./ruleEngine.js";
import env from "../config/env.js";

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

    // 2. Seed Default Authorities
    const authorityCount = await Authority.countDocuments();
    if (authorityCount === 0) {
      const defaultAuthorities = [
        {
          name: "City Municipal Corporation (Solid Waste Dept)",
          type: "MUNICIPAL",
          email: "solidwaste@citycorp.gov.in",
          phone: "+91 33 2286 1000",
          location: "Central Zone",
          active: true,
        },
        {
          name: "District Health & Medical Directorate",
          type: "HOSPITAL",
          email: "healthofficer@healthdept.gov.in",
          phone: "+91 33 2357 5000",
          location: "State Medical Hub",
          active: true,
        },
        {
          name: "State Pollution Control Board",
          type: "CIVIC",
          email: "environment@spcb.gov.in",
          phone: "+91 33 2335 0261",
          location: "Environmental Complex",
          active: true,
        },
        {
          name: "Public Works Department (Roads & Highways)",
          type: "PWD",
          email: "roads@pwd.gov.in",
          phone: "+91 33 2223 4567",
          location: "Division 1",
          active: true,
        },
        {
          name: "Department of Education Safety Board",
          type: "SCHOOL",
          email: "safety@edu.gov.in",
          phone: "+91 33 2248 1122",
          location: "Education District",
          active: true,
        },
      ];
      await Authority.insertMany(defaultAuthorities);
      console.log(`[Seed] Seeded ${defaultAuthorities.length} default authorities`);
    }

    // 3. Seed Default Rules
    await seedDefaultRules();

  } catch (err) {
    console.error("[Seed] Error during seeding:", err.message);
  }
}
