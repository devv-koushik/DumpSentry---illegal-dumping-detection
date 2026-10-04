import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from backend folder or root
const possiblePaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

/** Validated environment configuration. */
const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: (process.env.NODE_ENV || "development") === "development",

  // MongoDB
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dumpsentry",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Admin seed
  adminEmail: process.env.ADMIN_EMAIL || "admin@dumpsentry.ai",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin@123456",
  adminName: process.env.ADMIN_NAME || "DumpSentry Admin",

  // AI Service
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",

  // SMTP Email (Real SMTP credentials loaded strictly from environment)
  smtp: {
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || `"DumpSentry Alerts" <alerts@dumpsentry.ai>`,
  },

  // Controlled Test Recipient
  alertTestRecipient:
    process.env.ALERT_TEST_RECIPIENT || process.env.CONTROLLED_TEST_RECIPIENT || "controlled-test@dumpsentry.ai",

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Uploads
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10),

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
};

if (env.nodeEnv === "production") {
  const missing = [];
  if (env.jwtSecret === "dev-secret-change-me" || !process.env.JWT_SECRET) {
    missing.push("JWT_SECRET (must not be default)");
  }
  if (env.adminEmail === "admin@dumpsentry.ai" && !process.env.ADMIN_EMAIL) {
    missing.push("ADMIN_EMAIL (must not be default)");
  }
  if (env.adminPassword === "Admin@123456" && !process.env.ADMIN_PASSWORD) {
    missing.push("ADMIN_PASSWORD (must not be default)");
  }
  
  if (missing.length > 0) {
    console.error(`\n[FATAL] Unsafe default credentials detected in PRODUCTION environment!`);
    console.error(`You MUST set the following environment variables to real, secure values:`);
    missing.forEach(m => console.error(` - ${m}`));
    console.error(`\nServer refusing to start for security reasons.\n`);
    process.exit(1);
  }
}

export default env;
