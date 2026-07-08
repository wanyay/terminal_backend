import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ContainerTruck } from '@/modules/trucks/entities/container-truck.entity';
import { VisitingVehicle } from '@/modules/vehicles/entities/visiting-vehicle.entity';
import { Visitor } from '@/modules/visitors/entities/visitor.entity';
import { Gate } from '@/modules/gates/entities/gate.entity';
import { TruckStatus } from '@/modules/trucks/enums/truck-status.enum';

interface TodayCounts {
  todayTruckEntries: number;
  todayTruckExits: number;
  todayVehicleEntries: number;
  todayVehicleExits: number;
  todayVisitorEntries: number;
  todayVisitorExits: number;
}

interface InsideCounts {
  activeTrucks: number;
  activeVehicles: number;
  activeVisitors: number;
}

interface GateUsageItem {
  gateId: string;
  gateName: string;
  entries: number;
  exits: number;
}

interface RecentActivity {
  id: string;
  type: 'truck' | 'vehicle' | 'visitor';
  identifier: string;
  name: string;
  gateName: string;
  status: string;
  timestamp: Date;
}

export interface DashboardData {
  summary: TodayCounts;
  inside: InsideCounts;
  gateUsage: GateUsageItem[];
  recentActivities: RecentActivity[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ContainerTruck)
    private readonly truckRepo: Repository<ContainerTruck>,
    @InjectRepository(VisitingVehicle)
    private readonly vehicleRepo: Repository<VisitingVehicle>,
    @InjectRepository(Visitor)
    private readonly visitorRepo: Repository<Visitor>,
    @InjectRepository(Gate)
    private readonly gateRepo: Repository<Gate>,
  ) {}

  async getDashboard(): Promise<DashboardData> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [summary, inside, gateUsage, recentActivities] = await Promise.all([
      this.getTodaySummary(todayStart, todayEnd),
      this.getInsideCounts(),
      this.getGateUsage(todayStart, todayEnd),
      this.getRecentActivities(),
    ]);

    return { summary, inside, gateUsage, recentActivities };
  }

  private async getTodaySummary(
    todayStart: Date,
    todayEnd: Date,
  ): Promise<TodayCounts> {
    const [truckEntries, truckExits] = await Promise.all([
      this.truckRepo.count({
        where: {
          entryTime: Between(todayStart, todayEnd),
        },
      }),
      this.truckRepo.count({
        where: {
          exitTime: Between(todayStart, todayEnd),
        },
      }),
    ]);

    const [vehicleEntries, vehicleExits] = await Promise.all([
      this.vehicleRepo.count({
        where: {
          entryTime: Between(todayStart, todayEnd),
        },
      }),
      this.vehicleRepo.count({
        where: {
          exitTime: Between(todayStart, todayEnd),
        },
      }),
    ]);

    const [visitorEntries, visitorExits] = await Promise.all([
      this.visitorRepo.count({
        where: {
          entryTime: Between(todayStart, todayEnd),
        },
      }),
      this.visitorRepo.count({
        where: {
          exitTime: Between(todayStart, todayEnd),
        },
      }),
    ]);

    return {
      todayTruckEntries: truckEntries,
      todayTruckExits: truckExits,
      todayVehicleEntries: vehicleEntries,
      todayVehicleExits: vehicleExits,
      todayVisitorEntries: visitorEntries,
      todayVisitorExits: visitorExits,
    };
  }

  private async getInsideCounts(): Promise<InsideCounts> {
    const [activeTrucks, activeVehicles, activeVisitors] = await Promise.all([
      this.truckRepo.count({ where: { status: TruckStatus.ENTERED } }),
      this.vehicleRepo.count({ where: { status: TruckStatus.ENTERED } }),
      this.visitorRepo.count({ where: { status: TruckStatus.ENTERED } }),
    ]);

    return { activeTrucks, activeVehicles, activeVisitors };
  }

  private async getGateUsage(
    todayStart: Date,
    todayEnd: Date,
  ): Promise<GateUsageItem[]> {
    const gates = await this.gateRepo.find({ where: { isActive: true } });

    const gateUsage = await Promise.all(
      gates.map(async (gate) => {
        const [entries, exits] = await Promise.all([
          // Sum entries across all types for this gate today
          this.countEntriesByGate(gate.id, todayStart, todayEnd),
          // Sum exits across all types for this gate today
          this.countExitsByGate(gate.id, todayStart, todayEnd),
        ]);

        return {
          gateId: gate.id,
          gateName: gate.name,
          entries,
          exits,
        };
      }),
    );

    return gateUsage;
  }

  private async countEntriesByGate(
    gateId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const [trucks, vehicles, visitors] = await Promise.all([
      this.truckRepo.count({
        where: { entryGateId: gateId, entryTime: Between(start, end) },
      }),
      this.vehicleRepo.count({
        where: { entryGateId: gateId, entryTime: Between(start, end) },
      }),
      this.visitorRepo.count({
        where: { entryGateId: gateId, entryTime: Between(start, end) },
      }),
    ]);

    return trucks + vehicles + visitors;
  }

  private async countExitsByGate(
    gateId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const [trucks, vehicles, visitors] = await Promise.all([
      this.truckRepo.count({
        where: { exitGateId: gateId, exitTime: Between(start, end) },
      }),
      this.vehicleRepo.count({
        where: { exitGateId: gateId, exitTime: Between(start, end) },
      }),
      this.visitorRepo.count({
        where: { exitGateId: gateId, exitTime: Between(start, end) },
      }),
    ]);

    return trucks + vehicles + visitors;
  }

  private async getRecentActivities(): Promise<RecentActivity[]> {
    const recentTrucks = await this.truckRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['entryGate'],
    });

    const recentVehicles = await this.vehicleRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['entryGate'],
    });

    const recentVisitors = await this.visitorRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['entryGate'],
    });

    const activities: RecentActivity[] = [
      ...recentTrucks.map((t) => ({
        id: t.id,
        type: 'truck' as const,
        identifier: t.licensePlate,
        name: t.driverName || t.licensePlate,
        gateName: t.entryGate?.name || '—',
        status: t.status,
        timestamp: t.entryTime || t.createdAt,
      })),
      ...recentVehicles.map((v) => ({
        id: v.id,
        type: 'vehicle' as const,
        identifier: v.plateNumber,
        name: v.visitorName || v.plateNumber,
        gateName: v.entryGate?.name || '—',
        status: v.status,
        timestamp: v.entryTime || v.createdAt,
      })),
      ...recentVisitors.map((v) => ({
        id: v.id,
        type: 'visitor' as const,
        identifier: v.visitorName,
        name: v.visitorName,
        gateName: v.entryGate?.name || '—',
        status: v.status,
        timestamp: v.entryTime || v.createdAt,
      })),
    ];

    // Sort by most recent and take top 5
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }
}
