import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthHeader } from './test-utils';
import { redactSensitiveData } from '../src/modules/audit-logs/helpers/redact.helper';

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

  it('login writes an audit row with action LOGIN and module auth', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?action=LOGIN&module=auth')
      .set(headers)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const row = res.body.data.find((r: any) => r.username === 'admin');
    expect(row).toBeDefined();
    expect(row.action).toBe('LOGIN');
    expect(row.module).toBe('auth');
  });

  it('failed login writes an audit row with action LOGIN_FAILED', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'wrong-password' })
      .expect(401);

    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?action=LOGIN_FAILED&module=auth')
      .set(headers)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].action).toBe('LOGIN_FAILED');
  });

  it('logout writes an audit row with action LOGOUT', async () => {
    const headers = await getAuthHeader(app);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set(headers)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?action=LOGOUT&module=auth')
      .set(headers)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].action).toBe('LOGOUT');
  });

  it('create truck writes an audit row with action CREATE and module trucks', async () => {
    const headers = await getAuthHeader(app);
    await request(app.getHttpServer())
      .post('/api/v1/trucks')
      .set(headers)
      .send({
        licensePlate: `AUD-${Date.now()}`,
        containerNumber: 'C-AUDIT',
        driverName: 'Audit Driver',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?action=CREATE&module=trucks')
      .set(headers)
      .expect(200);
    const rowsForTrucks = res.body.data.filter(() => true);
    expect(rowsForTrucks.length).toBeGreaterThanOrEqual(1);
  });

  it('export trucks writes an audit row with action EXPORT and module trucks', async () => {
    const headers = await getAuthHeader(app);
    await request(app.getHttpServer())
      .get('/api/v1/trucks/export')
      .set(headers)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?action=EXPORT&module=trucks')
      .set(headers)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].action).toBe('EXPORT');
  });

  it('GET /api/v1/audit-logs — filters by date range', async () => {
    const headers = await getAuthHeader(app);
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    const res = await request(app.getHttpServer())
      .get(`/api/v1/audit-logs?from=${from}&to=${to}`)
      .set(headers)
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/audit-logs — filters by username', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?username=admin')
      .set(headers)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    res.body.data.forEach((r: any) => expect(r.username).toBe('admin'));
  });

  it('GET /api/v1/audit-logs — sorts by timestamp alias (maps to created_at), does not error', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?sortBy=timestamp&sortOrder=DESC')
      .set(headers)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/audit-logs — unknown sortBy falls back and does not error', async () => {
    const headers = await getAuthHeader(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs?sortBy=doesNotExist')
      .set(headers)
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/audit-logs — unauthenticated is denied (401)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/audit-logs')
      .expect(401);
  });

  it('GET /api/v1/audit-logs — SECURITY_OFFICER is denied (403)', async () => {
    const headers = await getAuthHeader(app);
    // Create a security officer via the API (admin has manage-users)
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set(headers)
      .send({
        username: `officer-${Date.now()}`,
        password: 'Officer@123',
        fullName: 'Audit Officer',
        roles: ['SECURITY_OFFICER'],
      })
      .expect(201);
    const officerId = createRes.body.data.id;
    const officerUsername = createRes.body.data.username;

    // Reset password as admin sets mustChangePassword=false so the officer can authenticate
    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set(headers)
      .send({
        targetUserId: officerId,
        newPassword: 'Officer@123',
      })
      .expect(200);

    const officerToken = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: officerUsername, password: 'Officer@123' })
      .expect(200);
    const officerHeaders = {
      Authorization: `Bearer ${officerToken.body.data.accessToken}`,
    };

    await request(app.getHttpServer())
      .get('/api/v1/audit-logs')
      .set(officerHeaders)
      .expect(403);
  });

  it('redactSensitiveData helper redacts passwords and NRC values', () => {
    const redacted = redactSensitiveData({
      password: 'plaintext-pass',
      passwordHash: '$2a$10$abc',
      refreshToken: 'some-jwt-token',
      driverNrc: '12/ABC(N)123456',
      nrcOrPassport: '12/DEF(N)654321',
      licensePlate: 'YGN-1234',
      name: 'Aung Aung',
    });

    expect(redacted?.password).toBe('***');
    expect(redacted?.passwordHash).toBe('***');
    expect(redacted?.refreshToken).toBe('***');
    expect(redacted?.driverNrc).toBe('***3456');
    expect(redacted?.nrcOrPassport).toBe('***4321');
    // Non-sensitive values are preserved
    expect(redacted?.licensePlate).toBe('YGN-1234');
    expect(redacted?.name).toBe('Aung Aung');
  });
});
