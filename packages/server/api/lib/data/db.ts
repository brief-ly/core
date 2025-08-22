import { env } from "@/env";
import { Database } from "bun:sqlite";
import { join, dirname } from "path";
import { existsSync, mkdirSync } from "fs";

const dbPath = env.DB_URI;
const dbDir = dirname(dbPath);

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

export async function initializeDatabase() {
  try {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
    
    if (tables.length === 0) {
      console.log("Initializing new database...");
      
      const upSqlPath = join(import.meta.dir, "up.sql");
      
      if (existsSync(upSqlPath)) {
        const upSqlFile = Bun.file(upSqlPath);
        const sqlContent = await upSqlFile.text();
        
        if (sqlContent.trim()) {
          console.log("Running database migrations...");
          db.exec(sqlContent);
          console.log("Database initialized successfully ✅");
        }
      } else {
        console.log("No up.sql file found for initialization");
      }
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

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
