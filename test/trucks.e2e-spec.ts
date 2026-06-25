import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthHeader } from './test-utils';

describe('Container Trucks (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /api/v1/trucks — create truck', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .post('/api/v1/trucks')
      .set(headers)
      .send({
        licensePlate: 'YGN-1234',
        containerNumber: 'CONT-5678',
        driverName: 'John',
        driverNrc: '12/NRC',
      })
      .expect(201);
    expect(res.body.data.licensePlate).toBe('YGN-1234');
    expect(res.body.data.status).toBe('ENTERED');
  });

  it('GET /api/v1/trucks — paginated list', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/trucks')
      .set(headers)
      .expect(200);
    expect(res.body.meta).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/trucks — search', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/trucks?search=John')
      .set(headers)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/trucks/active — only active', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/trucks/active')
      .set(headers)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/trucks/entry — register entry', async () => {
    const headers = await getAuthHeader(app);
    const gateRes = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'G1', name: 'Gate 1', type: 'ENTRY' });
    const gateId = gateRes.body.data.id;
    const res = await request(app.getHttpServer())
      .post('/api/v1/trucks/entry')
      .set(headers)
      .send({
        licensePlate: 'ENT-01',
        containerNumber: 'C-ENT',
        driverName: 'Driver',
        entryGateId: gateId,
      })
      .expect(201);
    expect(res.body.data.status).toBe('ENTERED');
    expect(res.body.data.entryTime).toBeDefined();
  });

  it('POST /api/v1/trucks/:id/exit — register exit', async () => {
    const headers = await getAuthHeader(app);
    const gateRes = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'EX-G', name: 'Exit Gate', type: 'EXIT' });
    const gateId = gateRes.body.data.id;
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/trucks')
      .set(headers)
      .send({
        licensePlate: 'TMP-10',
        containerNumber: 'C-TMP',
        driverName: 'Tmp',
      });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/trucks/${id}/exit`)
      .set(headers)
      .send({ exitGateId: gateId, remarks: 'All clear' })
      .expect(201);
    expect(res.body.data.status).toBe('EXITED');
    expect(res.body.data.exitTime).toBeDefined();
  });

  it('POST /api/v1/trucks/:id/cancel — cancel truck', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/trucks')
      .set(headers)
      .send({
        licensePlate: 'CANCEL-ME',
        containerNumber: 'C-CXL',
        driverName: 'Cancel',
      });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/trucks/${id}/cancel`)
      .set(headers)
      .expect(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('PATCH /api/v1/trucks/:id — update truck', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/trucks')
      .set(headers)
      .send({
        licensePlate: 'UPD-ME',
        containerNumber: 'C-UPD',
        driverName: 'Old',
      });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/trucks/${id}`)
      .set(headers)
      .send({ driverName: 'Updated Driver' })
      .expect(200);
    expect(res.body.data.driverName).toBe('Updated Driver');
  });

  it('DELETE /api/v1/trucks/:id — soft delete', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/trucks')
      .set(headers)
      .send({
        licensePlate: 'DEL-ME',
        containerNumber: 'C-DEL',
        driverName: 'Del',
      });
    const id = createRes.body.data.id;
    await request(app.getHttpServer())
      .delete(`/api/v1/trucks/${id}`)
      .set(headers)
      .expect(200);
  });
});
