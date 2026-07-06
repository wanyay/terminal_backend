import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID, IsArray } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'gate-id-1' })
  @IsUUID()
  @IsOptional()
  assignedGateId?: string;

  @ApiPropertyOptional({ example: ['gate-id-1', 'gate-id-2'] })
  @IsUUID('4', { each: true })
  @IsArray()
  @IsOptional()
  manageableGateIds?: string[];
}
