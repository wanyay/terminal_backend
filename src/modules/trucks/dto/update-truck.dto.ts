import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CreateTruckDto } from './create-truck.dto';
import { TruckStatus } from '../enums/truck-status.enum';

export class UpdateTruckDto extends PartialType(CreateTruckDto) {
  @ApiPropertyOptional({ enum: TruckStatus })
  @IsEnum(TruckStatus)
  @IsOptional()
  status?: TruckStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  exitGateId?: string;
}
