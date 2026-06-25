import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class RegisterVehicleEntryDto {
  @ApiProperty({ example: 'YGN-5678' })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiPropertyOptional({ example: 'Sedan' })
  @IsString()
  @IsOptional()
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'Toyota Corolla' })
  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @ApiPropertyOptional({ example: '12/ABC(N)123456' })
  @IsString()
  @IsOptional()
  nrcOrLicense?: string;

  @ApiPropertyOptional({ example: 'ABC Company' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Delivery' })
  @IsString()
  @IsOptional()
  purposeOfVisit?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  entryGateId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class RegisterVehicleExitDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  exitGateId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
