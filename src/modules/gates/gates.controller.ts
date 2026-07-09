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
import { GatesService } from './gates.service';
import { CreateGateDto, UpdateGateDto } from './dto';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { PermissionsGuard } from '@/shared/guards/permissions.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { Permissions } from '@/shared/decorators/permissions.decorator';
import { Role } from '@/modules/roles/enums/role.enum';
import { Permission } from '@/modules/roles/enums/permission.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Gates')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'gates', version: '1' })
@UseGuards(JwtAuthGuard)
export class GatesController {
  constructor(private readonly gatesService: GatesService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_GATES)
  @ApiOperation({ summary: 'Create a new gate' })
  @ApiResponse({ status: 201, description: 'Gate created successfully' })
  @ApiResponse({ status: 409, description: 'Gate name already exists' })
  create(@Body() createGateDto: CreateGateDto) {
    return this.gatesService.create(createGateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all gates with pagination, search, and sorting',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Return paginated gates' })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.gatesService.findAll(paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gate by ID' })
  @ApiResponse({ status: 200, description: 'Return gate' })
  @ApiResponse({ status: 404, description: 'Gate not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.gatesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_GATES)
  @ApiOperation({ summary: 'Update gate' })
  @ApiResponse({ status: 200, description: 'Gate updated successfully' })
  @ApiResponse({ status: 404, description: 'Gate not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGateDto: UpdateGateDto,
  ) {
    return this.gatesService.update(id, updateGateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_GATES)
  @ApiOperation({ summary: 'Delete gate (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Gate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Gate not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.gatesService.remove(id);
  }
}
