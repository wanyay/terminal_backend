import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { GateType } from '../enums/gate-type.enum';

export class CreateGateDto {
  @ApiProperty({ example: 'EG-01' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Entry Gate 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: GateType, example: GateType.ENTRY })
  @IsEnum(GateType)
  @IsNotEmpty()
  type: GateType;

  @ApiPropertyOptional({ example: 'Main entrance for container trucks' })
  @IsString()
  @IsOptional()
  description?: string;
}
