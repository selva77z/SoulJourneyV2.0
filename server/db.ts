import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as schemaSqlite from "@shared/schema-sqlite";

// For local development
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

neonConfig.webSocketConstructor = ws;

// Use PostgreSQL for both development and production if DATABASE_URL is present
let db: any;
let pool: any;

if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL found, using local SQLite database.");
  const sqlite = new Database('local.db');
  db = drizzleSqlite(sqlite, { schema: schemaSqlite as any });
} else {
  // PostgreSQL (Supabase/Neon)
  console.log("DATABASE_URL found, connecting to PostgreSQL.");
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, pool };