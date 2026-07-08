import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ContainerTruck } from '@/modules/trucks/entities/container-truck.entity';
import { VisitingVehicle } from '@/modules/vehicles/entities/visiting-vehicle.entity';
import { Visitor } from '@/modules/visitors/entities/visitor.entity';
import { Gate } from '@/modules/gates/entities/gate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContainerTruck,
      VisitingVehicle,
      Visitor,
      Gate,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
