import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/core/database/entities/base.entity';
import { GateType } from '../enums/gate-type.enum';

@Entity('gates')
export class Gate extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: GateType })
  type: GateType;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
