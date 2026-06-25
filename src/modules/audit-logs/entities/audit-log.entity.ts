import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/core/database/entities/base.entity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ nullable: true })
  username: string;

  @Column()
  action: string;

  @Column()
  module: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'old_values', type: 'json', nullable: true })
  oldValues: Record<string, unknown> | null;

  @Column({ name: 'new_values', type: 'json', nullable: true })
  newValues: Record<string, unknown> | null;
}
