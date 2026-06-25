import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResult } from '@/shared/interfaces/paginated-result.interface';
import { paginate } from '@/shared/helpers/paginate';

export interface CreateAuditLogData {
  userId?: string;
  username?: string;
  action: string;
  module: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<AuditLog>> {
    return paginate({
      source: this.auditLogRepository,
      query: paginationQuery,
      searchableFields: ['action', 'module', 'username'],
      defaultSortBy: 'createdAt',
    });
  }

  async findByUser(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<AuditLog>> {
    return paginate({
      source: this.auditLogRepository,
      query: paginationQuery,
      searchableFields: ['action', 'module', 'username'],
      defaultSortBy: 'createdAt',
      where: { userId },
    });
  }

  async findByModule(
    module: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<AuditLog>> {
    return paginate({
      source: this.auditLogRepository,
      query: paginationQuery,
      searchableFields: ['action', 'module', 'username'],
      defaultSortBy: 'createdAt',
      where: { module },
    });
  }

  async log(data: CreateAuditLogData): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }
}
