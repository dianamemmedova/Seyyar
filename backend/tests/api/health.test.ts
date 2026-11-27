import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('GET /api/health', () => {
  it('reports that the API and the database work', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'ok' });
  });

  it('sends a request id and security headers', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('error format', () => {
  it('answers unknown routes with 404 in the standard error shape', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'GET /api/does-not-exist not found',
      requestId: expect.any(String),
    });
  });

  it('answers broken JSON with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
