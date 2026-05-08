import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('createApp', () => {
  it('boots and serves the health endpoint without requiring a database connection', async () => {
    const app = await createApp({ connectDb: false, runMigrations: false });
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, app: 'immo-backend' });

    await app.close();
  });
});
