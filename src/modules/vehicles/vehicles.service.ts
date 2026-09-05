import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { VisitingVehicle } from './entities/visiting-vehicle.entity';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  RegisterVehicleEntryDto,
  RegisterVehicleExitDto,
  VehiclesQueryDto,
} from './dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResult } from '@/shared/interfaces/paginated-result.interface';
import { paginate } from '@/shared/helpers/paginate';
import { TruckStatus } from '@/modules/trucks/enums/truck-status.enum';
import { BlacklistService } from '@/modules/blacklist/blacklist.service';
import { BlacklistType } from '@/modules/blacklist/enums/blacklist-type.enum';
import {
  ExcelExportHelper,
  ExcelColumn,
} from '@/shared/helpers/excel-export.helper';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { AuditAction, AuditModule } from '@/modules/audit-logs/enums/audit.enum';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VisitingVehicle)
    private readonly vehicleRepository: Repository<VisitingVehicle>,
    private readonly blacklistService: BlacklistService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<VisitingVehicle> {
    const vehicle = this.vehicleRepository.create(createVehicleDto);
    const saved = await this.vehicleRepository.save(vehicle);

    await this.auditLogsService.log({
      action: AuditAction.CREATE,
      module: AuditModule.VEHICLES,
      newValues: { id: saved.id, plateNumber: saved.plateNumber },
    });

    return saved;
  }

  async findAll(
    query: VehiclesQueryDto,
  ): Promise<PaginatedResult<VisitingVehicle>> {
    const where: any = {};

    if (query.startDate && query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = Between(new Date(query.startDate), endDate);
    } else if (query.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = LessThanOrEqual(endDate);
    }

    if (query.entryGateId) {
      where.entryGateId = query.entryGateId;
    }

    if (query.exitGateId) {
      where.exitGateId = query.exitGateId;
    }

    return paginate({
      source: this.vehicleRepository,
      query,
      searchableFields: [
        'plateNumber',
        'vehicleType',
        'visitorName',
        'companyName',
        'nrcOrLicense',
      ],
      defaultSortBy: 'createdAt',
      relations: ['entryGate', 'exitGate'],
      where,
    });
  }

  async findAllActive(
    paginationQuery: PaginationQueryDto,
    gateId?: string,
  ): Promise<PaginatedResult<VisitingVehicle>> {
    const where: any = { status: TruckStatus.ENTERED };

    if (gateId) {
      where.entryGateId = gateId;
    }

    return paginate({
      source: this.vehicleRepository,
      query: paginationQuery,
      searchableFields: [
        'plateNumber',
        'vehicleType',
        'visitorName',
        'companyName',
        'nrcOrLicense',
      ],
      defaultSortBy: 'entryTime',
      where,
      relations: ['entryGate', 'exitGate'],
    });
  }

  async findOne(id: string): Promise<VisitingVehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['entryGate', 'exitGate'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Visiting vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async registerEntry(dto: RegisterVehicleEntryDto): Promise<VisitingVehicle> {
    // Check if license plate is blacklisted
    const isPlateBlacklisted = await this.blacklistService.checkBlocked(
      BlacklistType.LICENSE_PLATE,
      dto.plateNumber,
    );
    if (isPlateBlacklisted) {
      throw new BadRequestException(
        `Vehicle with license plate ${dto.plateNumber} is blacklisted and cannot enter the port.`,
      );
    }

    // Check if NRC/License is blacklisted
    if (dto.nrcOrLicense) {
      const isNrcBlacklisted = await this.blacklistService.checkBlocked(
        BlacklistType.NRC_PASSPORT,
        dto.nrcOrLicense,
      );
      if (isNrcBlacklisted) {
        throw new BadRequestException(
          `Visitor with NRC/Passport ${dto.nrcOrLicense} is blacklisted and cannot enter the port.`,
        );
      }
    }

    const vehicle = this.vehicleRepository.create({
      ...dto,
      entryTime: new Date(),
      status: TruckStatus.ENTERED,
    });
    const saved = await this.vehicleRepository.save(vehicle);

    await this.auditLogsService.log({
      action: AuditAction.ENTRY,
      module: AuditModule.VEHICLES,
      newValues: { id: saved.id, plateNumber: saved.plateNumber },
    });

    return saved;
  }

  async registerExit(
    id: string,
    dto: RegisterVehicleExitDto,
  ): Promise<VisitingVehicle> {
    const vehicle = await this.findOne(id);

    if (vehicle.status !== TruckStatus.ENTERED) {
      throw new BadRequestException(
        `Vehicle is not in ENTERED status. Current status: ${vehicle.status}`,
      );
    }

    Object.assign(vehicle, {
      exitGateId: dto.exitGateId,
      exitTime: new Date(),
      status: TruckStatus.EXITED,
      remarks: dto.remarks ?? vehicle.remarks,
    });

    const saved = await this.vehicleRepository.save(vehicle);

    await this.auditLogsService.log({
      action: AuditAction.EXIT,
      module: AuditModule.VEHICLES,
      newValues: { id: saved.id, status: saved.status },
    });

    return saved;
  }

  async cancel(id: string): Promise<VisitingVehicle> {
    const vehicle = await this.findOne(id);
    vehicle.status = TruckStatus.CANCELLED;
    const saved = await this.vehicleRepository.save(vehicle);

    await this.auditLogsService.log({
      action: AuditAction.CANCEL,
      module: AuditModule.VEHICLES,
      newValues: { id: saved.id, status: saved.status },
    });

    return saved;
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VisitingVehicle> {
    const vehicle = await this.findOne(id);
    const oldValues = { ...vehicle };
    Object.assign(vehicle, updateVehicleDto);
    const saved = await this.vehicleRepository.save(vehicle);

    await this.auditLogsService.log({
      action: AuditAction.UPDATE,
      module: AuditModule.VEHICLES,
      oldValues: { ...oldValues },
      newValues: { id: saved.id, ...updateVehicleDto },
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.softRemove(vehicle);

    await this.auditLogsService.log({
      action: AuditAction.DELETE,
      module: AuditModule.VEHICLES,
      newValues: { id, plateNumber: vehicle.plateNumber },
    });
  }

  async exportToExcel(query: VehiclesQueryDto): Promise<Buffer> {
    const where: any = {};

    if (query.startDate && query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = Between(new Date(query.startDate), endDate);
    } else if (query.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = LessThanOrEqual(endDate);
    }

    if (query.entryGateId) {
      where.entryGateId = query.entryGateId;
    }

    if (query.exitGateId) {
      where.exitGateId = query.exitGateId;
    }

    if (query.search) {
      where.plateNumber = query.search;
    }

    const vehicles = await this.vehicleRepository.find({
      where,
      relations: ['entryGate', 'exitGate'],
      order: { createdAt: 'DESC' },
    });

    const workbook = await ExcelExportHelper.createWorkbook();
    const worksheet = ExcelExportHelper.addWorksheet(
      workbook,
      'Visiting Vehicles',
    );

    const columns: ExcelColumn[] = [
      { header: 'Plate Number', key: 'plateNumber', width: 20 },
      { header: 'Vehicle Type', key: 'vehicleType', width: 15 },
      { header: 'Vehicle Model', key: 'vehicleModel', width: 20 },
      { header: 'Visitor Name', key: 'visitorName', width: 20 },
      { header: 'NRC/License', key: 'nrcOrLicense', width: 20 },
      { header: 'Company Name', key: 'companyName', width: 20 },
      { header: 'Purpose of Visit', key: 'purposeOfVisit', width: 20 },
      { header: 'Entry Gate', key: 'entryGate', width: 15 },
      { header: 'Exit Gate', key: 'exitGate', width: 15 },
      { header: 'Entry Time', key: 'entryTime', width: 20 },
      { header: 'Exit Time', key: 'exitTime', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];

    ExcelExportHelper.setColumns(worksheet, columns);

    const rows = vehicles.map((vehicle) => ({
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType,
      vehicleModel: vehicle.vehicleModel,
      visitorName: vehicle.visitorName,
      nrcOrLicense: vehicle.nrcOrLicense || '',
      companyName: vehicle.companyName || '',
      purposeOfVisit: vehicle.purposeOfVisit || '',
      entryGate: vehicle.entryGate?.name || '',
      exitGate: vehicle.exitGate?.name || '',
      entryTime: vehicle.entryTime ? vehicle.entryTime.toISOString() : '',
      exitTime: vehicle.exitTime ? vehicle.exitTime.toISOString() : '',
      status: vehicle.status,
      remarks: vehicle.remarks || '',
    }));

    ExcelExportHelper.addRows(worksheet, rows);
    ExcelExportHelper.styleHeaderRow(worksheet);
    ExcelExportHelper.autoFitColumns(worksheet);

    await this.auditLogsService.log({
      action: AuditAction.EXPORT,
      module: AuditModule.VEHICLES,
      newValues: { count: vehicles.length, search: query.search || null },
    });

    return ExcelExportHelper.generateBuffer(workbook);
  }
}
