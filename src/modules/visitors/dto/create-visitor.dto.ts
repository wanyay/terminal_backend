import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateVisitorDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @ApiPropertyOptional({ example: '12/ABC(N)123456' })
  @IsString()
  @IsOptional()
  nrcOrPassport?: string;

  @ApiPropertyOptional({ example: '+959123456789' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'ABC Company' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Meeting' })
  @IsString()
  @IsOptional()
  purposeOfVisit?: string;

  @ApiPropertyOptional({ example: 'Mr. Manager' })
  @IsString()
  @IsOptional()
  hostEmployee?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  entryGateId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
