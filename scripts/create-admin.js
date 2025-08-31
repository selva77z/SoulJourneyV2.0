#!/usr/bin/env node
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema.js';

// Create a local PostgreSQL database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'astrology_db',
  user: 'admin',
  password: 'admin123',
});

const db = drizzle(pool, { schema });

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'admin@astrology.com')
    });

    if (existingUser) {
      console.log('Admin user already exists:', existingUser);
      return existingUser;
    }

    // Create admin user
    const adminUser = await db.insert(schema.users).values({
      id: 'admin-user-001',
      email: 'admin@astrology.com',
      firstName: 'Admin',
      lastName: 'User',
      profileImageUrl: null,
    }).returning();

    console.log('Admin user created successfully:', adminUser[0]);
    
    // Create admin profile
    const adminProfile = await db.insert(schema.profiles).values({
      userId: 'admin-user-001',
      displayName: 'Admin User',
      bio: 'System Administrator',
      interests: ['astrology', 'administration'],
      astrologyTags: ['admin', 'system'],
      isVisible: false,
    }).returning();

    console.log('Admin profile created:', adminProfile[0]);

    return adminUser[0];
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();
