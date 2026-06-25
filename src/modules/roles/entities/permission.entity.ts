import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '@/core/database/entities/base.entity';
import { RoleEntity } from './role.entity';

@Entity('permissions')
export class PermissionEntity extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[];
}
