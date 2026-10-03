import dns from "dns";
import mongoose from "mongoose";
import env from "./env.js";

// Ensure reliable SRV DNS resolution for MongoDB Atlas on Windows environments
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if custom DNS cannot be set
}

/**
 * Connect to MongoDB with graceful error logging in development.
 */
export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[DB] Connected successfully → ${env.mongoUri.replace(/\/\/.*@/, "//***@")}`);
  } catch (err) {
    console.warn(`[DB] Warning: Could not connect to MongoDB at ${env.mongoUri.replace(/\/\/.*@/, "//***@")}.`);
    console.warn(`[DB] Error: ${err.message}`);
    console.warn(`[DB] Ensure MongoDB is running (e.g. 'mongod' or MongoDB Atlas connection string in .env).`);
  }

  mongoose.connection.on("error", (err) => {
    console.error("[DB] Runtime error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[DB] Disconnected from MongoDB");
  });
}

export default mongoose;
