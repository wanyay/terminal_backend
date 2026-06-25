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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TrucksService } from './trucks.service';
import {
  CreateTruckDto,
  UpdateTruckDto,
  RegisterTruckEntryDto,
  RegisterTruckExitDto,
} from './dto';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { PermissionsGuard } from '@/shared/guards/permissions.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { Permissions } from '@/shared/decorators/permissions.decorator';
import { Role } from '@/modules/roles/enums/role.enum';
import { Permission } from '@/modules/roles/enums/permission.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Trucks')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'trucks', version: '1' })
@UseGuards(JwtAuthGuard)
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  create(@Body() createTruckDto: CreateTruckDto) {
    return this.trucksService.create(createTruckDto);
  }

  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.trucksService.findAll(paginationQuery);
  }

  @Get('active')
  findAllActive() {
    return this.trucksService.findAllActive();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.trucksService.findOne(id);
  }

  @Post('entry')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SECURITY_OFFICER)
  @Permissions(Permission.REGISTER_ENTRY)
  registerEntry(@Body() dto: RegisterTruckEntryDto) {
    return this.trucksService.registerEntry(dto);
  }

  @Post(':id/exit')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN, Role.SECURITY_OFFICER)
  @Permissions(Permission.REGISTER_EXIT)
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
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.trucksService.cancel(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.trucksService.remove(id);
  }
}
