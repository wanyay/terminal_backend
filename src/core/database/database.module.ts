import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuditSubscriber } from './subscribers/audit.subscriber';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
        subscribers: [AuditSubscriber],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: configService.get('app.nodeEnv') === 'development',
        logging: configService.get('app.nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
