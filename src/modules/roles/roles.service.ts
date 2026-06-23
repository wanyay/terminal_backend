import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { Role } from './enums/role.enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.roleRepository.find();
  }

  async createDefaultRoles(): Promise<void> {
    const roles = Object.values(Role);

    for (const roleName of roles) {
      const existingRole = await this.findByName(roleName);
      if (!existingRole) {
        const role = this.roleRepository.create({
          name: roleName,
          description: `${roleName} role`,
        });
        await this.roleRepository.save(role);
      }
    }
  }
}
