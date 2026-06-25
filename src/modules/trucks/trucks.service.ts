import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContainerTruck } from './entities/container-truck.entity';
import {
  CreateTruckDto,
  UpdateTruckDto,
  RegisterTruckEntryDto,
  RegisterTruckExitDto,
} from './dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResult } from '@/shared/interfaces/paginated-result.interface';
import { paginate } from '@/shared/helpers/paginate';
import { TruckStatus } from './enums/truck-status.enum';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(ContainerTruck)
    private readonly containerTruckRepository: Repository<ContainerTruck>,
  ) {}

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<ContainerTruck>> {
    return paginate({
      source: this.containerTruckRepository,
      query: paginationQuery,
      searchableFields: ['licensePlate', 'containerNumber', 'driverName', 'driverNrc'],
      defaultSortBy: 'createdAt',
      relations: ['entryGate', 'exitGate'],
    });
  }

  async findOne(id: string): Promise<ContainerTruck> {
    const truck = await this.containerTruckRepository.findOne({ where: { id } });
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

  async registerExit(id: string, dto: RegisterTruckExitDto): Promise<ContainerTruck> {
    const truck = await this.findOne(id);
    truck.exitGateId = dto.exitGateId;
    truck.exitTime = new Date();
    truck.status = TruckStatus.EXITED;

    if (dto.remarks) {
      truck.remarks = dto.remarks;
    }

    return this.containerTruckRepository.save(truck);
  }

  async update(id: string, updateTruckDto: UpdateTruckDto): Promise<ContainerTruck> {
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

  async findAllActive(): Promise<ContainerTruck[]> {
    return this.containerTruckRepository.find({
      where: { status: TruckStatus.ENTERED },
      relations: ['entryGate', 'exitGate'],
    });
  }
}
