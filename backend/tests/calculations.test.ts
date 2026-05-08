import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { query } from '../src/db.js';

vi.mock('../src/db.js', () => ({
  connectDb: vi.fn(),
  query: vi.fn(),
}));

const mockQuery = vi.mocked(query);

describe('calculation routes', () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await createApp({ connectDb: false, runMigrations: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/calculations creates a calculation and returns share_id', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [], command: 'INSERT', oid: 0, fields: [] });

    const response = await app.inject({
      method: 'POST',
      url: '/api/calculations',
      payload: { input_data: { price: 300000 } },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(typeof body.share_id).toBe('string');
    expect(body.share_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('GET /api/calculations/:shareId returns saved data', async () => {
    const shareId = '123e4567-e89b-12d3-a456-426614174000';
    const savedRow = {
      share_id: shareId,
      input_data: { price: 300000 },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [savedRow], command: 'SELECT', oid: 0, fields: [] });

    const response = await app.inject({
      method: 'GET',
      url: `/api/calculations/${shareId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.share_id).toBe(shareId);
    expect(body.input_data).toEqual({ price: 300000 });
  });

  it('GET /api/calculations/:shareId returns 404 for unknown share_id', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [], command: 'SELECT', oid: 0, fields: [] });

    const response = await app.inject({
      method: 'GET',
      url: '/api/calculations/00000000-0000-0000-0000-000000000000',
    });

    expect(response.statusCode).toBe(404);
  });

  it('DELETE /api/calculations/:shareId returns 204 for valid share_id', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [], command: 'DELETE', oid: 0, fields: [] });

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/calculations/123e4567-e89b-12d3-a456-426614174000',
    });

    expect(response.statusCode).toBe(204);
  });

  it('DELETE /api/calculations/:shareId returns 404 for unknown share_id', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [], command: 'DELETE', oid: 0, fields: [] });

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/calculations/00000000-0000-0000-0000-000000000000',
    });

    expect(response.statusCode).toBe(404);
  });

  it('POST /api/calculations returns 400 when input_data is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/calculations',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });
});
