import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { PermissionsGuard } from '@/shared/guards/permissions.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { Permissions } from '@/shared/decorators/permissions.decorator';
import { Role } from '@/modules/roles/enums/role.enum';
import { Permission } from '@/modules/roles/enums/permission.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'audit-logs', version: '1' })
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  @ApiOperation({ summary: 'Get all audit logs with pagination, search, and sorting' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Return paginated audit logs' })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.auditLogsService.findAll(paginationQuery);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Return paginated audit logs for the user' })
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.auditLogsService.findByUser(userId, paginationQuery);
  }

  @Get('module/:module')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  @ApiOperation({ summary: 'Get audit logs for a specific module' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Return paginated audit logs for the module' })
  findByModule(
    @Param('module') module: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.auditLogsService.findByModule(module, paginationQuery);
  }
}
