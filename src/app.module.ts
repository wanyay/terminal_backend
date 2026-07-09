import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from '@/core/config/config.module';
import { DatabaseModule } from '@/core/database/database.module';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { RolesModule } from '@/modules/roles/roles.module';
import { GatesModule } from '@/modules/gates/gates.module';
import { TrucksModule } from '@/modules/trucks/trucks.module';
import { VisitorsModule } from '@/modules/visitors/visitors.module';
import { VehiclesModule } from '@/modules/vehicles/vehicles.module';
import { AuditLogsModule } from '@/modules/audit-logs/audit-logs.module';
import { BlacklistModule } from '@/modules/blacklist/blacklist.module';
import { HealthModule } from '@/modules/health/health.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { RequestContextMiddleware } from '@/shared/middleware/request-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AppConfigModule,
    DatabaseModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('throttler.ttl', 60000),
            limit: configService.get<number>('throttler.limit', 20),
          },
        ],
      }),
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    GatesModule,
    TrucksModule,
    VisitorsModule,
    VehiclesModule,
    AuditLogsModule,
    BlacklistModule,
    HealthModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
