import * as fs from 'node:fs';
import * as path from 'node:path';
import { query } from './db.js';

function migrationsDir() {
  return path.join(path.dirname(process.argv[1] || path.resolve('src/migrate.ts')), 'migrations');
}

export async function runMigrations() {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = fs.readdirSync(migrationsDir()).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    const existing = await query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
    if ((existing.rowCount ?? 0) > 0) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir(), file), 'utf8');
    await query(sql);
    await query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`Migration applied: ${file}`);
  }
}
