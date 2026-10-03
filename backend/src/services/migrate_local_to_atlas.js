import dns from "dns";
import mongoose from "mongoose";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const LOCAL_URI = "mongodb://127.0.0.1:27017/dumpsentry";
const ATLAS_URI =
  "mongodb+srv://koushikbhowmick04_db_user:eIRSWEBw8zUrsbsV@dev-koushik.wdi7itz.mongodb.net/dumpsentry?retryWrites=true&w=majority";

async function migrate() {
  console.log("=========================================================");
  console.log("=== DumpSentry Local to Atlas Database Migration ===");
  console.log("=========================================================\n");

  console.log("1. Connecting to Local MongoDB at 127.0.0.1:27017 ...");
  const localConn = await mongoose.createConnection(LOCAL_URI, {
    serverSelectionTimeoutMS: 5000,
  }).asPromise();
  console.log("   [OK] Connected to local MongoDB.\n");

  console.log("2. Connecting to MongoDB Atlas Cluster ...");
  const atlasConn = await mongoose.createConnection(ATLAS_URI, {
    serverSelectionTimeoutMS: 12000,
  }).asPromise();
  console.log("   [OK] Connected to MongoDB Atlas.\n");

  const collections = ["users", "authorities", "rules", "detections", "alerts", "auditlogs", "drones"];

  for (const colName of collections) {
    console.log(`>>> Migrating collection: ${colName} ...`);
    const localCollection = localConn.collection(colName);
    const atlasCollection = atlasConn.collection(colName);

    const docs = await localCollection.find().toArray();
    console.log(`    Found ${docs.length} documents in local ${colName}.`);

    if (docs.length > 0) {
      // Clear existing in Atlas collection to prevent duplicate key errors
      await atlasCollection.deleteMany({});
      // Insert docs
      const insertResult = await atlasCollection.insertMany(docs);
      console.log(`    [SUCCESS] Migrated ${insertResult.insertedCount} documents to Atlas ${colName}.`);
    } else {
      console.log(`    [SKIP] Collection ${colName} is empty.`);
    }
  }

  console.log("\n=========================================================");
  console.log("=== Verifying Atlas Dataset Collections ===");
  console.log("=========================================================");

  const atlasCollections = await atlasConn.db.listCollections().toArray();
  for (const c of atlasCollections) {
    const count = await atlasConn.collection(c.name).countDocuments();
    console.log(`  - ${c.name}: ${count} documents`);
  }

  await localConn.close();
  await atlasConn.close();

  console.log("\n[SUCCESS] Migration completed! All real datasets are now live on your Atlas cluster!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("\n[MIGRATION ERROR]:", err);
  process.exit(1);
});
