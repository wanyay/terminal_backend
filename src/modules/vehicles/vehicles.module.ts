import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitingVehicle } from './entities/visiting-vehicle.entity';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { BlacklistModule } from '@/modules/blacklist/blacklist.module';

@Module({
  imports: [TypeOrmModule.forFeature([VisitingVehicle]), BlacklistModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
