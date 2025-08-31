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
let db: any, pool: any;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// PostgreSQL for both development and production
pool = new Pool({ connectionString: process.env.DATABASE_URL });
db = drizzle({ client: pool, schema });

export { db, pool };