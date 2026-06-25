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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { PermissionsGuard } from '@/shared/guards/permissions.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { Permissions } from '@/shared/decorators/permissions.decorator';
import { Role } from '@/modules/roles/enums/role.enum';
import { Permission } from '@/modules/roles/enums/permission.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new user (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all users with pagination, search, and sorting',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Return paginated users' })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.usersService.findAll(paginationQuery);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Return user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.SUPER_ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
