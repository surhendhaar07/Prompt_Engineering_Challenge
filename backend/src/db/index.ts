import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

let pgPool: Pool | null = null;
let sqliteDb: SqlJsDatabase | null = null;
const sqliteFilePath = path.resolve(__dirname, '../../data/xentrix.sqlite');

const isPostgres = () =>
  !!process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'));

// Ensure data directory exists for SQLite storage
const dataDir = path.dirname(sqliteFilePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export async function initDatabase(): Promise<void> {
  if (isPostgres()) {
    console.log('[DB] Connecting to PostgreSQL (Neon / Railway / Cloud)...');
    
    // Remote cloud databases (Neon, Railway, Supabase) require SSL with rejectUnauthorized: false
    const isRemote =
      !process.env.DATABASE_URL!.includes('localhost') &&
      !process.env.DATABASE_URL!.includes('127.0.0.1');
    const enableSsl = process.env.DB_SSL === 'true' || isRemote || process.env.NODE_ENV === 'production';

    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: enableSsl ? { rejectUnauthorized: false } : false,
    });

    try {
      await pgPool.query('SELECT 1');
      console.log('[DB] PostgreSQL connected successfully.');
    } catch (err: any) {
      console.error('[DB] PostgreSQL connection error:', err.message);
      throw err;
    }

    await createTables();
  } else {
    console.log('[DB] Initializing SQLite database engine (sql.js WASM)...');
    const SQL = await initSqlJs();
    if (fs.existsSync(sqliteFilePath)) {
      const fileBuffer = fs.readFileSync(sqliteFilePath);
      sqliteDb = new SQL.Database(fileBuffer);
      console.log('[DB] Loaded existing SQLite database from disk.');
    } else {
      sqliteDb = new SQL.Database();
      console.log('[DB] Created new SQLite database file.');
    }
    await createTables();
    persistSqlite();
  }
}

function persistSqlite() {
  if (sqliteDb) {
    try {
      const binaryArray = sqliteDb.export();
      const buffer = Buffer.from(binaryArray);
      fs.writeFileSync(sqliteFilePath, buffer);
    } catch (err) {
      console.error('[DB] Error saving SQLite database to disk:', err);
    }
  }
}

async function createTables(): Promise<void> {
  const tableStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      team_name TEXT UNIQUE NOT NULL,
      team_number TEXT,
      domain TEXT DEFAULT 'WEB DEVELOPMENT',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      domain TEXT DEFAULT 'WEB DEVELOPMENT',
      title TEXT NOT NULL,
      situation TEXT NOT NULL,
      task TEXT NOT NULL,
      requirements TEXT NOT NULL,
      technical_requirements TEXT NOT NULL,
      submission_guideline TEXT NOT NULL DEFAULT 'Write one comprehensive prompt that you would give to an AI coding agent.',
      question_text TEXT NOT NULL,
      category TEXT DEFAULT 'Prompt Engineering',
      difficulty TEXT DEFAULT 'Medium',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      expires_at TEXT NOT NULL,
      submitted_at TEXT,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
      submission_type TEXT,
      current_draft TEXT DEFAULT '',
      tab_switch_count INTEGER DEFAULT 0,
      fullscreen_exit_count INTEGER DEFAULT 0,
      copy_attempt_count INTEGER DEFAULT 0,
      paste_attempt_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      started_at TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      submission_type TEXT NOT NULL,
      duration_used_seconds INTEGER NOT NULL,
      tab_switch_count INTEGER DEFAULT 0,
      fullscreen_exit_count INTEGER DEFAULT 0,
      copy_attempt_count INTEGER DEFAULT 0,
      paste_attempt_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      team_name TEXT NOT NULL,
      challenge_id TEXT,
      event_type TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      timestamp TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  ];

  for (const sql of tableStatements) {
    await exec(sql);
  }

  // Safe alters if upgrading existing SQLite DB
  if (sqliteDb) {
    try {
      await exec("ALTER TABLE teams ADD COLUMN domain TEXT DEFAULT 'WEB DEVELOPMENT'");
    } catch (e) {}

    try {
      await exec("ALTER TABLE questions ADD COLUMN domain TEXT DEFAULT 'WEB DEVELOPMENT'");
    } catch (e) {}
    try {
      await exec("ALTER TABLE questions ADD COLUMN title TEXT DEFAULT ''");
    } catch (e) {}
    try {
      await exec("ALTER TABLE questions ADD COLUMN situation TEXT DEFAULT ''");
    } catch (e) {}
    try {
      await exec("ALTER TABLE questions ADD COLUMN task TEXT DEFAULT ''");
    } catch (e) {}
    try {
      await exec("ALTER TABLE questions ADD COLUMN requirements TEXT DEFAULT ''");
    } catch (e) {}
    try {
      await exec("ALTER TABLE questions ADD COLUMN technical_requirements TEXT DEFAULT ''");
    } catch (e) {}
    try {
      await exec("ALTER TABLE questions ADD COLUMN submission_guideline TEXT DEFAULT 'Write one comprehensive prompt that you would give to an AI coding agent.'");
    } catch (e) {}
  }

  console.log('[DB] Schema verified and updated.');
}


export async function exec(sql: string): Promise<void> {
  if (pgPool) {
    await pgPool.query(sql);
  } else if (sqliteDb) {
    sqliteDb.exec(sql);
    persistSqlite();
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (pgPool) {
    let pgSql = sql;
    let paramIdx = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${paramIdx++}`);
    }
    const res = await pgPool.query(pgSql, params);
    return res.rows as T[];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  }
  return [];
}

export async function get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function run(sql: string, params: any[] = []): Promise<{ changes: number }> {
  if (pgPool) {
    let pgSql = sql;
    let paramIdx = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${paramIdx++}`);
    }
    const res = await pgPool.query(pgSql, params);
    return { changes: res.rowCount || 0 };
  } else if (sqliteDb) {
    sqliteDb.run(sql, params);
    persistSqlite();
    const changesRes = sqliteDb.exec('SELECT changes() as cnt');
    const changes = changesRes.length > 0 && changesRes[0].values.length > 0 ? Number(changesRes[0].values[0][0]) : 1;
    return { changes };
  }
  return { changes: 0 };
}
