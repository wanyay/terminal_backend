import {
  Controller,
  Get,
  Post,
  Res,
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
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  RegisterVehicleEntryDto,
  RegisterVehicleExitDto,
  ActiveVehiclesQueryDto,
  VehiclesQueryDto,
} from './dto';
import { Response } from 'express';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { PermissionsGuard } from '@/shared/guards/permissions.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { Permissions } from '@/shared/decorators/permissions.decorator';
import { Role } from '@/modules/roles/enums/role.enum';
import { Permission } from '@/modules/roles/enums/permission.enum';

@ApiTags('Visiting Vehicles')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'vehicles', version: '1' })
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Create a new visiting vehicle record' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all visiting vehicles with pagination, search, sorting, and filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'entryGateId', required: false, type: String })
  @ApiQuery({ name: 'exitGateId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Return paginated visiting vehicles',
  })
  findAll(@Query() query: VehiclesQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get('export')
  @ApiOperation({
    summary:
      'Export visiting vehicles to Excel with pagination, search, sorting, and filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'entryGateId', required: false, type: String })
  @ApiQuery({ name: 'exitGateId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Return exported visiting vehicles as Excel',
  })
  async exportToExcel(@Query() query: VehiclesQueryDto, @Res() res: Response) {
    const buffer = await this.vehiclesService.exportToExcel(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=visiting-vehicles.xlsx',
    );
    res.send(buffer);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get all actively entered visiting vehicles with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated active visiting vehicles',
  })
  findAllActive(@Query() query: ActiveVehiclesQueryDto) {
    return this.vehiclesService.findAllActive(query, query.gateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visiting vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Return visiting vehicle' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post('entry')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SECURITY_OFFICER)
  @Permissions(Permission.REGISTER_ENTRY)
  @ApiOperation({ summary: 'Register a visiting vehicle entry' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle entry registered successfully',
  })
  registerEntry(@Body() dto: RegisterVehicleEntryDto) {
    return this.vehiclesService.registerEntry(dto);
  }

  @Post(':id/exit')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SECURITY_OFFICER)
  @Permissions(Permission.REGISTER_EXIT)
  @ApiOperation({ summary: 'Register a visiting vehicle exit' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle exit registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Vehicle is not in ENTERED status' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  registerExit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterVehicleExitDto,
  ) {
    return this.vehiclesService.registerExit(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Cancel a visiting vehicle record' })
  @ApiResponse({ status: 200, description: 'Vehicle cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.cancel(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Update a visiting vehicle record' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Delete a visiting vehicle record' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.remove(id);
  }
}
