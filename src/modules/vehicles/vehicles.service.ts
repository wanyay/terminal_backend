import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitingVehicle } from './entities/visiting-vehicle.entity';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  RegisterVehicleEntryDto,
  RegisterVehicleExitDto,
} from './dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResult } from '@/shared/interfaces/paginated-result.interface';
import { paginate } from '@/shared/helpers/paginate';
import { TruckStatus } from '@/modules/trucks/enums/truck-status.enum';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VisitingVehicle)
    private readonly vehicleRepository: Repository<VisitingVehicle>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<VisitingVehicle> {
    const vehicle = this.vehicleRepository.create(createVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<VisitingVehicle>> {
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
      defaultSortBy: 'createdAt',
      relations: ['entryGate', 'exitGate'],
    });
  }

  async findAllActive(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<VisitingVehicle>> {
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
      defaultSortBy: 'createdAt',
      where: { status: TruckStatus.ENTERED },
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

  async registerEntry(
    dto: RegisterVehicleEntryDto,
  ): Promise<VisitingVehicle> {
    const vehicle = this.vehicleRepository.create({
      ...dto,
      entryTime: new Date(),
      status: TruckStatus.ENTERED,
    });
    return this.vehicleRepository.save(vehicle);
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

    return this.vehicleRepository.save(vehicle);
  }

  async cancel(id: string): Promise<VisitingVehicle> {
    const vehicle = await this.findOne(id);
    vehicle.status = TruckStatus.CANCELLED;
    return this.vehicleRepository.save(vehicle);
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VisitingVehicle> {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, updateVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.softRemove(vehicle);
  }
}
