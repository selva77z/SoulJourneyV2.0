import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as schemaSqlite from "@shared/schema-sqlite";

// For local development
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

neonConfig.webSocketConstructor = ws;

// Use PostgreSQL for both development and production
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as schemaSqlite from "@shared/schema-sqlite";

// For local development
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

neonConfig.webSocketConstructor = ws;

// Use PostgreSQL for both development and production
let db: any;
let pool: any;

if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL found, using local SQLite database.");
  const sqlite = new Database('local.db');
  db = drizzleSqlite(sqlite, { schema: schemaSqlite as any }); // Cast because schemas might not align perfectly but are compatible for basic CRUD
} else {
  // PostgreSQL for both development and production
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, pool };