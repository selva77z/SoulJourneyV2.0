import Database from 'better-sqlite3';

// Create SQLite database for local development
const sqlite = new Database('local.db');

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    interests TEXT,
    astrology_tags TEXT,
    is_visible BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire DATETIME NOT NULL
  );
`);

// Insert admin user
const adminUser = {
  id: 'admin-001',
  email: 'admin@localhost.com',
  first_name: 'Admin',
  last_name: 'User',
  profile_image_url: null
};

try {
  sqlite.prepare(`
    INSERT OR REPLACE INTO users (id, email, first_name, last_name, profile_image_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminUser.id, adminUser.email, adminUser.first_name, adminUser.last_name, adminUser.profile_image_url);

  sqlite.prepare(`
    INSERT OR REPLACE INTO profiles (user_id, display_name, bio, interests, astrology_tags, is_visible)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(adminUser.id, 'Admin User', 'System Administrator', 'astrology,admin', 'admin,system', 0);

  console.log('✅ Admin user created successfully!');
  console.log('📧 Email: admin@localhost.com');
  console.log('🆔 User ID: admin-001');
  console.log('📝 Use these credentials to login');
  
} catch (error) {
  console.error('❌ Error creating admin user:', error);
}

sqlite.close();
