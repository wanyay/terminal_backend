import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContainerTruck } from './entities/container-truck.entity';
import { TrucksService } from './trucks.service';
import { TrucksController } from './trucks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContainerTruck])],
  controllers: [TrucksController],
  providers: [TrucksService],
  exports: [TrucksService],
})
export class TrucksModule {}
