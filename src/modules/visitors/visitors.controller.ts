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
import { VisitorsService } from './visitors.service';
import {
  CreateVisitorDto,
  UpdateVisitorDto,
  RegisterVisitorEntryDto,
  RegisterVisitorExitDto,
  VisitorsQueryDto,
} from './dto';
import { Response } from 'express';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { PermissionsGuard } from '@/shared/guards/permissions.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { Permissions } from '@/shared/decorators/permissions.decorator';
import { Role } from '@/modules/roles/enums/role.enum';
import { Permission } from '@/modules/roles/enums/permission.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Visitors')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'visitors', version: '1' })
@UseGuards(JwtAuthGuard)
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Create a new visitor' })
  @ApiResponse({ status: 201, description: 'Visitor created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createVisitorDto: CreateVisitorDto) {
    return this.visitorsService.create(createVisitorDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all visitors with pagination, search, sorting, and filters',
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
  @ApiResponse({ status: 200, description: 'Return paginated visitors' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: VisitorsQueryDto) {
    return this.visitorsService.findAll(query);
  }

  @Get('export')
  @ApiOperation({
    summary:
      'Export visitors to Excel with pagination, search, sorting, and filters',
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
    description: 'Return exported visitors as Excel',
  })
  async exportToExcel(@Query() query: VisitorsQueryDto, @Res() res: Response) {
    const buffer = await this.visitorsService.exportToExcel(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=visitors.xlsx',
    );
    res.send(buffer);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active visitors inside the port' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Return paginated active visitors' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAllActive(@Query() paginationQuery: PaginationQueryDto) {
    return this.visitorsService.findAllActive(paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visitor by ID' })
  @ApiResponse({ status: 200, description: 'Return visitor' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Visitor not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.findOne(id);
  }

  @Post('entry')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SECURITY_OFFICER)
  @Permissions(Permission.REGISTER_ENTRY)
  @ApiOperation({ summary: 'Register a visitor entry' })
  @ApiResponse({
    status: 201,
    description: 'Visitor entry registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  registerEntry(@Body() registerVisitorEntryDto: RegisterVisitorEntryDto) {
    return this.visitorsService.registerEntry(registerVisitorEntryDto);
  }

  @Post(':id/exit')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SECURITY_OFFICER)
  @Permissions(Permission.REGISTER_EXIT)
  @ApiOperation({ summary: 'Register a visitor exit' })
  @ApiResponse({
    status: 200,
    description: 'Visitor exit registered successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 404,
    description: 'Visitor not found or not currently entered',
  })
  registerExit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() registerVisitorExitDto: RegisterVisitorExitDto,
  ) {
    return this.visitorsService.registerExit(id, registerVisitorExitDto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Cancel a visitor record' })
  @ApiResponse({ status: 200, description: 'Visitor cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 404,
    description: 'Visitor not found or already exited',
  })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.cancel(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SUPERVISOR)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Update visitor' })
  @ApiResponse({ status: 200, description: 'Visitor updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Visitor not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVisitorDto: UpdateVisitorDto,
  ) {
    return this.visitorsService.update(id, updateVisitorDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Delete visitor (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Visitor deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Visitor not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.remove(id);
  }
}
