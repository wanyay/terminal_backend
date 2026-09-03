import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { ContainerTruck } from './entities/container-truck.entity';
import {
  CreateTruckDto,
  UpdateTruckDto,
  RegisterTruckEntryDto,
  RegisterTruckExitDto,
  TrucksQueryDto,
} from './dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResult } from '@/shared/interfaces/paginated-result.interface';
import { paginate } from '@/shared/helpers/paginate';
import { TruckStatus } from './enums/truck-status.enum';
import { BlacklistService } from '@/modules/blacklist/blacklist.service';
import { BlacklistType } from '@/modules/blacklist/enums/blacklist-type.enum';
import {
  ExcelExportHelper,
  ExcelColumn,
} from '@/shared/helpers/excel-export.helper';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(ContainerTruck)
    private readonly containerTruckRepository: Repository<ContainerTruck>,
    private readonly blacklistService: BlacklistService,
  ) {}

  async findAll(
    query: TrucksQueryDto,
  ): Promise<PaginatedResult<ContainerTruck>> {
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
      source: this.containerTruckRepository,
      query,
      searchableFields: [
        'licensePlate',
        'containerNumber',
        'driverName',
        'driverNrc',
      ],
      defaultSortBy: 'createdAt',
      relations: ['entryGate', 'exitGate'],
      where,
    });
  }

  async findOne(id: string): Promise<ContainerTruck> {
    const truck = await this.containerTruckRepository.findOne({
      where: { id },
    });
    if (!truck) {
      throw new NotFoundException(`Container truck with ID ${id} not found`);
    }
    return truck;
  }

  async create(createTruckDto: CreateTruckDto): Promise<ContainerTruck> {
    const truck = this.containerTruckRepository.create({
      ...createTruckDto,
      status: TruckStatus.ENTERED,
    });

    if (createTruckDto.entryGateId) {
      truck.entryTime = new Date();
    }

    return this.containerTruckRepository.save(truck);
  }

  async registerEntry(dto: RegisterTruckEntryDto): Promise<ContainerTruck> {
    // Check if license plate is blacklisted
    const isPlateBlacklisted = await this.blacklistService.checkBlocked(
      BlacklistType.LICENSE_PLATE,
      dto.licensePlate,
    );
    if (isPlateBlacklisted) {
      throw new BadRequestException(
        `Vehicle with license plate ${dto.licensePlate} is blacklisted and cannot enter the port.`,
      );
    }

    // Check if driver NRC is blacklisted
    if (dto.driverNrc) {
      const isNrcBlacklisted = await this.blacklistService.checkBlocked(
        BlacklistType.NRC_PASSPORT,
        dto.driverNrc,
      );
      if (isNrcBlacklisted) {
        throw new BadRequestException(
          `Driver with NRC ${dto.driverNrc} is blacklisted and cannot enter the port.`,
        );
      }
    }

    const truck = this.containerTruckRepository.create({
      licensePlate: dto.licensePlate,
      containerNumber: dto.containerNumber,
      driverName: dto.driverName,
      driverNrc: dto.driverNrc,
      entryGateId: dto.entryGateId,
      remarks: dto.remarks,
      status: TruckStatus.ENTERED,
      entryTime: new Date(),
    });

    return this.containerTruckRepository.save(truck);
  }

  async registerExit(
    id: string,
    dto: RegisterTruckExitDto,
  ): Promise<ContainerTruck> {
    const truck = await this.findOne(id);
    truck.exitGateId = dto.exitGateId;
    truck.exitTime = new Date();
    truck.status = TruckStatus.EXITED;

    if (dto.remarks) {
      truck.remarks = dto.remarks;
    }

    return this.containerTruckRepository.save(truck);
  }

  async update(
    id: string,
    updateTruckDto: UpdateTruckDto,
  ): Promise<ContainerTruck> {
    const truck = await this.findOne(id);
    Object.assign(truck, updateTruckDto);
    return this.containerTruckRepository.save(truck);
  }

  async cancel(id: string): Promise<ContainerTruck> {
    const truck = await this.findOne(id);
    truck.status = TruckStatus.CANCELLED;
    return this.containerTruckRepository.save(truck);
  }

  async remove(id: string): Promise<void> {
    const truck = await this.findOne(id);
    await this.containerTruckRepository.softRemove(truck);
  }

  async findAllActive(
    paginationQuery: PaginationQueryDto,
    gateId?: string,
  ): Promise<PaginatedResult<ContainerTruck>> {
    const where: any = { status: TruckStatus.ENTERED };

    if (gateId) {
      where.entryGateId = gateId;
    }

    return paginate({
      source: this.containerTruckRepository,
      query: paginationQuery,
      searchableFields: [
        'licensePlate',
        'containerNumber',
        'driverName',
        'driverNrc',
      ],
      defaultSortBy: 'entryTime',
      where,
      relations: ['entryGate', 'exitGate'],
    });
  }

  async exportToExcel(query: TrucksQueryDto): Promise<Buffer> {
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
      where.licensePlate = query.search;
    }

    const trucks = await this.containerTruckRepository.find({
      where,
      relations: ['entryGate', 'exitGate'],
      order: { createdAt: 'DESC' },
    });

    const workbook = await ExcelExportHelper.createWorkbook();
    const worksheet = ExcelExportHelper.addWorksheet(
      workbook,
      'Container Trucks',
    );

    const columns: ExcelColumn[] = [
      { header: 'License Plate', key: 'licensePlate', width: 20 },
      { header: 'Container Number', key: 'containerNumber', width: 20 },
      { header: 'Driver Name', key: 'driverName', width: 20 },
      { header: 'Driver NRC', key: 'driverNrc', width: 20 },
      { header: 'Entry Gate', key: 'entryGate', width: 15 },
      { header: 'Exit Gate', key: 'exitGate', width: 15 },
      { header: 'Entry Time', key: 'entryTime', width: 20 },
      { header: 'Exit Time', key: 'exitTime', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];

    ExcelExportHelper.setColumns(worksheet, columns);

    const rows = trucks.map((truck) => ({
      licensePlate: truck.licensePlate,
      containerNumber: truck.containerNumber,
      driverName: truck.driverName,
      driverNrc: truck.driverNrc,
      entryGate: truck.entryGate?.name || '',
      exitGate: truck.exitGate?.name || '',
      entryTime: truck.entryTime ? truck.entryTime.toISOString() : '',
      exitTime: truck.exitTime ? truck.exitTime.toISOString() : '',
      status: truck.status,
      remarks: truck.remarks || '',
    }));

    ExcelExportHelper.addRows(worksheet, rows);
    ExcelExportHelper.styleHeaderRow(worksheet);
    ExcelExportHelper.autoFitColumns(worksheet);

    return ExcelExportHelper.generateBuffer(workbook);
  }
}
