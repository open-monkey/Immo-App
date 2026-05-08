import type { FastifyInstance } from 'fastify';
import { query } from '../db.js';

export async function calculationRoutes(app: FastifyInstance) {
  app.post('/api/calculations', async (request, reply) => {
    const inputData = (request.body as { input_data?: unknown } | null | undefined)?.input_data;

    if (inputData === null || inputData === undefined || typeof inputData !== 'object' || Array.isArray(inputData)) {
      return reply.status(400).send({ error: 'input_data must be a non-null object' });
    }

    const shareId = crypto.randomUUID();

    try {
      await query('INSERT INTO property_calculations (share_id, input_data) VALUES ($1, $2)', [shareId, inputData]);
      return reply.status(201).send({ share_id: shareId });
    } catch {
      return reply.status(500).send({ error: 'Database error' });
    }
  });

  app.get<{ Params: { shareId: string } }>('/api/calculations/:shareId', async (request, reply) => {
    const { shareId } = request.params;

    try {
      const result = await query<{ share_id: string; input_data: unknown; created_at: string; updated_at: string }>(
        'SELECT share_id, input_data, created_at, updated_at FROM property_calculations WHERE share_id = $1',
        [shareId],
      );

      if ((result.rowCount ?? 0) === 0) {
        return reply.status(404).send({ error: 'Not found' });
      }

      return result.rows[0];
    } catch {
      return reply.status(500).send({ error: 'Database error' });
    }
  });

  app.delete<{ Params: { shareId: string } }>('/api/calculations/:shareId', async (request, reply) => {
    const { shareId } = request.params;

    try {
      const result = await query('DELETE FROM property_calculations WHERE share_id = $1', [shareId]);

      if ((result.rowCount ?? 0) === 0) {
        return reply.status(404).send({ error: 'Not found' });
      }

      return reply.status(204).send();
    } catch {
      return reply.status(500).send({ error: 'Database error' });
    }
  });
}
