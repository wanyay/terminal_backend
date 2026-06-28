import {
  Injectable,
  NotFoundException,
  ConflictException,
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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly rolesService: RolesService,
    private readonly gatesService: GatesService,
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

    const { roles: roleNames, assignedGateId, ...userData } = createUserDto;

    const user = this.userRepository.create(userData);

    const rolesToAssign = roleNames || [Role.USER];
    const roles = await Promise.all(
      rolesToAssign.map((roleName) => this.rolesService.findByName(roleName)),
    );
    user.roles = roles.filter((role) => role !== null);

    if (assignedGateId) {
      user.assignedGate = await this.gatesService.findOne(assignedGateId);
    }

    return this.userRepository.save(user);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<User>> {
    return paginate({
      source: this.userRepository,
      query: paginationQuery,
      searchableFields: ['username', 'email', 'fullName'],
      defaultSortBy: 'createdAt',
      relations: ['roles', 'assignedGate'],
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
        user.assignedGate = await this.gatesService.findOne(updateUserDto.assignedGateId);
      } else {
        user.assignedGate = null;
      }
    }

    const { roles: _roles, assignedGateId: _assignedGateId, ...dataToUpdate } = updateUserDto;
    Object.assign(user, dataToUpdate);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
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
}
