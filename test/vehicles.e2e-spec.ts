import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthHeader } from './test-utils';

describe('Visiting Vehicles (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /api/v1/vehicles — create vehicle', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set(headers)
      .send({
        plateNumber: 'YGN-999',
        vehicleType: 'Truck',
        visitorName: 'Driver',
      })
      .expect(201);
    expect(res.body.data.plateNumber).toBe('YGN-999');
  });

  it('GET /api/v1/vehicles — paginated list', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/vehicles')
      .set(headers)
      .expect(200);
    expect(res.body.meta).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/vehicles/active', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/vehicles/active')
      .set(headers)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/vehicles/entry — register entry', async () => {
    const headers = await getAuthHeader(app);
    const gateRes = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'VG-E', name: 'Vehicle Entry', type: 'ENTRY' });
    const res = await request(app.getHttpServer())
      .post('/api/v1/vehicles/entry')
      .set(headers)
      .send({
        plateNumber: 'ENT-CAR',
        visitorName: 'V',
        entryGateId: gateRes.body.data.id,
      })
      .expect(201);
    expect(res.body.data.entryTime).toBeDefined();
  });

  it('POST /api/v1/vehicles/:id/exit — register exit', async () => {
    const headers = await getAuthHeader(app);
    const gateRes = await request(app.getHttpServer())
      .post('/api/v1/gates')
      .set(headers)
      .send({ code: 'VG-X', name: 'Vehicle Exit', type: 'EXIT' });
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set(headers)
      .send({ plateNumber: 'EXIT-CAR', visitorName: 'Exiter' });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${id}/exit`)
      .set(headers)
      .send({ exitGateId: gateRes.body.data.id })
      .expect(201);
    expect(res.body.data.status).toBe('EXITED');
  });

  it('POST /api/v1/vehicles/:id/cancel', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set(headers)
      .send({ plateNumber: 'CXL-CAR', visitorName: 'Canceller' });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${id}/cancel`)
      .set(headers)
      .expect(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('PATCH /api/v1/vehicles/:id — update', async () => {
    const headers = await getAuthHeader(app);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set(headers)
      .send({ plateNumber: 'UPD-CAR', visitorName: 'Updater' });
    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/vehicles/${id}`)
      .set(headers)
      .send({ vehicleType: 'Sedan' })
      .expect(200);
    expect(res.body.data.vehicleType).toBe('Sedan');
  });
});
