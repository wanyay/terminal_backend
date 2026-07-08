import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitor)
    private readonly visitorRepository: Repository<Visitor>,
  ) {}

  async create(createVisitorDto: CreateVisitorDto): Promise<Visitor> {
    const visitor = this.visitorRepository.create(createVisitorDto);
    return this.visitorRepository.save(visitor);
  }

  async findAll(query: VisitorsQueryDto): Promise<PaginatedResult<Visitor>> {
    const where: any = {};

    if (query.startDate && query.endDate) {
      where.createdAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else if (query.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      where.createdAt = LessThanOrEqual(new Date(query.endDate));
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
    const visitor = this.visitorRepository.create({
      ...registerVisitorEntryDto,
      status: TruckStatus.ENTERED,
      entryTime: new Date(),
    });

    return this.visitorRepository.save(visitor);
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

    return this.visitorRepository.save(visitor);
  }

  async update(
    id: string,
    updateVisitorDto: UpdateVisitorDto,
  ): Promise<Visitor> {
    const visitor = await this.findOne(id);
    Object.assign(visitor, updateVisitorDto);
    return this.visitorRepository.save(visitor);
  }

  async cancel(id: string): Promise<Visitor> {
    const visitor = await this.findOne(id);

    if (visitor.status === TruckStatus.EXITED) {
      throw new NotFoundException(
        `Visitor with ID ${id} has already exited and cannot be cancelled`,
      );
    }

    visitor.status = TruckStatus.CANCELLED;
    return this.visitorRepository.save(visitor);
  }

  async remove(id: string): Promise<void> {
    const visitor = await this.findOne(id);
    await this.visitorRepository.softRemove(visitor);
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
}
