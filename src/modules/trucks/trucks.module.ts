import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContainerTruck } from './entities/container-truck.entity';
import { TrucksService } from './trucks.service';
import { TrucksController } from './trucks.controller';
import { BlacklistModule } from '@/modules/blacklist/blacklist.module';

@Module({
  imports: [TypeOrmModule.forFeature([ContainerTruck]), BlacklistModule],
  controllers: [TrucksController],
  providers: [TrucksService],
  exports: [TrucksService],
})
export class TrucksModule {}
