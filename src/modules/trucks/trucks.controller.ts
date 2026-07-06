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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TrucksService } from './trucks.service';
import {
  CreateTruckDto,
  UpdateTruckDto,
  RegisterTruckEntryDto,
  RegisterTruckExitDto,
  ActiveTrucksQueryDto,
} from './dto';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { PermissionsGuard } from '@/shared/guards/permissions.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { Permissions } from '@/shared/decorators/permissions.decorator';
import { Role } from '@/modules/roles/enums/role.enum';
import { Permission } from '@/modules/roles/enums/permission.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Container Trucks')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'trucks', version: '1' })
@UseGuards(JwtAuthGuard)
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Create a new container truck record' })
  @ApiResponse({ status: 201, description: 'Truck created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createTruckDto: CreateTruckDto) {
    return this.trucksService.create(createTruckDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all container trucks with pagination, search, and sorting',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: 200,
    description: 'Return paginated container trucks',
  })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.trucksService.findAll(paginationQuery);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get all active (entered) container trucks with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated active container trucks',
  })
  findAllActive(@Query() query: ActiveTrucksQueryDto) {
    return this.trucksService.findAllActive(query, query.gateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a container truck by ID' })
  @ApiResponse({ status: 200, description: 'Return container truck' })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.trucksService.findOne(id);
  }

  @Post('entry')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SECURITY_OFFICER)
  @Permissions(Permission.REGISTER_ENTRY)
  @ApiOperation({ summary: 'Register a container truck entry' })
  @ApiResponse({ status: 201, description: 'Entry registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  registerEntry(@Body() dto: RegisterTruckEntryDto) {
    return this.trucksService.registerEntry(dto);
  }

  @Post(':id/exit')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SECURITY_OFFICER)
  @Permissions(Permission.REGISTER_EXIT)
  @ApiOperation({ summary: 'Register a container truck exit' })
  @ApiResponse({ status: 201, description: 'Exit registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  registerExit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterTruckExitDto,
  ) {
    return this.trucksService.registerExit(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Cancel a container truck record' })
  @ApiResponse({ status: 200, description: 'Truck cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.trucksService.cancel(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Update a container truck record' })
  @ApiResponse({ status: 200, description: 'Truck updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTruckDto: UpdateTruckDto,
  ) {
    return this.trucksService.update(id, updateTruckDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Soft delete a container truck record' })
  @ApiResponse({ status: 200, description: 'Truck deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.trucksService.remove(id);
  }
}
