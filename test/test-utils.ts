import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../src/modules/users/users.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { RolesModule } from '../src/modules/roles/roles.module';
import { GatesModule } from '../src/modules/gates/gates.module';
import { TrucksModule } from '../src/modules/trucks/trucks.module';
import { VisitorsModule } from '../src/modules/visitors/visitors.module';
import { VehiclesModule } from '../src/modules/vehicles/vehicles.module';
import { AuditLogsModule } from '../src/modules/audit-logs/audit-logs.module';
import { HealthModule } from '../src/modules/health/health.module';
import { RolesService } from '../src/modules/roles/roles.service';
import { UsersService } from '../src/modules/users/users.service';
import { Role } from '../src/modules/roles/enums/role.enum';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';
import { TransformInterceptor } from '../src/shared/interceptors/transform.interceptor';
import * as request from 'supertest';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:', // In-memory database for testing
        entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
        synchronize: true,
        dropSchema: true,
      }),
      ThrottlerModule.forRoot({ throttlers: [] }),
      UsersModule,
      AuthModule,
      RolesModule,
      GatesModule,
      TrucksModule,
      VisitorsModule,
      VehiclesModule,
      AuditLogsModule,
      HealthModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.init();

  const rolesService = app.get(RolesService);
  const usersService = app.get(UsersService);

  await rolesService.createDefaultRoles();

  const existingAdmin = await usersService.findByUsername('admin');
  if (!existingAdmin) {
    const admin = await usersService.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      fullName: 'Super Admin',
      roles: [Role.SUPER_ADMIN],
    });
    admin.mustChangePassword = false;
    await usersService.save(admin);
  }

  return app;
}

export async function getAuthToken(
  app: INestApplication,
  username = 'admin',
  password = 'admin123',
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ username, password })
    .expect(200);

  return res.body.data.accessToken;
}

export async function getAuthHeader(
  app: INestApplication,
  username = 'admin',
  password = 'admin123',
): Promise<{ Authorization: string }> {
  const token = await getAuthToken(app, username, password);
  return { Authorization: `Bearer ${token}` };
}
