import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema-sqlite";

// Use SQLite for local development
const sqlite = new Database('local.db');
export const db = drizzle(sqlite, { schema });

// For compatibility with the existing app structure
export const pool = {
  end: () => sqlite.close()
};
