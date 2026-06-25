import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateVehicleDto {
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

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  entryGateId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
