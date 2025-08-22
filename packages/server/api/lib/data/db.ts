import { env } from "@/env";
import { Database } from "bun:sqlite";
import { join } from "path";

export const db = new Database(env.DB_URI);

export async function runMigrations() {
  try {
    const upSqlPath = join(import.meta.dir, "up.sql");
    const upSqlFile = Bun.file(upSqlPath);

    if (await upSqlFile.exists()) {
      const sqlContent = await upSqlFile.text();

      if (sqlContent.trim()) {
        console.log("Running database migrations...");
        db.exec(sqlContent);
        console.log("Database migrations completed successfully ✅");
      } else {
        console.log("No migrations to run (up.sql is empty)");
      }
    } else {
      console.log("No up.sql file found, skipping migrations");
    }
  } catch (error) {
    console.error("Failed to run database migrations:", error);
    throw error;
  }
}
