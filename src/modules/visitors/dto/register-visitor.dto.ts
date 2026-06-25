import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class RegisterVisitorEntryDto {
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

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  entryGateId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class RegisterVisitorExitDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  exitGateId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
