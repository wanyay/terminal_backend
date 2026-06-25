import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigModule } from '@/core/config/config.module';
import { DatabaseModule } from '@/core/database/database.module';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { RolesModule } from '@/modules/roles/roles.module';
import { HealthModule } from '@/modules/health/health.module';
import { RequestContextMiddleware } from '@/shared/middleware/request-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AppConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    RolesModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
