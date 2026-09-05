import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import { RolesService } from '@/modules/roles/roles.service';
import { GatesService } from '@/modules/gates/gates.service';
import { Role } from '@/modules/roles/enums/role.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResult } from '@/shared/interfaces/paginated-result.interface';
import { paginate } from '@/shared/helpers/paginate';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { AuditAction, AuditModule } from '@/modules/audit-logs/enums/audit.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly rolesService: RolesService,
    private readonly gatesService: GatesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    if (createUserDto.email) {
      const existingEmail = await this.findByEmail(createUserDto.email);
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    const {
      roles: roleNames,
      assignedGateId,
      manageableGateIds,
      ...userData
    } = createUserDto;

    const user = this.userRepository.create(userData);

    const rolesToAssign = roleNames || [Role.USER];
    const roles = await Promise.all(
      rolesToAssign.map((roleName) => this.rolesService.findByName(roleName)),
    );
    user.roles = roles.filter((role) => role !== null);

    const isSecurityOfficer = rolesToAssign.includes(Role.SECURITY_OFFICER);

    if (isSecurityOfficer && manageableGateIds?.length) {
      throw new BadRequestException(
        'Security Officers cannot be assigned to multiple manageable gates. Use assignedGateId instead.',
      );
    }

    if (assignedGateId) {
      user.assignedGate = await this.gatesService.findOne(assignedGateId);
    }

    if (manageableGateIds?.length) {
      user.manageableGates = await Promise.all(
        manageableGateIds.map((gateId) => this.gatesService.findOne(gateId)),
      );
    } else {
      user.manageableGates = [];
    }

    const saved = await this.userRepository.save(user);

    await this.auditLogsService.log({
      userId: saved.id,
      username: saved.username,
      action: AuditAction.CREATE,
      module: AuditModule.USERS,
      newValues: {
        id: saved.id,
        username: saved.username,
        email: saved.email,
        roles: saved.roles?.map((r) => r.name),
      },
    });

    return saved;
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<User>> {
    return paginate({
      source: this.userRepository,
      query: paginationQuery,
      searchableFields: ['username', 'email', 'fullName'],
      defaultSortBy: 'createdAt',
      relations: ['roles', 'assignedGate', 'manageableGates'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.findByUsername(updateUserDto.username);
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.findByEmail(updateUserDto.email);
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.roles) {
      const roles = await Promise.all(
        updateUserDto.roles.map((roleName) =>
          this.rolesService.findByName(roleName),
        ),
      );
      user.roles = roles.filter((role) => role !== null);
    }

    if (updateUserDto.assignedGateId !== undefined) {
      if (updateUserDto.assignedGateId) {
        user.assignedGate = await this.gatesService.findOne(
          updateUserDto.assignedGateId,
        );
      } else {
        user.assignedGate = null;
      }
    }

    if (updateUserDto.manageableGateIds !== undefined) {
      const isSecurityOfficer = user.roles?.some(
        (role) => role.name === Role.SECURITY_OFFICER,
      );
      if (isSecurityOfficer && updateUserDto.manageableGateIds.length > 0) {
        throw new BadRequestException(
          'Security Officers cannot be assigned to multiple manageable gates. Use assignedGateId instead.',
        );
      }
      if (updateUserDto.manageableGateIds.length > 0) {
        user.manageableGates = await Promise.all(
          updateUserDto.manageableGateIds.map((gateId) =>
            this.gatesService.findOne(gateId),
          ),
        );
      } else {
        user.manageableGates = [];
      }
    }

    const {
      roles: _roles,
      assignedGateId: _assignedGateId,
      manageableGateIds: _manageableGateIds,
      ...dataToUpdate
    } = updateUserDto;
    Object.assign(user, dataToUpdate);
    const saved = await this.userRepository.save(user);

    await this.auditLogsService.log({
      userId: saved.id,
      username: saved.username,
      action: AuditAction.UPDATE,
      module: AuditModule.USERS,
      oldValues: { id: saved.id, username: saved.username },
      newValues: { id: saved.id, ...dataToUpdate },
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);

    await this.auditLogsService.log({
      userId: user.id,
      username: user.username,
      action: AuditAction.DELETE,
      module: AuditModule.USERS,
      newValues: { id: user.id, username: user.username },
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshToken });
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    const saved = await this.userRepository.save(user);

    await this.auditLogsService.log({
      userId: saved.id,
      username: saved.username,
      action: AuditAction.ACTIVATE,
      module: AuditModule.USERS,
      newValues: { id: saved.id, isActive: true },
    });

    return saved;
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    user.refreshToken = null;
    const saved = await this.userRepository.save(user);

    await this.auditLogsService.log({
      userId: saved.id,
      username: saved.username,
      action: AuditAction.DEACTIVATE,
      module: AuditModule.USERS,
      newValues: { id: saved.id, isActive: false },
    });

    return saved;
  }
}
