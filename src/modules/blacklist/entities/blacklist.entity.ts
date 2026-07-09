import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/core/database/entities/base.entity';
import { BlacklistType } from '../enums/blacklist-type.enum';

@Entity('blacklist')
export class Blacklist extends BaseEntity {
  @Column()
  type: BlacklistType;

  @Column()
  value: string;

  @Column({ nullable: true, type: 'text' })
  reason: string;

  @Column({ name: 'blocked_by', nullable: true })
  blockedBy: string;

  @Column({ name: 'blocked_at', type: 'datetime' })
  blockedAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
