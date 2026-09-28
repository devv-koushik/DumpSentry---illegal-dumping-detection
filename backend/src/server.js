import app from "./app.js";
import { connectDB } from "./config/db.js";
import { seedInitialData } from "./services/seed.js";
import env from "./config/env.js";

async function startServer() {
  const server = app.listen(env.port, () => {
    console.log(`=======================================================`);
    console.log(` DumpSentry Backend Server running`);
    console.log(` URL: http://localhost:${env.port}`);
    console.log(` Environment: ${env.nodeEnv}`);
    console.log(` AI Service Target: ${env.aiServiceUrl}`);
    console.log(`=======================================================`);
  });

  // Attempt database connection and seed
  connectDB()
    .then(async () => {
      await seedInitialData();
    })
    .catch((err) => {
      console.warn("[Server] Database initialization deferred:", err.message);
    });

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n[Server] Shutting down gracefully...");
    server.close(() => {
      console.log("[Server] Closed HTTP server");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();
