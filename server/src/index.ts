import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { createApp } from "./app";
import { expirePastUnits } from "./services/stock.service";

async function main() {
  await connectDatabase();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`HaemoCentral API on http://localhost:${env.PORT}${env.API_PREFIX}`);
  });

  // Hourly expiry sweep.
  const timer = setInterval(() => {
    expirePastUnits().catch((e) => console.error("Expiry sweep failed", e));
  }, 60 * 60 * 1000);

  const shutdown = async () => {
    clearInterval(timer);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
