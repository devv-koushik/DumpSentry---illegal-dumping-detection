import "dotenv/config";

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

  // SMTP
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "DumpSentry Alerts <alerts@dumpsentry.ai>",
  },

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Uploads
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10),

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
};

export default env;
