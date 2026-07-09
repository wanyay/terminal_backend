import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { BlacklistService } from './blacklist.service';
import { CreateBlacklistDto, UpdateBlacklistDto } from './dto';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { PermissionsGuard } from '@/shared/guards/permissions.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { Permissions } from '@/shared/decorators/permissions.decorator';
import { Role } from '@/modules/roles/enums/role.enum';
import { Permission } from '@/modules/roles/enums/permission.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Blacklist')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'blacklist', version: '1' })
@UseGuards(JwtAuthGuard)
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_BLACKLIST)
  @ApiOperation({ summary: 'Add entry to blacklist' })
  @ApiResponse({
    status: 201,
    description: 'Blacklist entry created successfully',
  })
  @ApiResponse({ status: 409, description: 'Entry already blocked' })
  create(@Body() createBlacklistDto: CreateBlacklistDto) {
    return this.blacklistService.create(createBlacklistDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all blacklist entries with pagination, search, and sorting',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: 200,
    description: 'Return paginated blacklist entries',
  })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.blacklistService.findAll(paginationQuery);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if a value is blocked' })
  @ApiQuery({
    name: 'type',
    required: true,
    enum: ['license_plate', 'nrc_passport'],
  })
  @ApiQuery({ name: 'value', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Return blocked status' })
  checkBlocked(@Query('type') type: string, @Query('value') value: string) {
    return this.blacklistService.checkBlocked(type, value);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blacklist entry by ID' })
  @ApiResponse({ status: 200, description: 'Return blacklist entry' })
  @ApiResponse({ status: 404, description: 'Blacklist entry not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.blacklistService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_BLACKLIST)
  @ApiOperation({ summary: 'Update blacklist entry' })
  @ApiResponse({
    status: 200,
    description: 'Blacklist entry updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Blacklist entry not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBlacklistDto: UpdateBlacklistDto,
  ) {
    return this.blacklistService.update(id, updateBlacklistDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_BLACKLIST)
  @ApiOperation({ summary: 'Delete blacklist entry (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Blacklist entry deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Blacklist entry not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.blacklistService.remove(id);
  }
}
