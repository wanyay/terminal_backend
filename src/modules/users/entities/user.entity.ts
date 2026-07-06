import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { BaseEntity } from '@/core/database/entities/base.entity';
import { RoleEntity } from '@/modules/roles/entities/role.entity';
import { Gate } from '@/modules/gates/entities/gate.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column({ unique: true, nullable: true, type: 'varchar' })
  email: string | null;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'must_change_password', default: true })
  mustChangePassword: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  @Exclude()
  refreshToken: string | null = null;

  @ManyToMany(() => RoleEntity, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  @ManyToOne(() => Gate, { eager: true, nullable: true })
  @JoinColumn({ name: 'assigned_gate_id' })
  assignedGate: Gate | null;

  @ManyToMany(() => Gate, { eager: true })
  @JoinTable({
    name: 'user_manageable_gates',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'gate_id', referencedColumnName: 'id' },
  })
  manageableGates: Gate[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (
      this.password &&
      !this.password.startsWith('$2a$') &&
      !this.password.startsWith('$2b$')
    ) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
