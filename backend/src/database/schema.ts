import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/environment.ts';
import { getPredefinedAdminCredentials } from '../config/admin-config.ts';
import { generateId, hashPassword } from '../utils/security.ts';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dbPath = path.resolve(process.cwd(), env.DATABASE_FILE);
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(dbPath);
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  return dbInstance;
}

export function initializeDatabaseSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      mobile TEXT UNIQUE,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      password_hash TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      date_of_birth TEXT,
      time_of_birth TEXT,
      place_of_birth TEXT,
      basic_number INTEGER,
      destiny_number INTEGER,
      profile_photo_url TEXT,
      timezone TEXT DEFAULT 'UTC',
      language TEXT DEFAULT 'en',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token TEXT UNIQUE NOT NULL,
      device_info TEXT,
      ip_address TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      revoked_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      channel TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      is_used INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      duration_days INTEGER NOT NULL,
      tier_level INTEGER NOT NULL,
      max_saved_charts INTEGER NOT NULL,
      allow_comparison INTEGER NOT NULL DEFAULT 0,
      allow_100_year_timeline INTEGER NOT NULL DEFAULT 0,
      allow_export INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
      status TEXT NOT NULL DEFAULT 'active',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      payment_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_charts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      person_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      time_of_birth TEXT,
      place_of_birth TEXT,
      calculation_version TEXT NOT NULL DEFAULT '1.0',
      chart_snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      actor_email TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON auth_sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON auth_sessions(user_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_otp_identifier ON otp_codes(identifier, is_used);
    CREATE INDEX IF NOT EXISTS idx_saved_charts_user ON saved_charts(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
  `);

  seedDefaultSubscriptionPlans(db);
  seedPredefinedSuperAdmin(db);
}

function seedDefaultSubscriptionPlans(db: DatabaseSync): void {
  const check = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get() as { count: number };
  if (check && check.count > 0) return;

  const now = new Date().toISOString();
  const plans = [
    {
      id: generateId(),
      slug: 'free-starter',
      name: 'Free Starter Trial',
      description: 'Access to Basic & Destiny numbers, Natal Grid, and 3 saved charts for 7 days.',
      price: 0,
      currency: 'USD',
      duration_days: 7,
      tier_level: 1,
      max_saved_charts: 3,
      allow_comparison: 0,
      allow_100_year_timeline: 0,
      allow_export: 0,
      is_active: 1,
      display_order: 1,
      created_at: now,
    },
    {
      id: generateId(),
      slug: 'pro-monthly',
      name: 'Numerology Pro Monthly',
      description: 'Full Natal, Mahadasha, Personal Year, Monthly Pratyantar, Daily Grids, 100-Year Timeline, Chart Comparison, and 50 saved charts.',
      price: 19.99,
      currency: 'USD',
      duration_days: 30,
      tier_level: 2,
      max_saved_charts: 50,
      allow_comparison: 1,
      allow_100_year_timeline: 1,
      allow_export: 1,
      is_active: 1,
      display_order: 2,
      created_at: now,
    },
    {
      id: generateId(),
      slug: 'premium-annual',
      name: 'Numerology Premium Annual',
      description: 'Everything in Pro plus unlimited saved charts, priority calculation speed, and comprehensive export package (2 months free).',
      price: 149.99,
      currency: 'USD',
      duration_days: 365,
      tier_level: 3,
      max_saved_charts: 999999,
      allow_comparison: 1,
      allow_100_year_timeline: 1,
      allow_export: 1,
      is_active: 1,
      display_order: 3,
      created_at: now,
    },
  ];

  const insertStmt = db.prepare(`
    INSERT INTO subscription_plans (
      id, slug, name, description, price, currency, duration_days, tier_level,
      max_saved_charts, allow_comparison, allow_100_year_timeline, allow_export,
      is_active, display_order, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of plans) {
    insertStmt.run(
      p.id, p.slug, p.name, p.description, p.price, p.currency, p.duration_days,
      p.tier_level, p.max_saved_charts, p.allow_comparison, p.allow_100_year_timeline,
      p.allow_export, p.is_active, p.display_order, p.created_at
    );
  }
}

/**
 * Seeds or validates the predefined Super Administrator account according to Master Prompt Addendum Section 2:
 * - Reads credentials from server-side environment variables.
 * - Creates account if not existing with role = 'super_admin'.
 * - Password hashed with salt.
 * - Does not reset existing admin password on every server restart.
 * - Logs audit record.
 */
function seedPredefinedSuperAdmin(db: DatabaseSync): void {
  const credentials = getPredefinedAdminCredentials();
  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(credentials.email) as { id: string; role: string } | undefined;

  const now = new Date().toISOString();

  if (!existing) {
    const adminId = generateId();
    const passwordHash = hashPassword(credentials.initialPassword);

    db.prepare(`
      INSERT INTO users (id, email, full_name, role, status, password_hash, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, 'super_admin', 'active', ?, 1, ?, ?)
    `).run(adminId, credentials.email, 'Super Administrator', passwordHash, now, now);

    db.prepare(`
      INSERT INTO user_profiles (user_id, updated_at)
      VALUES (?, ?)
    `).run(adminId, now);

    // Record in audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, actor_email, action, target_type, target_id, details_json, created_at)
      VALUES (?, ?, ?, 'SEED_INITIAL_SUPER_ADMIN', 'user', ?, ?, ?)
    `).run(
      generateId(),
      adminId,
      credentials.email,
      adminId,
      JSON.stringify({ role: 'super_admin', email: credentials.email }),
      now
    );

    console.log(`[SECURITY] Predefined Super Admin created successfully: ${credentials.email}`);
  } else if (existing.role !== 'super_admin') {
    db.prepare(`UPDATE users SET role = 'super_admin', updated_at = ? WHERE id = ?`).run(now, existing.id);
  }
}
