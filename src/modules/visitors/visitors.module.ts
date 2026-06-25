import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitor } from './entities/visitor.entity';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Visitor])],
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
