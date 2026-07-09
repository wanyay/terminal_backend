import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { BlacklistType } from '../enums/blacklist-type.enum';

export class CreateBlacklistDto {
  @ApiProperty({ enum: BlacklistType, example: BlacklistType.LICENSE_PLATE })
  @IsEnum(BlacklistType)
  @IsNotEmpty()
  type: BlacklistType;

  @ApiProperty({ example: 'YGN-1234' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 'Unauthorized vehicle', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ example: 'uuid-of-blocking-user', required: false })
  @IsString()
  @IsOptional()
  blockedBy?: string;
}
