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
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { AuditAction, AuditModule } from '@/modules/audit-logs/enums/audit.enum';

@Injectable()
export class GatesService {
  constructor(
    @InjectRepository(Gate)
    private readonly gateRepository: Repository<Gate>,
    private readonly auditLogsService: AuditLogsService,
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
    const saved = await this.gateRepository.save(gate);

    await this.auditLogsService.log({
      action: AuditAction.CREATE,
      module: AuditModule.GATES,
      newValues: {
        id: saved.id,
        code: saved.code,
        name: saved.name,
        type: saved.type,
      },
    });

    return saved;
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<Gate>> {
    return paginate({
      source: this.gateRepository,
      query: paginationQuery,
      searchableFields: ['name', 'description'],
      defaultSortBy: 'name',
    });
  }

  async findOne(id: string): Promise<Gate> {
    const gate = await this.gateRepository.findOne({ where: { id } });
    if (!gate) {
      throw new NotFoundException(`Gate with ID ${id} not found`);
    }
    return gate;
  }

  async findByName(name: string): Promise<Gate | null> {
    return this.gateRepository.findOne({ where: { name } });
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

    if (updateGateDto.name && updateGateDto.name !== gate.name) {
      const existingGate = await this.findByName(updateGateDto.name);
      if (existingGate) {
        throw new ConflictException(
          `Gate with name "${updateGateDto.name}" already exists`,
        );
      }
    }

    Object.assign(gate, updateGateDto);
    const saved = await this.gateRepository.save(gate);

    await this.auditLogsService.log({
      action: AuditAction.UPDATE,
      module: AuditModule.GATES,
      oldValues: { id: saved.id, code: saved.code, name: saved.name },
      newValues: { id: saved.id, ...updateGateDto },
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const gate = await this.findOne(id);
    await this.gateRepository.softRemove(gate);

    await this.auditLogsService.log({
      action: AuditAction.DELETE,
      module: AuditModule.GATES,
      newValues: { id, code: gate.code, name: gate.name },
    });
  }
}
