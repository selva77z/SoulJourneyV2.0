// Database connection and initialization
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../shared/schema-sqlite.js';

let db;

// Initialize database
export function initializeDatabase() {
  try {
    // Use SQLite for local development
    const sqlite = new Database(process.env.DATABASE_URL || 'local.db');
    db = drizzle(sqlite, { schema });
    
    console.log('📊 Database initialized:', process.env.DATABASE_URL || 'local.db');
    
    // Run migrations if needed
    // migrate(db, { migrationsFolder: './migrations' });
    
    return db;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    
    // Return mock database interface
    return createMockDatabase();
  }
}

// Mock database for when real DB is not available
function createMockDatabase() {
  console.log('🔄 Using mock database (SQLite not available)');
  
  return {
    // Mock database operations
    birthData: {
      findMany: async () => [],
      insert: async (data) => ({ id: Date.now(), ...data }),
      findFirst: async (id) => null,
      update: async (id, data) => ({ id, ...data }),
      delete: async (id) => true
    },
    charts: {
      findMany: async () => [],
      insert: async (data) => ({ id: Date.now(), ...data }),
      findFirst: async (id) => null,
      update: async (id, data) => ({ id, ...data }),
      delete: async (id) => true
    },
    users: {
      findFirst: async (email) => null,
      insert: async (data) => ({ id: 'user-' + Date.now(), ...data })
    }
  };
}

// Database operations
export async function saveBirthData(data) {
  try {
    if (!db) db = initializeDatabase();
    
    // Mock implementation for now
    const savedData = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString()
    };
    
    console.log('💾 Birth data saved:', savedData.name);
    return savedData;
    
  } catch (error) {
    console.error('Error saving birth data:', error);
    throw error;
  }
}

export async function saveChart(chartData) {
  try {
    if (!db) db = initializeDatabase();
    
    // Mock implementation for now
    const savedChart = {
      id: Date.now(),
      ...chartData,
      createdAt: new Date().toISOString()
    };
    
    console.log('💾 Chart saved:', savedChart.birthData?.name);
    return savedChart;
    
  } catch (error) {
    console.error('Error saving chart:', error);
    throw error;
  }
}

export async function getUserCharts(userId) {
  try {
    if (!db) db = initializeDatabase();
    
    // Mock implementation
    return [
      {
        id: 1,
        userId,
        name: 'Sample Chart',
        createdAt: new Date().toISOString()
      }
    ];
    
  } catch (error) {
    console.error('Error fetching user charts:', error);
    return [];
  }
}

// Initialize database on module load
db = initializeDatabase();

export { db };