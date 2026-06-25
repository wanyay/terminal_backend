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
    const roleDefinitions: { name: string; description: string }[] = [
      {
        name: Role.SUPER_ADMIN,
        description:
          'Full system access: manage users, roles, permissions, gates, view audit logs and reports',
      },
      {
        name: Role.SECURITY_OFFICER,
        description:
          'Register entry/exit, search records, print passes. Cannot manage users, roles, or system settings',
      },
      {
        name: Role.SUPERVISOR,
        description:
          'View dashboard, view and export reports, search records. Cannot modify historical records',
      },
      {
        name: Role.USER,
        description: 'Basic user role with limited access',
      },
    ];

    for (const def of roleDefinitions) {
      const existingRole = await this.findByName(def.name);
      if (!existingRole) {
        const role = this.roleRepository.create(def);
        await this.roleRepository.save(role);
      }
    }
  }
}
