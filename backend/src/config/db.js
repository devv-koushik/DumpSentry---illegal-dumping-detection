import mongoose from "mongoose";
import env from "./env.js";

/**
 * Connect to MongoDB with graceful error logging in development.
 */
export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`[DB] Connected successfully → ${env.mongoUri.replace(/\/\/.*@/, "//***@")}`);
  } catch (err) {
    console.warn(`[DB] Warning: Could not connect to MongoDB at ${env.mongoUri}.`);
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
