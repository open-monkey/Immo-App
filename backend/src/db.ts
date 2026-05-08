import { Pool, type Pool as PgPool, type PoolClient } from 'pg';

let pool: PgPool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return pool;
}

export async function connectDb() {
  const client = await getPool().connect();
  client.release();
}

export type Queryable = Pick<PgPool, 'query'> | Pick<PoolClient, 'query'>;

export async function query<T = unknown>(text: string, params?: unknown[]) {
  return getPool().query<T>(text, params);
}
