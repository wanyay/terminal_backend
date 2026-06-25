import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CreateVisitorDto } from './create-visitor.dto';
import { TruckStatus } from '@/modules/trucks/enums/truck-status.enum';

export class UpdateVisitorDto extends PartialType(CreateVisitorDto) {
  @ApiPropertyOptional({ enum: TruckStatus })
  @IsEnum(TruckStatus)
  @IsOptional()
  status?: TruckStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  exitGateId?: string;
}
