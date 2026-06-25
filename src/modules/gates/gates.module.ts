import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gate } from './entities/gate.entity';
import { GatesService } from './gates.service';
import { GatesController } from './gates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Gate])],
  controllers: [GatesController],
  providers: [GatesService],
  exports: [GatesService],
})
export class GatesModule {}
