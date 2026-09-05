import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Visitor } from './entities/visitor.entity';
import {
  CreateVisitorDto,
  UpdateVisitorDto,
  RegisterVisitorEntryDto,
  RegisterVisitorExitDto,
  VisitorsQueryDto,
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
export class VisitorsService {
  constructor(
    @InjectRepository(Visitor)
    private readonly visitorRepository: Repository<Visitor>,
    private readonly blacklistService: BlacklistService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createVisitorDto: CreateVisitorDto): Promise<Visitor> {
    const visitor = this.visitorRepository.create(createVisitorDto);
    const saved = await this.visitorRepository.save(visitor);

    await this.auditLogsService.log({
      action: AuditAction.CREATE,
      module: AuditModule.VISITORS,
      newValues: { id: saved.id, visitorName: saved.visitorName },
    });

    return saved;
  }

  async findAll(query: VisitorsQueryDto): Promise<PaginatedResult<Visitor>> {
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
      source: this.visitorRepository,
      query,
      searchableFields: [
        'visitorName',
        'nrcOrPassport',
        'companyName',
        'hostEmployee',
      ],
      defaultSortBy: 'createdAt',
      relations: ['entryGate', 'exitGate'],
      where,
    });
  }

  async findOne(id: string): Promise<Visitor> {
    const visitor = await this.visitorRepository.findOne({
      where: { id },
      relations: ['entryGate', 'exitGate'],
    });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    return visitor;
  }

  async registerEntry(
    registerVisitorEntryDto: RegisterVisitorEntryDto,
  ): Promise<Visitor> {
    // Check if NRC/Passport is blacklisted
    if (registerVisitorEntryDto.nrcOrPassport) {
      const isNrcBlacklisted = await this.blacklistService.checkBlocked(
        BlacklistType.NRC_PASSPORT,
        registerVisitorEntryDto.nrcOrPassport,
      );
      if (isNrcBlacklisted) {
        throw new BadRequestException(
          `Visitor with NRC/Passport ${registerVisitorEntryDto.nrcOrPassport} is blacklisted and cannot enter the port.`,
        );
      }
    }

    const visitor = this.visitorRepository.create({
      ...registerVisitorEntryDto,
      status: TruckStatus.ENTERED,
      entryTime: new Date(),
    });

    const saved = await this.visitorRepository.save(visitor);

    await this.auditLogsService.log({
      action: AuditAction.ENTRY,
      module: AuditModule.VISITORS,
      newValues: { id: saved.id, visitorName: saved.visitorName },
    });

    return saved;
  }

  async registerExit(
    id: string,
    registerVisitorExitDto: RegisterVisitorExitDto,
  ): Promise<Visitor> {
    const visitor = await this.findOne(id);

    if (visitor.status !== TruckStatus.ENTERED) {
      throw new NotFoundException(
        `Visitor with ID ${id} is not currently entered`,
      );
    }

    visitor.exitGateId = registerVisitorExitDto.exitGateId;
    visitor.exitTime = new Date();
    visitor.status = TruckStatus.EXITED;

    if (registerVisitorExitDto.remarks) {
      visitor.remarks = visitor.remarks
        ? `${visitor.remarks}\n${registerVisitorExitDto.remarks}`
        : registerVisitorExitDto.remarks;
    }

    const saved = await this.visitorRepository.save(visitor);

    await this.auditLogsService.log({
      action: AuditAction.EXIT,
      module: AuditModule.VISITORS,
      newValues: { id: saved.id, status: saved.status },
    });

    return saved;
  }

  async update(
    id: string,
    updateVisitorDto: UpdateVisitorDto,
  ): Promise<Visitor> {
    const visitor = await this.findOne(id);
    const oldValues = { ...visitor };
    Object.assign(visitor, updateVisitorDto);
    const saved = await this.visitorRepository.save(visitor);

    await this.auditLogsService.log({
      action: AuditAction.UPDATE,
      module: AuditModule.VISITORS,
      oldValues: { ...oldValues },
      newValues: { id: saved.id, ...updateVisitorDto },
    });

    return saved;
  }

  async cancel(id: string): Promise<Visitor> {
    const visitor = await this.findOne(id);

    if (visitor.status === TruckStatus.EXITED) {
      throw new NotFoundException(
        `Visitor with ID ${id} has already exited and cannot be cancelled`,
      );
    }

    visitor.status = TruckStatus.CANCELLED;
    const saved = await this.visitorRepository.save(visitor);

    await this.auditLogsService.log({
      action: AuditAction.CANCEL,
      module: AuditModule.VISITORS,
      newValues: { id: saved.id, status: saved.status },
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const visitor = await this.findOne(id);
    await this.visitorRepository.softRemove(visitor);

    await this.auditLogsService.log({
      action: AuditAction.DELETE,
      module: AuditModule.VISITORS,
      newValues: { id, visitorName: visitor.visitorName },
    });
  }

  async findAllActive(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<Visitor>> {
    return paginate({
      source: this.visitorRepository,
      query: paginationQuery,
      searchableFields: [
        'visitorName',
        'nrcOrPassport',
        'companyName',
        'hostEmployee',
      ],
      defaultSortBy: 'entryTime',
      where: { status: TruckStatus.ENTERED },
      relations: ['entryGate', 'exitGate'],
    });
  }

  async exportToExcel(query: VisitorsQueryDto): Promise<Buffer> {
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
      where.visitorName = query.search;
    }

    const visitors = await this.visitorRepository.find({
      where,
      relations: ['entryGate', 'exitGate'],
      order: { createdAt: 'DESC' },
    });

    const workbook = await ExcelExportHelper.createWorkbook();
    const worksheet = ExcelExportHelper.addWorksheet(workbook, 'Visitors');

    const columns: ExcelColumn[] = [
      { header: 'Visitor Name', key: 'visitorName', width: 20 },
      { header: 'NRC/Passport', key: 'nrcOrPassport', width: 20 },
      { header: 'Company Name', key: 'companyName', width: 20 },
      { header: 'Host Employee', key: 'hostEmployee', width: 20 },
      { header: 'Entry Gate', key: 'entryGate', width: 15 },
      { header: 'Exit Gate', key: 'exitGate', width: 15 },
      { header: 'Entry Time', key: 'entryTime', width: 20 },
      { header: 'Exit Time', key: 'exitTime', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];

    ExcelExportHelper.setColumns(worksheet, columns);

    const rows = visitors.map((visitor) => ({
      visitorName: visitor.visitorName,
      nrcOrPassport: visitor.nrcOrPassport || '',
      companyName: visitor.companyName || '',
      hostEmployee: visitor.hostEmployee || '',
      entryGate: visitor.entryGate?.name || '',
      exitGate: visitor.exitGate?.name || '',
      entryTime: visitor.entryTime ? visitor.entryTime.toISOString() : '',
      exitTime: visitor.exitTime ? visitor.exitTime.toISOString() : '',
      status: visitor.status,
      remarks: visitor.remarks || '',
    }));

    ExcelExportHelper.addRows(worksheet, rows);
    ExcelExportHelper.styleHeaderRow(worksheet);
    ExcelExportHelper.autoFitColumns(worksheet);

    await this.auditLogsService.log({
      action: AuditAction.EXPORT,
      module: AuditModule.VISITORS,
      newValues: { count: visitors.length, search: query.search || null },
    });

    return ExcelExportHelper.generateBuffer(workbook);
  }
}
