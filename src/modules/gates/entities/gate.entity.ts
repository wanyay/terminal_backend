import { Entity, Column, OneToMany, ManyToMany } from 'typeorm';
import { BaseEntity } from '@/core/database/entities/base.entity';
import { GateType } from '../enums/gate-type.enum';
import { User } from '@/modules/users/entities/user.entity';

@Entity('gates')
export class Gate extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: GateType;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.assignedGate)
  users: User[];

  @ManyToMany(() => User, (user) => user.manageableGates)
  managingUsers: User[];
}
