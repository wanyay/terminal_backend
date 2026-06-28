import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/core/database/entities/base.entity';
import { Gate } from '@/modules/gates/entities/gate.entity';
import { TruckStatus } from '../enums/truck-status.enum';

@Entity('container_trucks')
export class ContainerTruck extends BaseEntity {
  @Column({ name: 'license_plate' })
  licensePlate: string;

  @Column({ name: 'container_number', nullable: true })
  containerNumber: string;

  @Column({ name: 'driver_name', nullable: true })
  driverName: string;

  @Column({ name: 'driver_nrc', nullable: true })
  driverNrc: string;

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
