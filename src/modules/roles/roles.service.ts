import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { Role } from './enums/role.enum';
import { Permission } from './enums/permission.enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.roleRepository.find();
  }

  async createDefaultRoles(): Promise<void> {
    // 1. Create all permissions
    const permissionMap = await this.createDefaultPermissions();

    // 2. Define roles with their permissions
    const roleDefinitions: {
      name: Role;
      description: string;
      permissions: Permission[];
    }[] = [
      {
        name: Role.SUPER_ADMIN,
        description:
          'Full system access: manage users, roles, permissions, gates, view audit logs and reports',
        permissions: Object.values(Permission), // All permissions
      },
      {
        name: Role.SECURITY_OFFICER,
        description:
          'Register entry/exit, search records, print passes. Cannot manage users, roles, or system settings',
        permissions: [
          Permission.REGISTER_ENTRY,
          Permission.REGISTER_EXIT,
          Permission.SEARCH_RECORDS,
          Permission.PRINT_PASSES,
        ],
      },
      {
        name: Role.SUPERVISOR,
        description:
          'View dashboard, view and export reports, search records, manage users/gates/blacklist (no delete), view audit logs. Cannot modify historical records',
        permissions: [
          Permission.VIEW_DASHBOARD,
          Permission.VIEW_REPORTS,
          Permission.EXPORT_REPORTS,
          Permission.SEARCH_RECORDS,
          Permission.MANAGE_USERS,
          Permission.MANAGE_GATES,
          Permission.MANAGE_BLACKLIST,
          Permission.VIEW_AUDIT_LOGS,
        ],
      },
      {
        name: Role.USER,
        description: 'Basic user role with limited access',
        permissions: [Permission.SEARCH_RECORDS],
      },
    ];

    // 3. Create roles with permissions
    for (const def of roleDefinitions) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: def.name },
        relations: ['permissions'],
      });

      const permissions = def.permissions
        .map((p) => permissionMap.get(p))
        .filter((p): p is PermissionEntity => p !== undefined);

      if (existingRole) {
        existingRole.description = def.description;
        existingRole.permissions = permissions;
        await this.roleRepository.save(existingRole);
      } else {
        const role = this.roleRepository.create({
          name: def.name,
          description: def.description,
          permissions,
        });
        await this.roleRepository.save(role);
      }
    }
  }

  private async createDefaultPermissions(): Promise<
    Map<Permission, PermissionEntity>
  > {
    const permissionMap = new Map<Permission, PermissionEntity>();

    const permissionDefinitions: {
      name: Permission;
      description: string;
    }[] = [
      {
        name: Permission.MANAGE_USERS,
        description: 'Create, update, delete, and view users',
      },
      {
        name: Permission.MANAGE_ROLES,
        description: 'Create, update, delete, and view roles',
      },
      {
        name: Permission.MANAGE_PERMISSIONS,
        description: 'Assign and revoke permissions from roles',
      },
      {
        name: Permission.MANAGE_SYSTEM_SETTINGS,
        description: 'Configure system-wide settings',
      },
      {
        name: Permission.MANAGE_GATES,
        description: 'Create, update, delete, and view entry/exit gates',
      },
      {
        name: Permission.MANAGE_BLACKLIST,
        description:
          'Manage blacklist entries for license plates and NRC/Passports',
      },
      {
        name: Permission.REGISTER_ENTRY,
        description: 'Register vehicle or visitor entry',
      },
      {
        name: Permission.REGISTER_EXIT,
        description: 'Register vehicle or visitor exit',
      },
      {
        name: Permission.SEARCH_RECORDS,
        description: 'Search vehicle and visitor records',
      },
      {
        name: Permission.VIEW_DASHBOARD,
        description: 'View the operations dashboard',
      },
      {
        name: Permission.VIEW_REPORTS,
        description: 'View reports',
      },
      {
        name: Permission.VIEW_AUDIT_LOGS,
        description: 'View system audit logs',
      },
      {
        name: Permission.PRINT_PASSES,
        description: 'Print visitor passes',
      },
      {
        name: Permission.EXPORT_REPORTS,
        description: 'Export reports to PDF or Excel',
      },
    ];

    for (const def of permissionDefinitions) {
      let permission = await this.permissionRepository.findOne({
        where: { name: def.name },
      });
      if (!permission) {
        permission = this.permissionRepository.create(def);
        await this.permissionRepository.save(permission);
      }
      permissionMap.set(def.name, permission);
    }

    return permissionMap;
  }
}
