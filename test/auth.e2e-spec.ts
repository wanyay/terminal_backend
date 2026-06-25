import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, getAuthToken, getAuthHeader } from './test-utils';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        })
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject duplicate username', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'dupe',
          password: 'password123',
          firstName: 'A',
          lastName: 'B',
        })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'dupe',
          password: 'password123',
          firstName: 'A',
          lastName: 'B',
        })
        .expect(409);
    });

    it('should reject short password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'u', password: '123', firstName: 'A', lastName: 'B' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: 'wrong' })
        .expect(401);
    });

    it('should reject non-existent username', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: 'nobody', password: 'password123' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const headers = await getAuthHeader(app);
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set(headers)
        .expect(200);
    });

    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      const refreshToken = loginRes.body.data.refreshToken;
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should change password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'pwduser',
          password: 'oldpass1',
          firstName: 'P',
          lastName: 'U',
        });
      const headers = await getAuthHeader(app, 'pwduser', 'oldpass1');
      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set(headers)
        .send({ currentPassword: 'oldpass1', newPassword: 'newpass1' })
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: 'pwduser', password: 'newpass1' })
        .expect(200);
    });

    it('should reject wrong current password', async () => {
      const headers = await getAuthHeader(app);
      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set(headers)
        .send({ currentPassword: 'wrongpass', newPassword: 'newpass1' })
        .expect(400);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return profile', async () => {
      const headers = await getAuthHeader(app);
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set(headers)
        .expect(200);
      expect(res.body.data.username).toBe('admin');
    });

    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });
  });
});
