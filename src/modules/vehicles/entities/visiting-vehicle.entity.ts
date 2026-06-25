import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/core/database/entities/base.entity';
import { Gate } from '@/modules/gates/entities/gate.entity';
import { TruckStatus } from '@/modules/trucks/enums/truck-status.enum';

@Entity('visiting_vehicles')
export class VisitingVehicle extends BaseEntity {
  @Column({ name: 'plate_number' })
  plateNumber: string;

  @Column({ name: 'vehicle_type', nullable: true })
  vehicleType: string;

  @Column({ name: 'vehicle_model', nullable: true })
  vehicleModel: string;

  @Column({ name: 'visitor_name' })
  visitorName: string;

  @Column({ name: 'nrc_or_license', nullable: true })
  nrcOrLicense: string;

  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({ name: 'purpose_of_visit', nullable: true })
  purposeOfVisit: string;

  @ManyToOne(() => Gate, { nullable: true })
  @JoinColumn({ name: 'entry_gate_id' })
  entryGate: Gate;

  @Column({ name: 'entry_gate_id', nullable: true })
  entryGateId: string;

  @ManyToOne(() => Gate, { nullable: true })
  @JoinColumn({ name: 'exit_gate_id' })
  exitGate: Gate;

  @Column({ name: 'exit_gate_id', nullable: true })
  exitGateId: string;

  @Column({ name: 'entry_time', type: 'timestamp', nullable: true })
  entryTime: Date;

  @Column({ name: 'exit_time', type: 'timestamp', nullable: true })
  exitTime: Date;

  @Column({ type: 'enum', enum: TruckStatus, default: TruckStatus.ENTERED })
  status: TruckStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;
}
