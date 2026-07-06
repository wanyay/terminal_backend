import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

export class ActiveTrucksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by entry gate ID',
    example: 'c7ce6251-4e95-48ea-b697-e1cacf5d2ad4',
  })
  @IsUUID('4')
  @IsOptional()
  gateId?: string;
}
