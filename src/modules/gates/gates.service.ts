import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gate } from './entities/gate.entity';
import { CreateGateDto, UpdateGateDto } from './dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResult } from '@/shared/interfaces/paginated-result.interface';
import { paginate } from '@/shared/helpers/paginate';

@Injectable()
export class GatesService {
  constructor(
    @InjectRepository(Gate)
    private readonly gateRepository: Repository<Gate>,
  ) {}

  async create(createGateDto: CreateGateDto): Promise<Gate> {
    const existingGate = await this.gateRepository.findOne({
      where: { code: createGateDto.code },
    });
    if (existingGate) {
      throw new ConflictException(
        `Gate with code "${createGateDto.code}" already exists`,
      );
    }

    const gate = this.gateRepository.create(createGateDto);
    return this.gateRepository.save(gate);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<Gate>> {
    return paginate({
      source: this.gateRepository,
      query: paginationQuery,
      searchableFields: ['code', 'name', 'description'],
      defaultSortBy: 'code',
    });
  }

  async findOne(id: string): Promise<Gate> {
    const gate = await this.gateRepository.findOne({ where: { id } });
    if (!gate) {
      throw new NotFoundException(`Gate with ID ${id} not found`);
    }
    return gate;
  }

  async findByCode(code: string): Promise<Gate | null> {
    return this.gateRepository.findOne({ where: { code } });
  }

  async update(id: string, updateGateDto: UpdateGateDto): Promise<Gate> {
    const gate = await this.findOne(id);

    if (updateGateDto.code && updateGateDto.code !== gate.code) {
      const existingGate = await this.findByCode(updateGateDto.code);
      if (existingGate) {
        throw new ConflictException(
          `Gate with code "${updateGateDto.code}" already exists`,
        );
      }
    }

    Object.assign(gate, updateGateDto);
    return this.gateRepository.save(gate);
  }

  async remove(id: string): Promise<void> {
    const gate = await this.findOne(id);
    await this.gateRepository.softRemove(gate);
  }
}
