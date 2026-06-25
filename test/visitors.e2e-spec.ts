import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthHeader } from './test-utils';

describe('Visitors (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /api/v1/visitors — create visitor', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .post('/api/v1/visitors')
      .set(headers)
      .send({ visitorName: 'Jane', phoneNumber: '123' })
      .expect(201);
    expect(res.body.data.visitorName).toBe('Jane');
    expect(res.body.data.status).toBe('ENTERED');
  });

  it('GET /api/v1/visitors — paginated list', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/visitors')
      .set(headers)
      .expect(200);
    expect(res.body.meta).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/visitors — search', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/visitors?search=Jane')
      .set(headers)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/visitors/active', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/visitors/active')
      .set(headers)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('POST /api/v1/visitors/entry — register entry', async () => {
    const headers = await getAuthHeader(app);
    const gateRes = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'VG1', name: 'V Gate', type: 'ENTRY' });
    const res = await request(app.getHttpServer())
      .post('/api/v1/visitors/entry')
      .set(headers)
      .send({ visitorName: 'Walker', entryGateId: gateRes.body.data.id })
      .expect(201);
    expect(res.body.data.entryTime).toBeDefined();
  });

  it('POST /api/v1/visitors/:id/exit — register exit', async () => {
    const headers = await getAuthHeader(app);
    const gateRes = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'VX1', name: 'V Exit', type: 'EXIT' });
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/visitors')
      .set(headers)
      .send({ visitorName: 'Exiter' });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/visitors/${id}/exit`)
      .set(headers)
      .send({ exitGateId: gateRes.body.data.id })
      .expect(201);
    expect(res.body.data.status).toBe('EXITED');
  });

  it('POST /api/v1/visitors/:id/cancel', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/visitors')
      .set(headers)
      .send({ visitorName: 'Canceller' });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/visitors/${id}/cancel`)
      .set(headers)
      .expect(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('PATCH /api/v1/visitors/:id — update', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/visitors')
      .set(headers)
      .send({ visitorName: 'Updater' });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/visitors/${id}`)
      .set(headers)
      .send({ companyName: 'New Corp' })
      .expect(200);
    expect(res.body.data.companyName).toBe('New Corp');
  });

  it('DELETE /api/v1/visitors/:id — soft delete', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/visitors')
      .set(headers)
      .send({ visitorName: 'Deleter' });
    const id = createRes.body.data.id;
    await request(app.getHttpServer())
      .delete(`/api/v1/visitors/${id}`)
      .set(headers)
      .expect(200);
  });
});
