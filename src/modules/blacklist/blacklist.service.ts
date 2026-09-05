import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blacklist } from './entities/blacklist.entity';
import { CreateBlacklistDto, UpdateBlacklistDto } from './dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResult } from '@/shared/interfaces/paginated-result.interface';
import { paginate } from '@/shared/helpers/paginate';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { AuditAction, AuditModule } from '@/modules/audit-logs/enums/audit.enum';

@Injectable()
export class BlacklistService {
  constructor(
    @InjectRepository(Blacklist)
    private readonly blacklistRepository: Repository<Blacklist>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createBlacklistDto: CreateBlacklistDto): Promise<Blacklist> {
    const existingBlock = await this.blacklistRepository.findOne({
      where: {
        type: createBlacklistDto.type,
        value: createBlacklistDto.value,
        isActive: true,
      },
    });

    if (existingBlock) {
      throw new ConflictException(
        `${createBlacklistDto.type} "${createBlacklistDto.value}" is already blocked`,
      );
    }

    const blacklist = this.blacklistRepository.create({
      ...createBlacklistDto,
      blockedAt: new Date(),
    });
    const saved = await this.blacklistRepository.save(blacklist);

    await this.auditLogsService.log({
      action: AuditAction.CREATE,
      module: AuditModule.BLACKLIST,
      newValues: {
        id: saved.id,
        type: saved.type,
        value: saved.value,
        reason: saved.reason,
      },
    });

    return saved;
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<Blacklist>> {
    return paginate({
      source: this.blacklistRepository,
      query: paginationQuery,
      searchableFields: ['value', 'reason'],
      defaultSortBy: 'blockedAt',
    });
  }

  async findOne(id: string): Promise<Blacklist> {
    const blacklist = await this.blacklistRepository.findOne({ where: { id } });
    if (!blacklist) {
      throw new NotFoundException(`Blacklist entry with ID ${id} not found`);
    }
    return blacklist;
  }

  async findByTypeAndValue(
    type: string,
    value: string,
  ): Promise<Blacklist | null> {
    return this.blacklistRepository.findOne({
      where: { type: type as any, value, isActive: true },
    });
  }

  async update(
    id: string,
    updateBlacklistDto: UpdateBlacklistDto,
  ): Promise<Blacklist> {
    const blacklist = await this.findOne(id);

    if (updateBlacklistDto.type && updateBlacklistDto.value) {
      const existingBlock = await this.blacklistRepository.findOne({
        where: {
          type: updateBlacklistDto.type,
          value: updateBlacklistDto.value,
          isActive: true,
        },
      });

      if (existingBlock && existingBlock.id !== id) {
        throw new ConflictException(
          `${updateBlacklistDto.type} "${updateBlacklistDto.value}" is already blocked`,
        );
      }
    }

    Object.assign(blacklist, updateBlacklistDto);
    const saved = await this.blacklistRepository.save(blacklist);

    await this.auditLogsService.log({
      action: AuditAction.UPDATE,
      module: AuditModule.BLACKLIST,
      oldValues: { id: saved.id, type: saved.type, value: saved.value },
      newValues: { id: saved.id, ...updateBlacklistDto },
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const blacklist = await this.findOne(id);
    await this.blacklistRepository.softRemove(blacklist);

    await this.auditLogsService.log({
      action: AuditAction.DELETE,
      module: AuditModule.BLACKLIST,
      newValues: { id, type: blacklist.type, value: blacklist.value },
    });
  }

  async checkBlocked(type: string, value: string): Promise<boolean> {
    const block = await this.findByTypeAndValue(type, value);
    return !!block;
  }
}
