import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthHeader } from './test-utils';

describe('Gates (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /api/v1/gates — paginated list', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/gates')
      .set(headers)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/gates — rejects unauthenticated', async () => {
    await request(app.getHttpServer()).get('/api/v1/gates').expect(401);
  });

  it('POST /api/v1/gates — create gate', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({
        code: 'EG-01',
        name: 'Entry Gate 1',
        type: 'ENTRY',
        description: 'Main entry',
      })
      .expect(201);
    expect(res.body.data.code).toBe('EG-01');
    expect(res.body.data.type).toBe('ENTRY');
  });

  it('POST /api/v1/gates — reject duplicate code', async () => {
    const headers = await getAuthHeader(app);
    const gate = { code: 'EG-02', name: 'Entry Gate 2', type: 'ENTRY' };
    await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send(gate)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send(gate)
      .expect(409);
  });

  it('POST /api/v1/gates — reject invalid type', async () => {
    const headers = await getAuthHeader(app);
    await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'EG-03', name: 'Bad Gate', type: 'INVALID' })
      .expect(400);
  });

  it('GET /api/v1/gates/:id — return by id', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'XG-01', name: 'Exit Gate 1', type: 'EXIT' });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .get(`/api/v1/gates/${id}`)
      .set(headers)
      .expect(200);
    expect(res.body.data.code).toBe('XG-01');
  });

  it('GET /api/v1/gates/:id — 404 for non-existent', async () => {
    const headers = await getAuthHeader(app);
    await request(app.getHttpServer())
      .get('/api/v1/gates/00000000-0000-0000-0000-000000000000')
      .set(headers)
      .expect(404);
  });

  it('PATCH /api/v1/gates/:id — update gate', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'EG-10', name: 'Old Name', type: 'ENTRY' });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/gates/${id}`)
      .set(headers)
      .send({ name: 'New Name' })
      .expect(200);
    expect(res.body.data.name).toBe('New Name');
  });

  it('DELETE /api/v1/gates/:id — soft delete', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'EG-99', name: 'To Delete', type: 'EXIT' });
    const id = createRes.body.data.id;
    await request(app.getHttpServer())
      .delete(`/api/v1/gates/${id}`)
      .set(headers)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/gates/${id}`)
      .set(headers)
      .expect(404);
  });

  it('GET /api/v1/gates — search by name', async () => {
    const headers = await getAuthHeader(app);
    // First create a gate with "Alpha" in the name
    await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({
        code: 'ALPHA-01',
        name: 'Alpha Gate',
        type: 'ENTRY',
      });
    const res = await request(app.getHttpServer())
      .get('/api/v1/gates?search=Alpha')
      .set(headers)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
