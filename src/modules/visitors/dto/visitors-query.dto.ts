import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

export class VisitorsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by creation start date (created_at >= startDate)',
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (value) return value;
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation end date (created_at <= endDate)',
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (value) return value;
    return new Date().toISOString().split('T')[0];
  })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by entry gate ID' })
  @IsOptional()
  @IsString()
  entryGateId?: string;

  @ApiPropertyOptional({ description: 'Filter by exit gate ID' })
  @IsOptional()
  @IsString()
  exitGateId?: string;
}
