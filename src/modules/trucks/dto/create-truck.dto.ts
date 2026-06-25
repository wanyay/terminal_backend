import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateTruckDto {
  @ApiProperty({ example: 'YGN-1234' })
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @ApiProperty({ example: 'CONT-5678' })
  @IsString()
  @IsNotEmpty()
  containerNumber: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  driverName: string;

  @ApiPropertyOptional({ example: '12/ABC(N)123456' })
  @IsString()
  @IsOptional()
  driverNrc?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsOptional()
  entryGateId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
