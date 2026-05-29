import dotenv from "dotenv";
dotenv.config();

import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import app from "./app";

const port = Number(process.env.PORT || 3000);

async function bootstrap() {
  try {
    const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    const migrationDb = drizzle(migrationClient);
    await migrate(migrationDb, { migrationsFolder: "./drizzle" });
    await migrationClient.end();
    console.log("Database migrations applied");
  } catch (err) {
    console.error("Failed to apply migrations:", err);
    console.log("Make sure PostgreSQL is running and DATABASE_URL is set");
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });
}

bootstrap();
