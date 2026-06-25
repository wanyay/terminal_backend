import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CreateVehicleDto } from './create-vehicle.dto';
import { TruckStatus } from '@/modules/trucks/enums/truck-status.enum';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiPropertyOptional({ enum: TruckStatus })
  @IsEnum(TruckStatus)
  @IsOptional()
  status?: TruckStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  exitGateId?: string;
}
