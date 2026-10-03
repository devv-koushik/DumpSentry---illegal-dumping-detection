import mongoose from "mongoose";
import Authority from "../src/models/Authority.js";
import Rule from "../src/models/Rule.js";
import { seedInitialData } from "../src/services/seed.js";
import { evaluateRules } from "../src/services/ruleEngine.js";
import { CONTEXT_TYPES } from "../src/config/constants.js";

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/dumpsentry");
  console.log("Connected to MongoDB");

  // Run seed / sync
  await seedInitialData();

  const authorities = await Authority.find().lean();
  console.log(`\n--- Configured Authorities in DB (${authorities.length}) ---`);
  authorities.forEach((a) => {
    console.log(`[${a.type}] ${a.name} -> ${a.email}`);
  });

  const rules = await Rule.find().sort({ priority: 1 }).lean();
  console.log(`\n--- Configured Rules in DB (${rules.length}) ---`);
  rules.forEach((r) => {
    console.log(`Priority ${r.priority}: [${r.contextType}] -> Authority: ${r.authorityType} (Radius: ${r.radiusMeters}m)`);
  });

  // Test rule evaluation for all 12 contexts
  console.log("\n--- Testing Authority Routing For All 12 Environmental Contexts ---");
  const testContexts = [
    CONTEXT_TYPES.HEALTHCARE,
    CONTEXT_TYPES.ROADSIDE,
    CONTEXT_TYPES.EDUCATIONAL,
    CONTEXT_TYPES.WATER_BODY,
    CONTEXT_TYPES.ENVIRONMENTAL_PROTECTED,
    CONTEXT_TYPES.INDUSTRIAL,
    CONTEXT_TYPES.RESIDENTIAL,
    CONTEXT_TYPES.COMMERCIAL,
    CONTEXT_TYPES.TRANSPORT,
    CONTEXT_TYPES.PUBLIC_AREA,
    CONTEXT_TYPES.AGRICULTURAL,
    CONTEXT_TYPES.OTHER_UNKNOWN,
  ];

  for (const ctx of testContexts) {
    const mockNearby = [
      {
        name: `Test Nearby ${ctx} Site`,
        type: ctx.toLowerCase(),
        contextType: ctx,
        distance: 40,
        osmId: `test/123`,
        latitude: 22.5,
        longitude: 88.3,
      },
    ];

    const result = await evaluateRules(mockNearby, ctx, { locationName: `Test Location for ${ctx}` });
    console.log(
      `Context: ${ctx.padEnd(24)} -> Authority: ${(result.authority?.name || "None").padEnd(46)} Email: ${result.authority?.email} Type: ${result.authority?.type}`
    );
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
