import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/core/database/entities/base.entity';
import { Gate } from '@/modules/gates/entities/gate.entity';
import { TruckStatus } from '@/modules/trucks/enums/truck-status.enum';

@Entity('visitors')
export class Visitor extends BaseEntity {
  @Column({ name: 'visitor_name' })
  visitorName: string;

  @Column({ name: 'nrc_or_passport', nullable: true })
  nrcOrPassport: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({ name: 'purpose_of_visit', nullable: true })
  purposeOfVisit: string;

  @Column({ name: 'host_employee', nullable: true })
  hostEmployee: string;

  @ManyToOne(() => Gate, { nullable: true })
  @JoinColumn({ name: 'entry_gate_id' })
  entryGate: Gate;

  @Column({ name: 'entry_gate_id', type: 'varchar', nullable: true })
  entryGateId: string;

  @ManyToOne(() => Gate, { nullable: true })
  @JoinColumn({ name: 'exit_gate_id' })
  exitGate: Gate;

  @Column({ name: 'exit_gate_id', type: 'varchar', nullable: true })
  exitGateId: string;

  @Column({ name: 'entry_time', type: 'datetime', nullable: true })
  entryTime: Date;

  @Column({ name: 'exit_time', type: 'datetime', nullable: true })
  exitTime: Date;

  @Column({ type: 'varchar', default: TruckStatus.ENTERED })
  status: TruckStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;
}
