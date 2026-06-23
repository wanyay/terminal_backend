import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '@/core/database/entities/base.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('roles')
export class RoleEntity extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
