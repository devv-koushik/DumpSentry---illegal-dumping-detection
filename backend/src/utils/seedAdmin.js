import { connectDB } from "../config/db.js";
import { seedInitialData } from "../services/seed.js";
import mongoose from "mongoose";

async function run() {
  console.log("[Seed Script] Starting database seed...");
  await connectDB();
  await seedInitialData();
  console.log("[Seed Script] Seeding complete.");
  await mongoose.disconnect();
  process.exit(0);
}

run();
