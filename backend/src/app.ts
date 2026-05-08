import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDb } from './db.js';
import { runMigrations } from './migrate.js';
import { healthRoutes } from './routes/health.js';
import { calculationRoutes } from './routes/calculations.js';

export async function createApp(options?: { connectDb?: boolean; runMigrations?: boolean }) {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  if (options?.connectDb !== false) {
    await connectDb();
  }

  if (options?.runMigrations !== false) {
    await runMigrations();
  }

  await healthRoutes(app);
  await calculationRoutes(app);

  return app;
}
