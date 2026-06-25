import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthHeader } from './test-utils';

describe('Audit Logs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /api/v1/audit-logs — paginated list', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs')
      .set(headers)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/audit-logs — search', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?search=login')
      .set(headers)
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/audit-logs/user/:userId — filter by user', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs/user/00000000-0000-0000-0000-000000000000')
      .set(headers)
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/audit-logs/module/:module — filter by module', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs/module/Auth')
      .set(headers)
      .expect(200);
    expect(res.body.success).toBe(true);
  });
});
