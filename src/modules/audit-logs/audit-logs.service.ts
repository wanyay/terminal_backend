import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResult } from '@/shared/interfaces/paginated-result.interface';
import { paginate } from '@/shared/helpers/paginate';
import { requestContext } from '@/shared/context/request-context';
import { redactSensitiveData } from './helpers/redact.helper';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto';

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
  private readonly logger = new Logger(AuditLogsService.name);

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
      where: this.buildWhere(paginationQuery as AuditLogsQueryDto),
      sortFieldMap: { timestamp: 'createdAt' },
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
      sortFieldMap: { timestamp: 'createdAt' },
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
      sortFieldMap: { timestamp: 'createdAt' },
    });
  }

  async log(data: CreateAuditLogData): Promise<AuditLog | null> {
    try {
      const userId = data.userId ?? requestContext.getUserId();
      const username = data.username ?? requestContext.getUsername();
      const ipAddress = data.ipAddress ?? requestContext.getIpAddress();
      const userAgent = data.userAgent ?? requestContext.getUserAgent();

      const auditLog = this.auditLogRepository.create({
        userId,
        username,
        action: data.action,
        module: data.module,
        ipAddress,
        userAgent,
        oldValues: redactSensitiveData(data.oldValues),
        newValues: redactSensitiveData(data.newValues),
      });

      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Fail-soft: an audit insert failure must never break the business operation.
      this.logger.error(
        `Failed to write audit log (action=${data.action}, module=${data.module}): ${String(error)}`,
      );
      return null;
    }
  }

  /**
   * Hard-delete audit logs older than the given number of months.
   * Default retention is 12 months. This is intended to be invoked by a
   * scheduled/on-demand job; the default is configurable via the argument.
   */
  async cleanupOldLogs(months = 12): Promise<number> {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);

      const result = await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .from(AuditLog)
        .where('created_at < :cutoff', { cutoff })
        .execute();

      return result.affected ?? 0;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old audit logs: ${String(error)}`,
      );
      return 0;
    }
  }

  private buildWhere(query: AuditLogsQueryDto): any {
    const where: any = {};

    if (query.from && query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      where.createdAt = Between(new Date(query.from), to);
    } else if (query.from) {
      where.createdAt = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      where.createdAt = LessThanOrEqual(to);
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.module) {
      where.module = query.module;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.username) {
      where.username = query.username;
    }

    return Object.keys(where).length ? where : undefined;
  }
}
